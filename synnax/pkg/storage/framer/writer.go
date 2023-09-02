package framer

import (
	"context"
	"github.com/synnaxlabs/synnax/pkg/storage/ts"
)

type Writer struct {
}

func (w *Writer) Write(ctx context.Context, fr ts.Frame) error {}

func (w *Writer) Error() error {}

func (w *Writer) Commit(ctx context.Context) {}
