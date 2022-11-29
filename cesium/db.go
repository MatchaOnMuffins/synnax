package cesium

import (
	"github.com/cockroachdb/errors"
	"github.com/samber/lo"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/x/errutil"
	"github.com/synnaxlabs/x/query"
	"github.com/synnaxlabs/x/telem"
)

var (
	// ChannelNotFound is returned when a channel or a range of data cannot be found in the DB.
	ChannelNotFound = errors.Wrap(query.NotFound, "[cesium] - channel not found")
)

type (
	Channel = core.Channel
	Frame   = core.Frame
)

func Keys(channels ...Channel) []string {
	return lo.Uniq(lo.Map(channels, func(c Channel, _ int) string { return c.Key }))
}

func NewFrame(keys []string, arrays []telem.Array) Frame { return core.NewFrame(keys, arrays) }

// DB provides a persistent, concurrent store for reading and writing arrays of telemetry.
//
// A DB works with three data types: Channels, Arrays, and Frames. A Channel is a named
// collection of samples across a time range, and typically represents a single data source,
// such as a physical sensor, software sensor, metric, or event.
type DB interface {
	// CreateChannel creates the given channels in the DB.
	CreateChannel(channels ...Channel) error
	// RetrieveChannel retrieves the channel with the given key.
	RetrieveChannel(key string) (Channel, error)
	// RetrieveChannels retrieves the channels with the given keys.
	RetrieveChannels(keys ...string) ([]Channel, error)
	Write(start telem.TimeStamp, frame Frame) error
	WriteArray(start telem.TimeStamp, key string, arr telem.Array) error
	NewWriter(cfg WriterConfig) (Writer, error)
	NewStreamWriter(cfg WriterConfig) (StreamWriter, error)
	Read(tr telem.TimeRange, keys ...string) (Frame, error)
	NewIterator(cfg IteratorConfig) (Iterator, error)
	NewStreamIterator(cfg IteratorConfig) (StreamIterator, error)
	Close() error
}

type cesium struct {
	*options
	dbs map[string]unary.DB
}

// Write implements DB.
func (db *cesium) Write(start telem.TimeStamp, frame Frame) error {
	config := WriterConfig{Start: start, Channels: frame.Keys()}
	w, err := db.NewWriter(config)
	if err != nil {
		return err
	}
	w.Write(frame)
	w.Commit()
	return w.Close()
}

// WriteArray implements DB.
func (db *cesium) WriteArray(start telem.TimeStamp, key string, arr telem.Array) error {
	return db.Write(start, core.NewFrame([]string{key}, []telem.Array{arr}))
}

// Read implements DB.
func (db *cesium) Read(tr telem.TimeRange, keys ...string) (frame Frame, err error) {
	var config IteratorConfig
	config.Channels = keys
	config.Bounds = tr
	iter, err := db.NewIterator(config)
	if err != nil {
		return
	}
	defer func() {
		err = iter.Close()
	}()
	if !iter.SeekFirst() {
		return
	}
	for iter.Next(telem.TimeSpanMax) {
		frame = frame.AppendFrame(iter.Value())
	}
	return
}

// Close implements DB.
func (db *cesium) Close() error {
	c := errutil.NewCatch(errutil.WithAggregation())
	for _, u := range db.dbs {
		c.Exec(u.Close)
	}
	return nil
}
