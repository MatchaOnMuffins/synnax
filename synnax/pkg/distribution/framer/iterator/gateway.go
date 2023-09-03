// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package iterator

import (
	"context"
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	coref "github.com/synnaxlabs/synnax/pkg/distribution/framer/core"
	"github.com/synnaxlabs/synnax/pkg/storage/framer"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/signal"
)

func (s *Service) newGateway(cfg Config) (confluence.Segment[Request, Response], error) {
	iter, err := s.Storage.OpenIterator(framer.IteratorConfig{
		Bounds:   cfg.Bounds,
		Channels: cfg.Keys.Storage(),
	})
	gw := &gatewayIterator{
		wrap: iter,
		host: s.HostResolver.HostKey(),
	}
	return gw, err
}

type gatewayIterator struct {
	confluence.AbstractLinear[Request, Response]
	wrap   *framer.Iterator
	host   core.NodeKey
	seqNum int
}

func newGatewayIterator(wrap *framer.Iterator, host core.NodeKey) *gatewayIterator {
	return &gatewayIterator{wrap: wrap, host: host}
}

func (i *gatewayIterator) Flow(ctx signal.Context, opts ...confluence.Option) {
	o := confluence.NewOptions(append(opts, confluence.DeferErr(i.wrap.Close)))
	o.AttachClosables(i.Out)
	signal.GoRange(ctx, i.In.Outlet(), i.exec, o.Signal...)
}

func (i *gatewayIterator) exec(ctx context.Context, in Request) error {
	i.seqNum++
	ackRes := Response{Variant: AckResponse, Command: in.Command, NodeKey: i.host, SeqNum: i.seqNum}
	dataRes := Response{Variant: DataResponse, NodeKey: i.host, Command: in.Command, SeqNum: i.seqNum}
	switch in.Command {
	case Next:
		ackRes.Ack = i.wrap.Next(ctx, in.Span)
		dataRes.Frame = coref.NewFrameFromStorage(i.wrap.Value())
		i.Out.Inlet() <- dataRes
	case Prev:
		ackRes.Ack = i.wrap.Prev(ctx, in.Span)
		dataRes.Frame = coref.NewFrameFromStorage(i.wrap.Value())
		i.Out.Inlet() <- dataRes
	case SeekFirst:
		ackRes.Ack = i.wrap.SeekFirst(ctx)
	case SeekLast:
		ackRes.Ack = i.wrap.SeekLast(ctx)
	case SeekLE:
		ackRes.Ack = i.wrap.SeekLE(ctx, in.Stamp)
	case SeekGE:
		ackRes.Ack = i.wrap.SeekGE(ctx, in.Stamp)
	case Valid:
		ackRes.Ack = i.wrap.Valid()
	case SetBounds:
		i.wrap.SetBounds(in.Bounds)
		ackRes.Ack = true
	case Error:
		ackRes.Error = i.wrap.Error()
		ackRes.Ack = true
	}
	i.Out.Inlet() <- ackRes
	return nil
}
