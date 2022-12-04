package writer

import (
	"context"
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/signal"
	"github.com/synnaxlabs/x/validate"
)

type validator struct {
	signal    chan bool
	closed    bool
	keys      channel.Keys
	responses struct {
		confluence.AbstractUnarySource[Response]
		confluence.EmptyFlow
	}
	confluence.AbstractLinear[Request, Request]
	accumulatedError error
}

// Flow implements the confluence.Flow interface.
func (v *validator) Flow(ctx signal.Context, opts ...confluence.Option) {
	o := confluence.NewOptions(opts)
	o.AttachClosables(v.responses.Out, v.Out)
	ctx.Go(func(ctx context.Context) error {
		for {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case v.closed = <-v.signal:
			case req, ok := <-v.In.Outlet():
				if !ok {
					return nil
				}
				if v.accumulatedError != nil {
					if req.Command == Error {
						if err := signal.SendUnderContext(ctx, v.responses.Out.Inlet(), Response{Command: Error, Err: v.accumulatedError}); err != nil {
							return err
						}
						v.accumulatedError = nil
					} else {
						if err := signal.SendUnderContext(ctx, v.responses.Out.Inlet(), Response{Command: req.Command, Ack: false}); err != nil {
							return err
						}
					}
					continue
				}

				block := v.closed && (req.Command == Data || req.Command == Commit)
				if block {
					if err := signal.SendUnderContext(
						ctx,
						v.responses.Out.Inlet(),
						Response{Command: req.Command, Ack: false, SeqNum: -1},
					); err != nil {
						return err
					}
				} else {
					if v.accumulatedError = v.validate(req); v.accumulatedError != nil {
						if err := signal.SendUnderContext(
							ctx,
							v.responses.Out.Inlet(),
							Response{Command: req.Command, Ack: false, SeqNum: -1},
						); err != nil {
							return err
						}
					} else {
						if err := signal.SendUnderContext(ctx, v.Out.Inlet(), req); err != nil {
							return err
						}
					}
				}
			}
		}
	}, o.Signal...)
}

func (v *validator) validate(req Request) error {
	if req.Command < Data || req.Command > Error {
		return errors.Wrapf(validate.Error, "invalid writer command: %d", req.Command)
	}
	if req.Command == Data {
		missing, extra := v.keys.Difference(req.Frame.Keys())
		if len(missing) > 0 || len(extra) > 0 {
			return errors.Wrapf(validate.Error,
				"invalid frame: missing keys: %v, has extra keys: %v",
				missing,
				extra,
			)
		}
		if !req.Frame.Even() {
			return errors.Wrapf(validate.Error, "invalid frame: arrays have different lengths")
		}
	}
	return nil
}
