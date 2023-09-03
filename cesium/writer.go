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

// WriterConfig is the configuration for opening a writer.
type WriterConfig struct {
	// Start marks the start timestamp of the new domain to be written. If this timestamp
	// overlaps with an existing domain for any channel in the DB, the writer will fail
	// to open.
	Start telem.TimeStamp
	// Channels mark the channels to write to. See the Writer.Write documentation for
	// more information on what the format for writing channel data should look like.
	Channels []core.ChannelKey
}

// Writer is used to write frames of telemetry data to the DB for a set of channels.
// To open a writer, call DB.OpenWriter. For details on how to write data, see the
// WriterConfig and Writer.Write documentation. A writer is transactional, meaning
// that it must be committed using Writer.Commit for the data to exist in the DB.
// A writer must be closed by calling Writer.Close after use.
type Writer struct {
	internal []*idxWriter
	err      error
}

// Write writes the given Frame to the DB under the provided context. Write rules
// are as follows:
//
//  1. Writes of channels with the same index must include data for ALL channels
//     with that index. For example, if you have two channels "a" and "b" with the
//     index "c", the frame must include data for both "a" and "b". If also writing
//     to the index ("c"), data for the index must be included.
//
//  2. Writes to the same index must have the same number of samples. For example,
//     if you have two channels "a" and "b" with the index "c", the length of series
//     for "a" and "b" must be the same.
func (w *Writer) Write(ctx context.Context, fr Frame) (Frame, bool) {
	if w.err != nil {
		return fr, false
	}
	for _, idx := range w.internal {
		fr, w.err = idx.Write(ctx, fr)
		if w.err != nil {
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
	return errors.CombineErrors(c.Error(), w.err)
}

func (w *Writer) Error() error { return w.err }

// Commit commits the writer, making all data written available for reads. If Commit
// fails, an error is returned with the reason for the failure. Commit also returns
// the timestamp of the maximum timestamp written to the DB.
func (w *Writer) Commit(ctx context.Context) (telem.TimeStamp, bool) {
	if w.err != nil {
		return telem.TimeStampMin, false
	}
	maxTS := telem.TimeStampMin
	for _, idx := range w.internal {
		ts, err := idx.Commit(ctx)
		if err != nil {
			w.err = err
			return maxTS, false
		}
		if ts > maxTS {
			maxTS = ts
		}
	}
	return maxTS, w.err == nil
}

// OpenWriter opens a new Writer using the provided configuration.
func (db *DB) OpenWriter(ctx context.Context, cfg WriterConfig) (w *Writer, err error) {
	var (
		domainWriters map[ChannelKey]*idxWriter
		rateWriters   map[telem.Rate]*idxWriter
	)

	defer func() {
		if err == nil {
			return
		}
		for _, idx := range domainWriters {
			err = errors.CombineErrors(idx.Close(), err)
		}
		for _, idx := range rateWriters {
			err = errors.CombineErrors(idx.Close(), err)
		}
	}()

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

			// Hot path optimization: in the common case we only write to a rate based
			// index or a domain indexed channel, not both. In either case we can avoid a
			// map allocation.
			if domainWriters == nil {
				domainWriters = make(map[ChannelKey]*idxWriter)
			}

			idxW, exists := domainWriters[u.Channel.Index]
			if !exists {
				idxW, err = db.openDomainIdxWriter(u.Channel.Index, cfg)
				if err != nil {
					return nil, err
				}
				idxW.writingToIdx = u.Channel.IsIndex
				domainWriters[u.Channel.Index] = idxW
			} else if u.Channel.IsIndex {
				idxW.writingToIdx = true
				domainWriters[u.Channel.Index] = idxW
			}

			idxW.internal[key] = &unaryWriterState{Writer: *w}
		} else {

			// Hot path optimization: in the common case we only write to a rate based
			// index or an indexed channel, not both. In either case we can avoid a
			// map allocation.
			if rateWriters == nil {
				rateWriters = make(map[telem.Rate]*idxWriter)
			}

			idxW, ok := rateWriters[u.Channel.Rate]
			if !ok {
				idxW = db.openRateIdxWriter(u.Channel.Rate, cfg)
				rateWriters[u.Channel.Rate] = idxW
			}

			idxW.internal[key] = &unaryWriterState{Writer: *w}
		}
	}

	w = &Writer{internal: make([]*idxWriter, 0, len(domainWriters)+len(rateWriters))}
	for _, idx := range domainWriters {
		w.internal = append(w.internal, idx)
	}
	for _, idx := range rateWriters {
		w.internal = append(w.internal, idx)
	}
	return w, nil
}

