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
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	dcore "github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/framer/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/framer/writer"
	"github.com/synnaxlabs/synnax/pkg/storage/control"
	"github.com/synnaxlabs/x/query"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"github.com/synnaxlabs/x/validate"
	"io"
)

var _ = Describe("TypedWriter", func() {
	Describe("Happy Path", Ordered, func() {
		scenarios := []func() scenario{
			gatewayOnlyScenario,
			peerOnlyScenario,
			mixedScenario,
		}
		for _, sF := range scenarios {
			_sF := sF
			var s scenario
			BeforeAll(func() { s = _sF() })
			AfterAll(func() { Expect(s.close.Close()).To(Succeed()) })
			Specify("It should write and commit data", func() {
				writer := MustSucceed(s.service.Open(context.TODO(), writer.Config{
					Keys:        s.keys,
					Authorities: s.authority,
					Start:       10 * telem.SecondTS,
				}))
				Expect(writer.Write(core.Frame{
					Keys: s.keys,
					Series: []telem.Series{
						telem.NewArrayV[int64](1, 2, 3),
						telem.NewArrayV[int64](3, 4, 5),
						telem.NewArrayV[int64](5, 6, 7),
					}},
				)).To(BeTrue())
				Expect(writer.Commit()).To(BeTrue())
				Expect(writer.Error()).To(Succeed())
				Expect(writer.Write(core.Frame{
					Keys: s.keys,
					Series: []telem.Series{
						telem.NewArrayV[int64](1, 2, 3),
						telem.NewArrayV[int64](3, 4, 5),
						telem.NewArrayV[int64](5, 6, 7),
					}},
				)).To(BeTrue())
				Expect(writer.Commit()).To(BeTrue())
				Expect(writer.Error()).To(Succeed())
				Expect(writer.Close()).To(Succeed())
			})
		}
	})
	Describe("Open Errors", Ordered, func() {
		var s scenario
		BeforeAll(func() { s = gatewayOnlyScenario() })
		AfterAll(func() { Expect(s.close.Close()).To(Succeed()) })
		It("Should return an error if no keys are provided", func() {
			_, err := s.service.Open(context.TODO(), writer.Config{
				Keys:  []channel.Key{},
				Start: 10 * telem.SecondTS,
			})
			Expect(err).To(HaveOccurredAs(validate.Error))
			Expect(err.Error()).To(ContainSubstring("keys"))
		})
		It("Should return an error if the channel can't be found", func() {
			_, err := s.service.Open(ctx, writer.Config{
				Keys: []channel.Key{
					channel.NewKey(0, 22),
					s.keys[0],
				},
				Authorities: []control.Authority{1, 1},
				Start:       10 * telem.SecondTS,
			})
			Expect(err).To(HaveOccurredAs(query.NotFound))
			Expect(err.Error()).To(ContainSubstring("channel"))
			Expect(err.Error()).To(ContainSubstring("22"))
			Expect(err.Error()).ToNot(ContainSubstring("1"))
		})
	})
	Describe("Frame Errors", Ordered, func() {
		var s scenario
		BeforeAll(func() { s = peerOnlyScenario() })
		AfterAll(func() { Expect(s.close.Close()).To(Succeed()) })
		It("Should return an error if a key is provided that is not in the list of keys provided to the wrapped", func() {
			writer := MustSucceed(s.service.Open(context.TODO(), writer.Config{
				Keys:        s.keys,
				Authorities: s.authority,
				Start:       10 * telem.SecondTS,
			}))
			Expect(writer.Write(core.Frame{
				Keys: append(s.keys, channel.NewKey(12, 22)),
				Series: []telem.Series{
					telem.NewArrayV[int64](1, 2, 3),
					telem.NewArrayV[int64](3, 4, 5),
					telem.NewArrayV[int64](5, 6, 7),
					telem.NewArrayV[int64](5, 6, 7),
				}},
			)).To(BeTrue())
			Expect(writer.Commit()).To(BeFalse())
			Expect(writer.Error()).To(HaveOccurredAs(validate.Error))
			Expect(writer.Error()).To(BeNil())
			Expect(writer.Error()).To(BeNil())
			Expect(writer.Close()).To(Succeed())
		})
	})
})

type scenario struct {
	keys      channel.Keys
	authority []control.Authority
	service   *writer.Service
	channel   channel.Service
	close     io.Closer
}

func newChannelSet() []channel.Channel {
	return []channel.Channel{
		{
			Name:     "test1",
			Rate:     1 * telem.Hz,
			DataType: telem.Int64T,
		},
		{
			Name:     "test2",
			Rate:     1 * telem.Hz,
			DataType: telem.Int64T,
		},
		{
			Name:     "test3",
			Rate:     1 * telem.Hz,
			DataType: telem.Int64T,
		},
	}
}

func gatewayOnlyScenario() scenario {
	channels := newChannelSet()
	builder, services := provision(1)
	svc := services[1]
	Expect(svc.channel.NewWriter(nil).CreateMany(ctx, &channels)).To(Succeed())
	keys := channel.KeysFromChannels(channels)
	return scenario{
		keys:      keys,
		authority: []control.Authority{1, 1, 1},
		service:   svc.writerSvc,
		close:     builder,
		channel:   svc.channel,
	}
}

func peerOnlyScenario() scenario {
	channels := newChannelSet()
	builder, services := provision(4)
	svc := services[1]
	for i, ch := range channels {
		ch.Leaseholder = dcore.NodeKey(i + 2)
		channels[i] = ch
	}
	Expect(svc.channel.NewWriter(nil).CreateMany(ctx, &channels)).To(Succeed())
	Eventually(func(g Gomega) {
		var chs []channel.Channel
		err := svc.channel.NewRetrieve().Entries(&chs).WhereKeys(channel.KeysFromChannels(channels)...).Exec(ctx, nil)
		g.Expect(err).To(Succeed())
		g.Expect(chs).To(HaveLen(len(channels)))
	}).Should(Succeed())
	keys := channel.KeysFromChannels(channels)
	return scenario{
		keys:      keys,
		authority: []control.Authority{1, 1, 1},
		service:   svc.writerSvc,
		close:     builder,
		channel:   svc.channel,
	}
}

func mixedScenario() scenario {
	channels := newChannelSet()
	builder, services := provision(3)
	svc := services[1]
	for i, ch := range channels {
		ch.Leaseholder = dcore.NodeKey(i + 1)
		channels[i] = ch
	}
	Expect(svc.channel.NewWriter(nil).CreateMany(ctx, &channels)).To(Succeed())
	Eventually(func(g Gomega) {
		var chs []channel.Channel
		err := svc.channel.NewRetrieve().Entries(&chs).WhereKeys(channel.KeysFromChannels(channels)...).Exec(ctx, nil)
		g.Expect(err).To(Succeed())
		g.Expect(chs).To(HaveLen(len(channels)))
	}).Should(Succeed())
	keys := channel.KeysFromChannels(channels)
	return scenario{
		keys:      keys,
		authority: []control.Authority{1, 1, 1},
		service:   svc.writerSvc,
		close:     builder,
		channel:   svc.channel,
	}
}
