// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package fgrpc

import (
	"github.com/synnaxlabs/freighter"
	"google.golang.org/grpc"
)

// BindableTransport is a transport that can be bound to a gRPC service
// registrar.
type BindableTransport interface {
	freighter.Transport
	// BindTo binds the transport to the given gRPC service registrar.
	BindTo(reg grpc.ServiceRegistrar)
}

var Reporter = freighter.Reporter{
	Protocol:  "grpc",
	Encodings: []string{"protobuf"},
}
