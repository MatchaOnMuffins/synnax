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
	"github.com/synnaxlabs/synnax/pkg/storage/framer"

	"github.com/synnaxlabs/freighter"
	"github.com/synnaxlabs/freighter/freightfluence"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/confluence/plumber"
	"github.com/synnaxlabs/x/signal"
)

type server struct{ ServiceConfig }

func startServer(cfg ServiceConfig) *server {
	s := &server{ServiceConfig: cfg}
	cfg.Transport.Server().BindHandler(s.handle)
	return s
}

// handle implements freighter.StreamServer.
func (sf *server) handle(ctx context.Context, server ServerStream) error {
	sCtx, cancel := signal.WithCancel(ctx)
	defer cancel()

	req, err := server.Receive()
	if err != nil {
		return err
	}

	receiver := &freightfluence.Receiver[Request]{Receiver: server}
	sender := &freightfluence.Sender[Response]{
		Sender: freighter.SenderNopCloser[Response]{StreamSender: server},
	}

	iter, err := sf.Storage.OpenIterator(framer.IteratorConfig{
		Channels: req.Keys.Storage(),
		Bounds:   req.Bounds,
	})
	if err != nil {
		return err
	}

	pipe := plumber.New()
	plumber.SetSegment[Request, Response](pipe, "storage", newGatewayIterator(iter))
	plumber.SetSource[Request](pipe, "receiver", receiver)
	plumber.SetSink[Response](pipe, "sender", sender)
	plumber.MustConnect[Request](pipe, "receiver", "storage", 1)
	plumber.MustConnect[Response](pipe, "storage", "sender", 1)
	pipe.Flow(sCtx, confluence.CloseInletsOnExit())
	return sCtx.Wait()
}
