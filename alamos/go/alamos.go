// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package alamos

type sub[L any] interface {
	sub(meta InstrumentationMeta) L
}

// Instrumentation is the alamos core data type, and represents a collection of
// instrumentation tools: a logger, a tracer, and a reporter.
//
// The zero-value represents a no-op instrumentation that does no logging, tracing,
// or reporting. As a result, we recommend embedding Instrumentation within the configs
// of your services, like the following:
//
//	type MyServiceConfig struct {
//		alamos.Instrumentation
//	     ...other fields
//	}
//
// This provides access to instrumentation tools directly in the config:
//
//	cfg := MyServiceConfig{}
//	// cfg.L is a no-op logger
//	cfg.L.Debug("hello world")
//
// To instantiate the config with instrumentation, use the alamos.New function:
type Instrumentation struct {
	meta InstrumentationMeta
	// L is the Logger used by this instrumentation.
	L *Logger
	// T is the Tracer used by this instrumentation.
	T *Tracer
	// R is the Reporter used by this instrumentation.
	R *Reporter
}

// IsZero returns true if the instrumentation is the zero value for its type.
func (i Instrumentation) IsZero() bool { return i.meta.IsZero() }

func (i Instrumentation) Sub(key string) Instrumentation {
	meta := i.meta.sub(key)
	return Instrumentation{
		meta: meta,
		L:    i.L.sub(meta),
		T:    i.T.sub(meta),
		R:    i.R.sub(meta),
	}
}

type InstrumentationMeta struct {
	// Key is the key used to identify this instrumentation. This key should be
	// unique within the context of its parent instrumentation (in a similar manner
	// to a file in a directory).
	Key string
	// Path is a keychain representing the parents of this instrumentation. For
	// example, an instrumentation created from 'distribution' with a key of
	// 'storage' would have a path of 'distribution.storage'.
	Path string
	// ServiceName is the name of the service.
	ServiceName string
	// Filter is the filter used by this instrumentation.
	Filter Filter
}

func (m InstrumentationMeta) sub(key string) InstrumentationMeta {
	return InstrumentationMeta{
		Key:         key,
		Path:        m.Path + "." + key,
		ServiceName: m.ServiceName,
		Filter:      m.Filter,
	}
}

// IsZero returns true if the instrumentation is the zero value for its type.
func (m InstrumentationMeta) IsZero() bool { return m.Key != "" }

type Option func(*Instrumentation)

func WithTracer(tracer *Tracer) Option {
	return func(ins *Instrumentation) {
		ins.T = tracer
	}
}

func WithReports(reports *Reporter) Option {
	return func(ins *Instrumentation) {
		ins.R = reports
	}
}

func WithLogger(logger *Logger) Option {
	return func(ins *Instrumentation) {
		ins.L = logger
	}
}

func WithFilter(filter Filter) Option {
	return func(ins *Instrumentation) {
		ins.meta.Filter = filter
	}
}

func WithServiceName(serviceName string) Option {
	return func(ins *Instrumentation) {
		ins.meta.ServiceName = serviceName
	}
}

func New(key string, options ...Option) Instrumentation {
	ins := Instrumentation{meta: InstrumentationMeta{Key: key}}
	for _, option := range options {
		option(&ins)
	}
	return ins
}
