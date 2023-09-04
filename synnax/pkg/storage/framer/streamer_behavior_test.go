// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package framer_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/cesium"
	"github.com/synnaxlabs/synnax/pkg/storage"
	"github.com/synnaxlabs/synnax/pkg/storage/control"
	"github.com/synnaxlabs/synnax/pkg/storage/framer"
	"github.com/synnaxlabs/synnax/pkg/storage/mock"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/signal"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
)

var _ = Describe("Streamer Behavior", Ordered, func() {
	var (
		store *storage.Store
		db    *framer.DB
	)
	BeforeAll(func() {
		b := mock.NewBuilder()
		store = b.New()
		db = store.Framer
	})
	AfterAll(func() { Expect(store.Close()).To(Succeed()) })
	Describe("Happy Path", func() {
		It("Should subscribe to written frames for the given channels", func() {
			var basic1 cesium.ChannelKey = 1
			By("Creating a channel")
			Expect(db.CreateChannel(
				ctx,
				framer.Channel{Key: basic1, DataType: telem.Int64T, Rate: 1 * telem.Hz},
			)).To(Succeed())
			w := MustSucceed(db.OpenWriter(ctx, framer.WriterConfig{
				Channels:    []cesium.ChannelKey{basic1},
				Authorities: []control.Authority{1},
				Start:       10 * telem.SecondTS,
			}))
			r := MustSucceed(db.NewStreamer(ctx, framer.StreamerConfig{
				Channels: []cesium.ChannelKey{basic1},
			}))
			i, o := confluence.Attach(r, 1)
			sCtx, cancel := signal.WithCancel(ctx)
			defer cancel()
			r.Flow(sCtx, confluence.CloseInletsOnExit())

			d := telem.NewArrayV[int64](1, 2, 3)
			Expect(w.Write(ctx, cesium.NewFrame(
				[]cesium.ChannelKey{basic1},
				[]telem.Series{d},
			))).To(BeTrue())

			f := <-o.Outlet()
			Expect(f.Frame.Keys).To(HaveLen(1))
			Expect(f.Frame.Series).To(HaveLen(1))
			d.Alignment = int64(10 * telem.SecondTS)
			Expect(f.Frame.Series[0]).To(Equal(d))
			i.Close()
			Expect(sCtx.Wait()).To(Succeed())
		})
	})
})
