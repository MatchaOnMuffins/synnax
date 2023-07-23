// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { FC, PropsWithChildren, useRef } from "react";

import { createMockWorkers } from "@synnaxlabs/x";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { Aether } from "./main";
import { MainMessage, WorkerMessage } from "./message";

import {
  AetherComponentRegistry,
  AetherComposite,
  AetherLeaf,
  AetherRoot,
  render as aetherRender,
} from "@/core/aether/worker";

export const exampleProps = z.object({
  x: z.number(),
});

class ExampleLeaf extends AetherLeaf<typeof exampleProps> {
  static readonly TYPE = "ExampleLeaf";
  updatef = vi.fn();
  deletef = vi.fn();

  schema = exampleProps;

  afterUpdate(): void {
    this.updatef();
  }

  afterDelete(): void {
    this.deletef();
  }
}

class ExampleComposite extends AetherComposite<typeof exampleProps, ExampleLeaf> {
  updatef = vi.fn();
  deletef = vi.fn();

  static readonly TYPE = "ExampleComposite";

  schema = exampleProps;

  afterUpdate(): void {
    this.updatef();
  }

  afterDelete(): void {
    this.deletef();
  }
}

class ContextSetterComposite extends AetherComposite<typeof exampleProps, ExampleLeaf> {
  updatef = vi.fn();
  deletef = vi.fn();

  schema = exampleProps;

  afterUpdate(): void {
    this.ctx.set("key", "value");
  }

  afterDelete(): void {
    this.deletef();
  }
}

const REGISTRY: AetherComponentRegistry = {
  [ExampleLeaf.TYPE]: ExampleLeaf,
  [ExampleComposite.TYPE]: ExampleComposite,
};

const newProvider = (): [FC<PropsWithChildren>, AetherRoot] => {
  const [a, b] = createMockWorkers();
  const root = aetherRender({ worker: a.route("vis"), registry: REGISTRY });
  const worker = b.route<MainMessage, WorkerMessage>("vis");
  return [
    (props: PropsWithChildren) => (
      <Aether.Provider worker={worker} workerKey="vis" {...props} />
    ),
    root,
  ];
};

describe("Aether Main", () => {
  describe("leaf", () => {
    it("should set the initial state correctly", () => {
      const [Provider, root] = newProvider();
      const ExampleLeafC = Aether.wrap(ExampleLeaf.TYPE, ({ aetherKey }) => {
        Aether.use({
          aetherKey,
          type: ExampleLeaf.TYPE,
          schema: exampleProps,
          initialState: { x: 0 },
        });
        return null;
      });
      const c = render(
        <Provider>
          <ExampleLeafC />
        </Provider>
      );
      expect(root.children).toHaveLength(1);
      const first = root.children[0] as ExampleLeaf;
      expect(first.type).toBe(ExampleLeaf.TYPE);
      expect(first.state).toEqual({ x: 0 });
    });
    it("should update the state on a call to setState", () => {
      const [Provider, root] = newProvider();
      const ExampleLeafC = Aether.wrap(ExampleLeaf.TYPE, ({ aetherKey }) => {
        const [, , setState] = Aether.use({
          aetherKey,
          type: ExampleLeaf.TYPE,
          schema: exampleProps,
          initialState: { x: 0 },
        });
        const set = useRef(false);
        if (!set.current) {
          setState({ x: 1 });
          set.current = true;
        }
        return null;
      });
      const c = render(
        <Provider>
          <ExampleLeafC />
        </Provider>
      );
      expect(root.children).toHaveLength(1);
      const first = root.children[0] as ExampleLeaf;
      expect(first.type).toBe(ExampleLeaf.TYPE);
      expect(first.state).toEqual({ x: 1 });
    });
  });
});
