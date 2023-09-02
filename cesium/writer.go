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
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/errutil"
	"github.com/synnaxlabs/x/telem"
	"github.com/synnaxlabs/x/validate"
)

type WriterConfig struct {
	Start    telem.TimeStamp
	Channels []core.ChannelKey
}

type Writer struct {
	WriterConfig
	// internal contains writers for each channel
	internal map[core.ChannelKey]unary.Writer
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
	seqNum      int
	err         error
	relay       confluence.Inlet[Frame]
}

func (db *DB) NewWriter(ctx context.Context, cfg WriterConfig) (*Writer, error) {
	var (
		idx          index.Index
		writingToIdx bool
		idxChannel   Channel
		internal     = make(map[core.ChannelKey]unary.Writer, len(cfg.Channels))
	)
	for i, key := range cfg.Channels {
		u, ok := db.dbs[key]
		if !ok {
			return nil, ChannelNotFound
		}
		if u.Channel.IsIndex {
			writingToIdx = true
		}
		if i == 0 {
			if u.Channel.Index != 0 {
				idxU, err := db.getUnary(u.Channel.Index)
				if err != nil {
					return nil, err
				}
				idx = &index.Domain{DB: idxU.Ranger, Instrumentation: db.Instrumentation}
				idxChannel = idxU.Channel
			} else {
				idx = index.Rate{Rate: u.Channel.Rate}
				idxChannel = u.Channel
			}
		} else {
			if err := validateSameIndex(u.Channel, idxChannel); err != nil {
				return nil, err
			}
		}
		w, err := u.NewWriter(ctx, domain.WriterConfig{Start: cfg.Start})
		if err != nil {
			return nil, err
		}
		internal[key] = *w
	}

	w := &Writer{internal: internal, relay: db.relay.inlet}
	w.Start = cfg.Start
	w.idx.key = idxChannel.Key
	w.writingToIdx = writingToIdx
	w.idx.highWaterMark = cfg.Start
	w.idx.Index = idx
	return w, nil
}

func validateSameIndex(chOne, chTwo Channel) error {
	if chOne.Index == 0 && chTwo.Index == 0 {
		if chOne.Rate != chTwo.Rate {
			return errors.Wrapf(validate.Error, "channels must have the same rate")
		}
	}
	if chOne.Index != chTwo.Index {
		return errors.Wrapf(validate.Error, "channels must have the same index")
	}
	return nil
}

func (w *Writer) Write(fr Frame) error {
	if !fr.Even() {
		return errors.Wrapf(validate.Error, "cannot Write uneven frame")
	}

	if !fr.Unary() {
		return errors.Wrapf(validate.Error, "cannot Write frame with duplicate channels")
	}

	if len(fr.Keys) != len(w.internal) {
		return errors.Wrapf(validate.Error, "cannot Write frame without data for all channels")
	}

	w.sampleCount += fr.Len()

	for i, series := range fr.Series {
		key := fr.Key(i)
		_chW, ok := w.internal[fr.Keys[i]]
		if !ok {
			return errors.Wrapf(
				validate.Error,
				"cannot Write array for channel %s that was not specified when opening the Writer",
				key,
			)
		}

		chW := &_chW

		if w.writingToIdx && w.idx.key == key {
			if err := w.updateHighWater(series); err != nil {
				return err
			}
		}

		if err := chW.Write(series); err != nil {
			return err
		}
	}

	return nil
}

func (w *Writer) Commit(ctx context.Context) (telem.TimeStamp, error) {
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

func (w *Writer) Close() error {
	c := errutil.NewCatch(errutil.WithAggregation())
	for _, chW := range w.internal {
		c.Exec(chW.Close)
	}
	return errors.CombineErrors(w.err, c.Error())
}

func (w *Writer) updateHighWater(col telem.Series) error {
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

func (w *Writer) resolveCommitEnd(ctx context.Context) (index.TimeStampApproximation, error) {
	if w.writingToIdx {
		return index.Exactly(w.idx.highWaterMark), nil
	}
	return w.idx.Stamp(ctx, w.Start, w.sampleCount-1, true)
}
