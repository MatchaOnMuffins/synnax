// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package writer_test

import (
	"context"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/alamos"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/core/mock"
	"github.com/synnaxlabs/synnax/pkg/distribution/framer/writer"
	tmock "github.com/synnaxlabs/synnax/pkg/distribution/transport/mock"
	. "github.com/synnaxlabs/x/testutil"
	"testing"
)

var (
	ctx = context.Background()
	ins alamos.Instrumentation
)

func TestWriter(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "set Suite")
}

type serviceContainer struct {
	channel   channel.Service
	writerSvc *writer.Service
	transport struct {
		channel channel.Transport
		writer  writer.Transport
	}
}

func provision(n int) (*mock.CoreBuilder, map[core.NodeKey]serviceContainer) {
	var (
		builder    = mock.NewCoreBuilder()
		services   = make(map[core.NodeKey]serviceContainer)
		channelNet = tmock.NewChannelNetwork()
		writerNet  = tmock.NewFramerWriterNetwork()
	)
	for i := 0; i < n; i++ {
		var (
			c         = builder.New()
			container serviceContainer
		)
		container.channel = MustSucceed(channel.New(ctx, channel.ServiceConfig{
			HostResolver: c.Cluster,
			ClusterDB:    c.Storage.Gorpify(),
			Storage:      c.Storage.Framer,
			Transport:    channelNet.New(c.Config.AdvertiseAddress),
		}))
		container.writerSvc = MustSucceed(writer.OpenService(writer.ServiceConfig{
			Instrumentation: ins,
			Storage:         c.Storage.Framer,
			ChannelReader:   container.channel,
			HostResolver:    c.Cluster,
			Transport:       writerNet.New(c.Config.AdvertiseAddress /*buffer*/, 10),
		}))
		services[c.Cluster.HostKey()] = container
	}
	builder.WaitForTopologyToStabilize()
	return builder, services
}
