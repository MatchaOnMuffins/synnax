// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { StreamClient } from "@synnaxlabs/freighter";
import {
  NativeTypedArray,
  Series,
  TimeRange,
  CrudeTimeStamp,
  TimeStamp,
} from "@synnaxlabs/x";

import { ChannelKeyOrName, ChannelParams } from "@/channel/payload";
import { ChannelRetriever, analyzeChannelParams } from "@/channel/retriever";
import { Frame } from "@/framer/frame";
import { Iterator } from "@/framer/iterator";
import { Streamer } from "@/framer/streamer";
import { Writer } from "@/framer/writer";

export class FrameClient {
  private readonly stream: StreamClient;
  private readonly retriever: ChannelRetriever;

  constructor(stream: StreamClient, retriever: ChannelRetriever) {
    this.stream = stream;
    this.retriever = retriever;
  }

  /**
   * Opens a new iterator over the given channels within the provided time range.
   *
   * @param tr - A time range to iterate over.
   * @param keys - A list of channel keys to iterate over.
   * @returns a new {@link TypedIterator}.
   */
  async newIterator(tr: TimeRange, channels: ChannelParams): Promise<Iterator> {
    return await Iterator._open(tr, channels, this.retriever, this.stream);
  }

  /**
   * Opens a new writer on the given channels.
   *
   * @param keys - The keys of the channels to write to. A writer cannot write to
   * a channel that is not in this list. See the {@link RecordWriter} documentation
   * for more information.
   * @returns a new {@link RecordWriter}.
   */
  async newWriter(start: CrudeTimeStamp, channels: ChannelParams): Promise<Writer> {
    return await Writer._open(start, channels, this.retriever, this.stream);
  }

  async newStreamer(
    params: ChannelParams,
    from: TimeStamp = TimeStamp.now()
  ): Promise<Streamer> {
    return await Streamer._open(from, params, this.retriever, this.stream);
  }

  /**
   * Writes telemetry to the given channel starting at the given timestamp.
   *
   * @param to - The key of the channel to write to.
   * @param start - The starting timestamp of the first sample in data.
   * @param data  - The telemetry to write. This telemetry must have the same
   * data type as the channel.
   * @throws if the channel does not exist.
   */
  async write(
    to: ChannelKeyOrName,
    start: CrudeTimeStamp,
    data: NativeTypedArray
  ): Promise<void> {
    const w = await this.newWriter(start, to);
    try {
      await w.write(to, data);
      if (!(await w.commit())) throw (await w.error()) as Error;
    } catch {
      await w.close();
    }
  }

  async read(tr: TimeRange, channel: ChannelKeyOrName): Promise<Series>;

  async read(tr: TimeRange, channels: ChannelParams): Promise<Frame>;

  async read(tr: TimeRange, channels: ChannelParams): Promise<Series | Frame> {
    const { single } = analyzeChannelParams(channels);
    const fr = await this.readFrame(tr, channels);
    if (single) return fr.series[0];
    return fr;
  }

  private async readFrame(tr: TimeRange, params: ChannelParams): Promise<Frame> {
    const i = await this.newIterator(tr, params);
    const frame = new Frame();
    for await (const f of i) frame.push(f);
    return frame;
  }
}
