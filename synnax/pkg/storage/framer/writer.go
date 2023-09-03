package framer

import (
	"context"
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/cesium"
	"github.com/synnaxlabs/synnax/pkg/storage/control"
	"github.com/synnaxlabs/x/telem"
)

type WriterConfig struct {
	Start     telem.TimeStamp
	Channels  []ChannelKey
	Authority []control.Authority
}

func (c WriterConfig) cesium() cesium.WriterConfig {
	return cesium.WriterConfig{Start: c.Start, Channels: c.Channels}
}

type Writer struct {
	internal *cesium.Writer
	gate     *control.Gate[ChannelKey]
	err      error
	relay    *relay
}

func (db *DB) OpenWriter(ctx context.Context, cfg WriterConfig) (*Writer, error) {
	internal, err := db.internal.OpenWriter(ctx, cfg.cesium())
	if err != nil {
		return nil, err
	}
	g := control.OpenGate[ChannelKey](db.control, cfg.Start.Range(telem.TimeStampMax))
	g.Set(cfg.Channels, cfg.Authority)
	return &Writer{internal: internal, gate: g}, nil
}

func (w *Writer) Write(ctx context.Context, alignedFr Frame) bool {
	failed := w.gate.Check(alignedFr.Keys)
	if len(failed) > 0 {
		w.err = errors.New("write failed - insufficient permissions")
		return false
	}
	alignedFr, ok := w.internal.Write(ctx, alignedFr)
	if !ok {
		return false
	}
	w.relay.inlet.Inlet() <- alignedFr
	return true
}

func (w *Writer) Close() error {
	return errors.CombineErrors(w.err, w.internal.Close())
}

func (w *Writer) Error() error {
	return errors.CombineErrors(w.err, w.internal.Error())
}

func (w *Writer) Commit(ctx context.Context) (telem.TimeStamp, error) {
	return w.internal.Commit(ctx)
}
