// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package unary

import (
	"context"
	"fmt"
	"github.com/synnaxlabs/cesium/internal/controller"
	"github.com/synnaxlabs/cesium/internal/domain"
	"github.com/synnaxlabs/cesium/internal/index"
	"github.com/synnaxlabs/x/override"
	"github.com/synnaxlabs/x/telem"
)

type writeControlState struct {
	counter int
	writers []*Writer
}

type DB struct {
	Config
	Domain     *domain.DB
	controller *controller.Controller[*domain.Writer]
	_idx       index.Index
}

func (db *DB) Index() index.Index {
	if !db.Channel.IsIndex {
		panic(fmt.Sprintf("[control.unary] - database %v does not support indexing", db.Channel.Key))
	}
	return db.index()
}

func (db *DB) index() index.Index {
	if db._idx == nil {
		panic("[ranger.unary] - index is not set")
	}
	return db._idx
}

func (db *DB) SetIndex(idx index.Index) { db._idx = idx }

func (db *DB) OpenWriter(ctx context.Context, cfg WriterConfig) (*Writer, error) {
	w := &Writer{WriterConfig: cfg, Channel: db.Channel, idx: db.index()}
	gateCfg := controller.Config{
		TimeRange: cfg.domain().Domain(),
		Authority: cfg.Authority,
		Name:      cfg.Name,
		Digests:   cfg.ControlDigests,
	}

	g, ok := db.controller.OpenGate(gateCfg)
	if !ok {
		dw, err := db.Domain.NewWriter(ctx, cfg.domain())
		if err != nil {
			return nil, err
		}
		gateCfg.TimeRange = dw.Domain()
		g = db.controller.RegisterAndOpenGate(gateCfg, dw)
	}
	w.control = g
	return w, nil
}

type IteratorConfig struct {
	Bounds telem.TimeRange
	// AutoChunkSize sets the maximum size of a chunk that will be returned by the
	// iterator when using AutoSpan in calls ot Next or Prev.
	AutoChunkSize int64
}

func IterRange(tr telem.TimeRange) IteratorConfig {
	return IteratorConfig{Bounds: domain.IterRange(tr).Bounds, AutoChunkSize: 0}
}

var (
	DefaultIteratorConfig = IteratorConfig{AutoChunkSize: 5e5}
)

func (i IteratorConfig) Override(other IteratorConfig) IteratorConfig {
	i.Bounds.Start = override.Numeric(i.Bounds.Start, other.Bounds.Start)
	i.Bounds.End = override.Numeric(i.Bounds.End, other.Bounds.End)
	i.AutoChunkSize = override.Numeric(i.AutoChunkSize, other.AutoChunkSize)
	return i
}

func (i IteratorConfig) ranger() domain.IteratorConfig {
	return domain.IteratorConfig{Bounds: i.Bounds}
}

func (db *DB) OpenIterator(cfg IteratorConfig) *Iterator {
	cfg = DefaultIteratorConfig.Override(cfg)
	iter := db.Domain.NewIterator(cfg.ranger())
	i := &Iterator{
		idx:            db.index(),
		Channel:        db.Channel,
		internal:       iter,
		IteratorConfig: cfg,
	}
	i.SetBounds(cfg.Bounds)
	return i
}

func (db *DB) Close() error { return db.Domain.Close() }
