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
	"github.com/synnaxlabs/synnax/pkg/storage/framer"
	"github.com/synnaxlabs/x/confluence"
)

func (s *Service) newGateway(cfg Config) (confluence.Segment[Request, Response], error) {
	iter, err := s.Storage.OpenIterator(framer.IteratorConfig{
		Bounds:   cfg.Bounds,
		Channels: cfg.Keys.Storage(),
	})
	gw := newGatewayIterator(iter)
	return gw, err
}

type gatewayIterator struct {
	confluence.LinearTransform[Request, Response]
	wrap    *framer.Iterator
	hostKey core.NodeKey
	seqNum  int
}

func newGatewayIterator(wrap *framer.Iterator) *gatewayIterator {
	gw := &gatewayIterator{wrap: wrap}
	gw.Transform = gw.transform
	return gw
}

func (i *gatewayIterator) transform(ctx context.Context, in Request) (res Response, ok bool, err error) {
	ok = true
	i.seqNum++
	switch in.Command {
	case Next:
		res.Ack = i.wrap.Next(ctx, in.Span)
	case Prev:
		res.Ack = i.wrap.Prev(ctx, in.Span)
	case SeekFirst:
		res.Ack = i.wrap.SeekFirst(ctx)
	case SeekLast:
		res.Ack = i.wrap.SeekLast(ctx)
	case SeekLE:
		res.Ack = i.wrap.SeekLE(ctx, in.Stamp)
	case SeekGE:
		res.Ack = i.wrap.SeekGE(ctx, in.Stamp)
	case Valid:
		res.Ack = i.wrap.Valid()
	case SetBounds:
		i.wrap.SetBounds(in.Bounds)
		res.Ack = true
	case Error:
		res.Error = i.wrap.Error()
		res.Ack = true
	}
	res.Command = in.Command
	res.NodeKey = i.hostKey
	res.SeqNum = i.seqNum
	return
}
