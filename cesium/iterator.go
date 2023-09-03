// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package cesium

import (
	"context"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/x/errutil"
	"github.com/synnaxlabs/x/telem"
)

const AutoSpan = unary.AutoSpan

type IteratorConfig struct {
	Bounds   telem.TimeRange
	Channels []core.ChannelKey
}

type Iterator struct {
	internal []*unary.Iterator
}

func (db *DB) OpenIterator(cfg IteratorConfig) (*Iterator, error) {
	internal := make([]*unary.Iterator, len(cfg.Channels))
	for i, key := range cfg.Channels {
		uDB, err := db.getUnary(key)
		if err != nil {
			return nil, err
		}
		internal[i] = uDB.NewIterator(unary.IteratorConfig{Bounds: cfg.Bounds})
	}
	return &Iterator{internal: internal}, nil
}

// Next reads all data occupying the next span of time, returning true
// if the iterator has not been exhausted and has not accumulated an Error.
func (i *Iterator) Next(ctx context.Context, span telem.TimeSpan) bool {
	return i.exec(func(it *unary.Iterator) bool { return it.Next(ctx, span) })
}

// Prev implements Iterator.
func (i *Iterator) Prev(ctx context.Context, span telem.TimeSpan) bool {
	return i.exec(func(it *unary.Iterator) bool { return it.Prev(ctx, span) })
}

// SeekFirst implements Iterator.
func (i *Iterator) SeekFirst(ctx context.Context) bool {
	return i.exec(func(it *unary.Iterator) bool { return it.SeekFirst(ctx) })
}

// SeekLast implements Iterator.
func (i *Iterator) SeekLast(ctx context.Context) bool {
	return i.exec(func(it *unary.Iterator) bool { return it.SeekLast(ctx) })
}

// SeekLE implements Iterator.
func (i *Iterator) SeekLE(ctx context.Context, ts telem.TimeStamp) bool {
	return i.exec(func(it *unary.Iterator) bool { return it.SeekLE(ctx, ts) })
}

// SeekGE implements Iterator.
func (i *Iterator) SeekGE(ctx context.Context, ts telem.TimeStamp) bool {
	return i.exec(func(it *unary.Iterator) bool { return it.SeekGE(ctx, ts) })
}

func (i *Iterator) Error() error {
	for _, i := range i.internal {
		if err := i.Error(); err != nil {
			return err
		}
	}
	return nil
}

// Valid implements Iterator.
func (i *Iterator) Valid() bool {
	return i.exec(func(it *unary.Iterator) bool { return it.Valid() })
}

// SetBounds implements Iterator.
func (i *Iterator) SetBounds(bounds telem.TimeRange) {
	i.exec(func(it *unary.Iterator) bool { it.SetBounds(bounds); return true })
}

// Value implements Iterator.
func (i *Iterator) Value() Frame {
	fr := Frame{}
	for _, i := range i.internal {
		fr = fr.AppendFrame(i.Value())
	}
	return fr
}

func (i *Iterator) exec(f func(i *unary.Iterator) bool) (ok bool) {
	for _, i := range i.internal {
		if f(i) {
			ok = true
		}
	}
	return
}

func (i *Iterator) Close() error {
	c := errutil.NewCatch(errutil.WithAggregation())
	for _, i := range i.internal {
		c.Exec(i.Close)
	}
	return c.Error()
}
