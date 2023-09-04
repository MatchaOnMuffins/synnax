// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { channel } from "@/channel";
import { type Key, type Name, type Params } from "@/channel/payload";
import { type Retriever, analyzeParams } from "@/channel/retriever";
import { type control } from "@/control";
import { type Frame } from "@/framer/frame";

export class BackwardFrameAdapter {
  private adapter: Map<Key, Name> | null;
  retriever: Retriever;
  keys: Key[];

  private constructor(retriever: Retriever) {
    this.retriever = retriever;
    this.adapter = null;
    this.keys = [];
  }

  static async open(
    retriever: Retriever,
    channels: Params,
  ): Promise<BackwardFrameAdapter> {
    const adapter = new BackwardFrameAdapter(retriever);
    await adapter.update(channels);
    return adapter;
  }

  async update(channels: Params): Promise<void> {
    const { variant, normalized } = analyzeParams(channels);
    if (variant === "keys") {
      this.adapter = null;
      this.keys = normalized;
      return;
    }
    const fetched = await this.retriever.retrieve(normalized);
    const a = new Map<Key, Name>();
    this.adapter = a;
    normalized.forEach((name) => {
      const channel = fetched.find((channel) => channel.name === name);
      if (channel == null) throw new Error(`Channel ${name} not found`);
      a.set(channel.key, channel.name);
    });
    this.keys = Array.from(this.adapter.keys());
  }

  adapt(fr: Frame): Frame {
    if (this.adapter == null) return fr;
    const a = this.adapter;
    return fr.map((k, arr) => {
      if (typeof k === "number") {
        const name = a.get(k);
        if (name == null) throw new Error(`Channel ${k} not found`);
        return [name, arr];
      }
      return [k, arr];
    });
  }
}

export type CrudeAuthorities =
  | control.Authority
  | control.Authority[]
  | Record<channel.KeyOrName, control.Authority>;

export class ForwardFrameAdapter {
  private adapter: Map<Name, Key> | null;
  retriever: Retriever;
  keys: Key[];
  authorities: control.Authority[];

  private constructor(retriever: Retriever) {
    this.retriever = retriever;
    this.adapter = null;
    this.keys = [];
    this.authorities = [];
  }

  static async open(
    retriever: Retriever,
    channels: Params,
    authorities: CrudeAuthorities,
  ): Promise<ForwardFrameAdapter> {
    const adapter = new ForwardFrameAdapter(retriever);
    await adapter.update(channels, authorities);
    return adapter;
  }

  async update(channels: Params, authorities: CrudeAuthorities): Promise<void> {
    const { variant, normalized } = analyzeParams(channels);
    if (variant === "keys") {
      this.adapter = null;
      this.keys = normalized;
      return;
    }
    const fetched = await this.retriever.retrieve(normalized);
    const a = new Map<Name, Key>();
    this.adapter = a;
    normalized.forEach((name) => {
      const channel = fetched.find((channel) => channel.name === name);
      if (channel == null) throw new Error(`Channel ${name} not found`);
      a.set(channel.name, channel.key);
    });
    this.keys = fetched.map((c) => c.key);
    this.authorities = this.parseAuthorities(authorities, this.keys);
  }

  parseAuthorities(crude: CrudeAuthorities): control.Authority[] {
    if (typeof crude === "number") return keys.map(() => crude);
    if (this.adapter == null) throw new Error("Adapter not initialized");
    const a = this.adapter;
    if (Array.isArray(crude)) {
      if (crude.length !== keys.length) throw invalidAuthoritiesError(crude, keys);
      return crude;
    }
    const authorities: control.Authority[] = [];
    Object.entries(crude).forEach(([keyOrName, auth]) => {
      const isKey = channel.isKey(keyOrName);
      let key: channel.Key;
      if (isKey) key = Number(keyOrName);
      else {
        const key_ = a.get(keyOrName);
        if (key_ == null) throw invalidAuthoritiesError(crude, keys);
        key = key_;
      }
      const index = keys.indexOf(key);
      if (index === -1) throw invalidAuthoritiesError(crude, keys);
      authorities[index] = auth;
    });
    return authorities;
  }

  adapt(fr: Frame): Frame {
    if (this.adapter == null) return fr;
    const a = this.adapter;
    return fr.map((k, arr) => {
      if (typeof k === "string") {
        const key = a.get(k);
        if (key == null) throw new Error(`Channel ${k} not found`);
        return [key, arr];
      }
      return [k, arr];
    });
  }
}

const invalidAuthoritiesError = (
  crude: CrudeAuthorities,
  keys: channel.Keys,
): Error => {
  return new Error(
    `Invalid authorities: ${JSON.stringify(crude)} for keys: ${JSON.stringify(keys)}`,
  );
};