type unaryWriterState struct {
	unary.Writer
	count int64
}

// idxWriter is a writer to a set of channels that all share the same index.
type idxWriter struct {
	start telem.TimeStamp
	// internal contains writers for each channel
	internal map[ChannelKey]*unaryWriterState
	// writingToIdx is true when the Write is writing to the index
	// channel. This is typically true, which allows us to avoid
	// unnecessary lookups.
	writingToIdx bool
	// writeNum tracks the number of calls to Write that have been made.
	writeNum int64
	idx      struct {
		// Index is the index used to resolve timestamps for domains in the DB.
		index.Index
		// Key is the channel key of the index. This field is not applicable when
		// the index is rate based.
		key core.ChannelKey
		// highWaterMark is the highest timestamp written to the index. This watermark
		// is only relevant when writingToIdx is true.
		highWaterMark telem.TimeStamp
	}
	// sampleCount is the total number of samples written to the index as if it were
	// a single logical channel. I.E. N channels with M samples will result in a sample
	// count of M.
	sampleCount int64
}

func (db *DB) openDomainIdxWriter(
	chKey ChannelKey,
	cfg WriterConfig,
) (*idxWriter, error) {
	u, err := db.getUnary(chKey)
	if err != nil {
		return nil, err
	}
	idx := &index.Domain{DB: u.Ranger, Instrumentation: db.Instrumentation}
	w := &idxWriter{internal: make(map[ChannelKey]*unaryWriterState)}
	w.idx.key = chKey
	w.idx.Index = idx
	w.idx.highWaterMark = cfg.Start
	w.writingToIdx = false
	w.start = cfg.Start
	return w, nil
}

func (db *DB) openRateIdxWriter(
	rate telem.Rate,
	cfg WriterConfig,
) *idxWriter {
	idx := index.Rate{Rate: rate}
	w := &idxWriter{internal: make(map[ChannelKey]*unaryWriterState)}
	w.idx.Index = idx
	w.start = cfg.Start
	return w
}

func (w *idxWriter) Write(ctx context.Context, fr Frame) (Frame, error) {
	var (
		l = fr.Series[0].Len()
		c = 0
	)
	w.writeNum++
	for i, k := range fr.Keys {
		s, ok := w.internal[k]
		if !ok {
			return fr, errors.Wrapf(
				validate.Error,
				"writer received series for channel %s that was not specified in the writer config",
				k,
			)
		}

		if s.count == w.writeNum {
			return fr, errors.Wrapf(
				validate.Error,
				"frame must have one and only one series per channel, duplicate channel %s",
				k,
			)
		}

		s.count++
		c++

		if fr.Series[i].Len() != l {
			return fr, errors.Wrapf(
				validate.Error,
				"frame must have the same length for all series, expected %d, got %d",
				l,
				fr.Series[i].Len(),
			)
		}
	}

	if c != len(w.internal) {
		return fr, errors.Wrapf(
			validate.Error,
			"frame must have one and only one series per channel, expected %d, got %d",
			len(w.internal),
			c,
		)

	}

	for i, series := range fr.Series {
		key := fr.Keys[i]
		chW, ok := w.internal[key]
		if !ok {
			continue
		}

		if w.writingToIdx && w.idx.key == key {
			if err := w.updateHighWater(series); err != nil {
				return fr, err
			}
		}

		alignment, err := chW.Write(series)
		if err != nil {
			return fr, err
		}
		series.Alignment = alignment
		fr.Series[i] = series
	}

	w.sampleCount += l

	return fr, nil
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
	return c.Error()
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
	return w.idx.Stamp(ctx, w.start, w.sampleCount-1, true)
}
