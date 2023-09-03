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
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/domain"
	"github.com/synnaxlabs/cesium/internal/index"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/x/errutil"
	"github.com/synnaxlabs/x/telem"
	"github.com/synnaxlabs/x/validate"
)

type WriterConfig struct {
	Start    telem.TimeStamp
	Channels []core.ChannelKey
}

type idxWriter struct {
	WriterConfig
	// internal contains writers for each channel
	internal map[ChannelKey]unary.Writer
	// writingToIdx is true when the Write is writing to the index
	// channel. This is typically true, which allows us to avoid
	// unnecessary lookups.
	writingToIdx bool
	idx          struct {
		index.Index
		key           core.ChannelKey
		highWaterMark telem.TimeStamp
	}
	sampleCount int64
	err         error
}

type Writer struct {
	internal []idxWriter
}

func (w *Writer) Write(ctx context.Context, fr Frame) (Frame, bool) {
	var ok bool
	for _, idx_ := range w.internal {
		idx := &idx_
		if idx.err != nil {
			return fr, false
		}
		fr, ok = idx.Write(ctx, fr)
		if !ok {
			return fr, false
		}
	}
	return fr, true
}

func (w *Writer) Close() error {
	c := errutil.NewCatch(errutil.WithAggregation())
	for _, idx := range w.internal {
		c.Exec(idx.Close)
	}
	return c.Error()
}

func (w *Writer) Commit(ctx context.Context) (telem.TimeStamp, error) {
	maxTS := telem.TimeStampMin
	for _, idx := range w.internal {
		ts, err := idx.Commit(ctx)
		if err != nil {
			return 0, err
		}
		if ts > maxTS {
			maxTS = ts
		}
	}
	return maxTS, nil
}

func (db *DB) OpenWriter(ctx context.Context, cfg WriterConfig) (*Writer, error) {
	var (
		idxInternal  map[ChannelKey]idxWriter
		rateInternal map[telem.Rate]idxWriter
	)
	for _, key := range cfg.Channels {
		u, ok := db.dbs[key]
		if !ok {
			return nil, ChannelNotFound
		}
		w, err := u.OpenWriter(ctx, domain.WriterConfig{Start: cfg.Start})
		if err != nil {
			return nil, err
		}
		if u.Channel.Index != 0 {
			if idxInternal == nil {
				idxInternal = make(map[ChannelKey]idxWriter)
			}

			idxW, ok := idxInternal[u.Channel.Index]
			if !ok {
				idxU, err := db.getUnary(u.Channel.Index)
				if err != nil {
					return nil, err
				}
				idx := &index.Domain{DB: idxU.Ranger, Instrumentation: db.Instrumentation}
				idxChannel := idxU.Channel
				idxW = idxWriter{internal: make(map[ChannelKey]unary.Writer)}
				idxW.idx.key = idxChannel.Key
				idxW.idx.Index = idx
				idxW.Start = cfg.Start
				idxW.writingToIdx = u.Channel.IsIndex
				idxW.idx.highWaterMark = cfg.Start
				idxInternal[idxChannel.Key] = idxW
			} else if u.Channel.IsIndex {
				idxW.writingToIdx = true
			}

			idxW.internal[key] = *w
		} else {
			if rateInternal == nil {
				rateInternal = make(map[telem.Rate]idxWriter)
			}
			idxW, ok := rateInternal[u.Channel.Rate]
			if !ok {
				idx := index.Rate{Rate: u.Channel.Rate}
				idxChannel := u.Channel
				idxW = idxWriter{internal: make(map[ChannelKey]unary.Writer)}
				idxW.idx.key = idxChannel.Key
				idxW.idx.Index = idx
				idxW.Start = cfg.Start
				idxW.idx.highWaterMark = cfg.Start
				rateInternal[idxChannel.Rate] = idxW
			}
		}
	}

	w := &Writer{internal: make([]idxWriter, 0, len(idxInternal)+len(rateInternal))}
	for _, idx := range idxInternal {
		w.internal = append(w.internal, idx)
	}
	for _, idx := range rateInternal {
		w.internal = append(w.internal, idx)
	}
	return w, nil
}

func (w *idxWriter) Write(ctx context.Context, fr Frame) (Frame, bool) {
	if w.err != nil {
		return fr, false
	}

	c := 0
	l := fr.Series[0].Len()
	for i, k := range fr.Keys {
		_, ok := w.internal[k]
		if ok {
			c++
		}
		if fr.Series[i].Len() != l {
			w.err = errors.Wrapf(
				validate.Error,
				"frame must have the same length for all series, expected %d, got %d",
				l,
				fr.Series[i].Len(),
			)
			return fr, false
		}
	}

	if c != len(w.internal) {
		w.err = errors.Wrapf(
			validate.Error,
			"frame must have exactly one series for all channels, expected %d, got %d",
			c,
			len(w.internal),
		)
		return fr, false
	}

	for i, series := range fr.Series {
		key := fr.Keys[i]
		_chW, ok := w.internal[key]
		if !ok {
			continue
		}

		chW := &_chW

		if w.writingToIdx && w.idx.key == key {
			if err := w.updateHighWater(series); err != nil {
				w.err = err
				return fr, false
			}
		}

		alignment, err := chW.Write(series)
		if err != nil {
			w.err = err
			return fr, false
		}
		series.Alignment = alignment
		fr.Series[i] = series
	}

	return fr, w.err == nil
}

func (w *idxWriter) Error() error {
	return w.err
}

func (w *idxWriter) Commit(ctx context.Context) (telem.TimeStamp, error) {
	end, err := w.resolveCommitEnd(ctx)
	if err != nil {
		return end.Lower, err
	}
	// because the range is exclusive, we need to add 1 nanosecond to the end
	end.Lower++
	c := errutil.NewCatch(errutil.WithAggregation())
	for _, chW := range w.internal {
		c.Exec(func() error { return chW.CommitWithEnd(ctx, end.Lower) })
	}
	return end.Lower, c.Error()
}

func (w *idxWriter) Close() error {
	c := errutil.NewCatch(errutil.WithAggregation())
	for _, chW := range w.internal {
		c.Exec(chW.Close)
	}
	return errors.CombineErrors(w.err, c.Error())
}

func (w *idxWriter) updateHighWater(col telem.Series) error {
	if col.DataType != telem.TimeStampT && col.DataType != telem.Int64T {
		return errors.Wrapf(
			validate.Error,
			"invalid data type for channel %s, expected %s, got %s",
			w.idx.key, telem.TimeStampT,
			col.DataType,
		)
	}
	w.idx.highWaterMark = telem.ValueAt[telem.TimeStamp](col, col.Len()-1)
	return nil
}

func (w *idxWriter) resolveCommitEnd(ctx context.Context) (index.TimeStampApproximation, error) {
	if w.writingToIdx {
		return index.Exactly(w.idx.highWaterMark), nil
	}
	return w.idx.Stamp(ctx, w.Start, w.sampleCount-1, true)
}
