// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package writer

import (
	"context"
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/storage/framer"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/signal"
)

// newGateway opens a new StreamWriter that writes to the store on the gateway node.
func (s *Service) newGateway(ctx context.Context, cfg Config) (StreamWriter, error) {
	wrapped, err := s.Storage.OpenWriter(ctx, cfg.toStorage())
	w := newGatewayWriter(s.HostResolver.HostKey(), wrapped)
	return w, err
}

type gatewayWriter struct {
	confluence.LinearTransform[Request, Response]
	nodeKey core.NodeKey
	wrapped *framer.Writer
	seqNum  int
}

func newGatewayWriter(nodeKey core.NodeKey, writer *framer.Writer) *gatewayWriter {
	return &gatewayWriter{nodeKey: nodeKey, wrapped: writer}
}

func (w *gatewayWriter) Flow(ctx signal.Context, opts ...confluence.Option) {
	w.LinearTransform.Flow(ctx, append(opts, confluence.DeferErr(w.wrapped.Close))...)
}

func (w *gatewayWriter) transform(ctx context.Context, in Request) (res Response, ok bool, err error) {
	ok = true
	switch in.Command {
	case Data:
		res.Ack = w.wrapped.Write(ctx, in.Frame.ToStorage())
		if res.Ack {
			ok = false
		}
	case Error:
		res.Error = w.wrapped.Error()
		w.seqNum++
	case Commit:
		res.End, res.Ack = w.wrapped.Commit(ctx)
		w.seqNum++
	}
	res.SeqNum = w.seqNum
	res.Command = in.Command
	res.NodeKey = w.nodeKey
	return
}
