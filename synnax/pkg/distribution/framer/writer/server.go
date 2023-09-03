// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package writer

import (
	"context"
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

func (sf *server) handle(ctx context.Context, server ServerStream) error {
	sCtx, cancel := signal.WithCancel(ctx)
	defer cancel()

	// The first request provides the parameters for opening the toStorage wrapped
	req, err := server.Receive()
	if err != nil {
		return err
	}

	// Senders and receivers must be set up to distribution requests and responses
	// to their storage counterparts.
	receiver := &freightfluence.Receiver[Request]{Receiver: server}
	sender := &freightfluence.Sender[Response]{Sender: freighter.SenderNopCloser[Response]{StreamSender: server}}

	w, err := sf.Storage.OpenWriter(ctx, req.Config.toStorage())
	if err != nil {
		return err
	}
	gw := newGatewayWriter(sf.HostResolver.HostKey(), w)

	pipe := plumber.New()
	plumber.SetSegment[Request, Response](pipe, "toStorage", gw)
	plumber.SetSource[Request](pipe, "receiver", receiver)
	plumber.SetSink[Response](pipe, "sender", sender)
	plumber.MustConnect[Request](pipe, "receiver", "toStorage", 1)
	plumber.MustConnect[Response](pipe, "toStorage", "sender", 1)
	pipe.Flow(sCtx, confluence.CloseInletsOnExit())

	return sCtx.Wait()
}
