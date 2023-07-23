// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package gorp

import (
	"context"

	"github.com/cockroachdb/errors"
	"github.com/samber/lo"
	"github.com/synnaxlabs/x/binary"
	"github.com/synnaxlabs/x/change"
	"github.com/synnaxlabs/x/iter"
	"github.com/synnaxlabs/x/kv"
	"github.com/synnaxlabs/x/query"
)

// Reader wraps a key-value reader to provide a strongly typed interface for
// reading entries from the DB. Readonly only accesses entries that match
// it's type arguments.
type Reader[K Key, E Entry[K]] struct {
	*lazyPrefix[K, E]
	// BaseReader is the underlying key-value reader that the Reader is wrapping.
	BaseReader
}

// WrapReader wraps the given key-value reader to provide a strongly
// typed interface for reading entries from the DB. It's important to note
// that the Reader only access to the entries provided as the type arguments
// to this function. The returned reader is safe for concurrent use.
// The following example reads from a DB:
//
//	r := gor.WrapReader[MyKey, MyEntry](db)
//
// The next example reads from a Tx:
//
//	r := gor.WrapReader[MyKey, MyEntry](tx)
func WrapReader[K Key, E Entry[K]](base BaseReader) *Reader[K, E] {
	return &Reader[K, E]{
		BaseReader: base,
		lazyPrefix: &lazyPrefix[K, E]{Tools: base},
	}
}

// Get retrieves a single entry from the database. If the entry does not exist,
// query.NotFound is returned.
func (r Reader[K, E]) Get(ctx context.Context, key K) (e E, err error) {
	bKey, err := encodeKey(ctx, r, r.prefix(ctx), key)
	if err != nil {
		return e, err
	}
	b, err := r.BaseReader.Get(ctx, bKey)
	if err != nil {
		return e, lo.Ternary(errors.Is(err, kv.NotFound), query.NotFound, err)
	}
	return e, r.Decode(ctx, b, &e)
}

// GetMany retrieves multiple entries from the database. Entries that are not
// found are simply omitted from the returned slice.
func (r Reader[K, E]) GetMany(ctx context.Context, keys []K) ([]E, error) {
	var (
		err_    error
		entries = make([]E, 0, len(keys))
	)
	for i := range keys {
		e, err := r.Get(ctx, keys[i])
		if err != nil {
			err_ = err
		} else {
			entries = append(entries, e)
		}
	}
	return entries, err_
}

// OpenIterator opens a new Iterator over the entries in the Reader.
func (r Reader[K, E]) OpenIterator() *Iterator[E] {
	return WrapIterator[E](r.BaseReader.OpenIterator(kv.IterPrefix(
		r.prefix(context.TODO()))),
		r.BaseReader,
	)
}

// OpenNexter opens a new Nexter that can be used to iterate over
// the entries in the reader in sequential order.
func (r Reader[K, E]) OpenNexter() iter.NexterCloser[E] {
	return &next[E]{Iterator: r.OpenIterator()}
}

// Iterator provides a simple wrapper around a kv.Iterator that decodes a byte-value
// before returning it to the caller. It provides no abstracted utilities for the
// iteration itself, and is focused only on maintaining a nearly identical interface to
// the underlying iterator. To create a new Iterator, call OpenIterator.
type Iterator[E any] struct {
	kv.Iterator
	err     error
	value   *E
	decoder binary.Decoder
}

// WrapIterator wraps the provided iterator. All valid calls to iter.Value are
// decoded into the entry type E.
func WrapIterator[E any](wrapped kv.Iterator, decoder binary.Decoder) *Iterator[E] {
	return &Iterator[E]{Iterator: wrapped, decoder: decoder}
}

// Value returns the decoded value from the iterator. Iterate.Alive must be true
// for calls to return a valid value.
func (k *Iterator[E]) Value(ctx context.Context) (entry *E) {
	if k.value == nil {
		k.value = new(E)
	}
	if err := k.decoder.Decode(ctx, k.Iterator.Value(), k.value); err != nil {
		k.err = err
	}
	return k.value
}

// Error returns the error accumulated by the Iterator.
func (k *Iterator[E]) Error() error {
	return lo.Ternary(k.err != nil, k.err, k.Iterator.Error())
}

// Valid returns true if the current iterator Value is pointing
// to a valid entry and the iterator has not accumulated an error.
func (k *Iterator[E]) Valid() bool {
	return lo.Ternary(k.err != nil, false, k.Iterator.Valid())
}

// WrapTxReader wraps the given key-value reader to provide a strongly
// typed interface for iterating over a transactions operations in order. The given
// tools are used to implement gorp-specific functionality, such as
// decoding. Typically, the Tools interface is satisfied by a gorp.Tx
// or a gorp.Db. The following example reads from a tx;
//
//	tx := db.OpenTx()
//	defer tx.Close()
//
//	r := gor.WrapTxReader[MyKey, MyEntry](tx.NewReader(), tx)
//
//	r, ok, err := r.Nexter(ctx)
func WrapTxReader[K Key, E Entry[K]](reader kv.TxReader, tools Tools) TxReader[K, E] {
	return TxReader[K, E]{
		TxReader:      reader,
		Tools:         tools,
		prefixMatcher: prefixMatcher[K, E](tools),
	}
}

// TxReader is a thin-wrapper around a key-value transaction reader
// that provides a strongly typed interface for iterating over a
// transactions operations in order.
type TxReader[K Key, E Entry[K]] struct {
	kv.TxReader
	Tools
	prefixMatcher func(ctx context.Context, key []byte) bool
}

// Next implements TxReader.
func (t TxReader[K, E]) Next(ctx context.Context) (op change.Change[K, E], ok bool, err error) {
	var kvOp kv.Change
	kvOp, ok, err = t.TxReader.Next(ctx)
	if !ok || err != nil {
		return op, false, err
	}
	if !t.prefixMatcher(ctx, kvOp.Key) {
		return t.Next(ctx)
	}
	op.Variant = kvOp.Variant
	if op.Variant != change.Set {
		return
	}
	if err = t.Decode(ctx, kvOp.Value, &op.Value); err != nil {
		return
	}
	op.Key = op.Value.GorpKey()
	return
}

type next[E any] struct{ *Iterator[E] }

var _ iter.NexterCloser[any] = (*next[any])(nil)

// Next implements iter.Nexter.
func (n *next[E]) Next(ctx context.Context) (e E, ok bool, err error) {
	ok = n.Iterator.Next()
	if !ok {
		return e, ok, n.Iterator.Error()
	}
	return *n.Iterator.Value(ctx), ok, n.Iterator.Error()
}
