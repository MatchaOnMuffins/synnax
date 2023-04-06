// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package kv

import (
	"context"
	"fmt"
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/alamos"
	"github.com/synnaxlabs/aspen/internal/node"
	"github.com/synnaxlabs/x/binary"
	kvx "github.com/synnaxlabs/x/kv"
	"go.uber.org/zap"
	"sync"
)

type writer struct {
	kvx.Writer
	digests []Digest
	lease   *leaseAllocator
	apply   func(reqs []WriteRequest) error
}

var _ kvx.Writer = (*writer)(nil)

func (b *writer) Set(key []byte, value []byte, maybeLease ...interface{}) error {
	lease, err := validateLeaseOption(maybeLease)
	if err != nil {
		return err
	}
	return b.applyOp(Operation{
		Key:         key,
		Value:       value,
		Variant:     Set,
		Leaseholder: lease,
	})
}

func (b *writer) Delete(key []byte) error {
	return b.applyOp(Operation{Key: key, Variant: Delete})
}

func (b *writer) applyOp(op Operation) error {
	var err error
	op, err = b.lease.allocate(b.Writer.Context(), op)
	if err != nil {
		return err
	}
	if op.Variant == Delete {
		if err := b.Writer.Delete(op.Key); err != nil {
			return err
		}
	} else {
		if err := b.Writer.Set(op.Key, op.Value); err != nil {
			return err
		}
	}
	op.Key = binary.MakeCopy(op.Key)
	b.digests = append(b.digests, op.Digest())
	return nil
}

func (b *writer) toRequests() ([]WriteRequest, error) {
	dm := make(map[node.ID]WriteRequest)
	for _, dig := range b.digests {
		op := dig.Operation()
		if op.Variant == Set {
			v, err := b.Get(dig.Key)
			if err != nil && err != kvx.NotFound {
				return nil, err
			}
			op.Value = binary.MakeCopy(v)
		}
		br, ok := dm[op.Leaseholder]
		if !ok {
			br.Operations = []Operation{op}
			br.ctx = b.Context()
		} else {
			br.Operations = append(br.Operations, op)
		}
		br.Leaseholder = op.Leaseholder
		br.ctx, br.span = alamos.Trace(
			b.Context(),
			fmt.Sprintf("writer-%d", br.Leaseholder),
			alamos.DebugLevel,
		)
		dm[op.Leaseholder] = br
	}
	data := make([]WriteRequest, 0, len(dm))
	for _, d := range dm {
		data = append(data, d)
	}
	return data, b.free()
}

func (b *writer) Close() error { return b.free() }

func (b *writer) Commit(_ ...interface{}) error {
	data, err := b.toRequests()
	if err != nil {
		return err
	}
	return b.apply(data)
}

func (b *writer) free() error {
	b.digests = nil
	return b.Writer.Close()
}

type WriteRequest struct {
	Leaseholder node.ID
	Sender      node.ID
	Operations  []Operation
	ctx         context.Context
	doneF       func(err error)
	span        alamos.Span
}

func (br WriteRequest) empty() bool { return len(br.Operations) == 0 }

func (br WriteRequest) size() int { return len(br.Operations) }

func (br WriteRequest) logArgs() []zap.Field {
	return []zap.Field{
		zap.Int("size", br.size()),
		zap.Uint64("leaseholder", uint64(br.Leaseholder)),
		zap.Uint64("sender", uint64(br.Sender)),
	}
}

func (br WriteRequest) digests() []Digest {
	digests := make([]Digest, len(br.Operations))
	for i, op := range br.Operations {
		digests[i] = op.Digest()
	}
	return digests
}

func (br WriteRequest) commitTo(bw kvx.Writeable) error {
	var err error
	b := bw.NewWriter(br.ctx)

	defer func() {
		br.Operations = nil
		if _err := b.Commit(br.ctx); _err != nil {
			err = _err
		}
		br.done(err)
	}()

	for _, op := range br.Operations {
		if _err := op.apply(b); _err != nil {
			err = _err
			return err
		}
		if _err := op.Digest().apply(b); _err != nil {
			err = _err
			return err
		}
	}

	return err
}

func (br WriteRequest) done(err error) {
	if br.doneF != nil {
		br.doneF(err)
	}
	if br.span != nil {
		br.span.End()
	}
}

func validateLeaseOption(maybeLease []interface{}) (node.ID, error) {
	lease := DefaultLeaseholder
	if len(maybeLease) == 1 {
		l, ok := maybeLease[0].(node.ID)
		if !ok {
			return 0, errors.New("[aspen] - Leaseholder option must be of type node.ID")
		}
		lease = l
	}
	return lease, nil
}

type batchCoordinator struct {
	wg sync.WaitGroup
	mu struct {
		sync.Mutex
		err error
	}
}

func (bc *batchCoordinator) done(err error) {
	bc.mu.Lock()
	defer bc.mu.Unlock()
	if err != nil {
		bc.mu.err = err
	}
	bc.wg.Done()
}

func (bc *batchCoordinator) wait() error {
	bc.wg.Wait()
	return bc.mu.err
}

func (bc *batchCoordinator) add(data *WriteRequest) {
	bc.wg.Add(1)
	data.doneF = bc.done
}
