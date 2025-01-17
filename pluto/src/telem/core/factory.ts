// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type telem } from "@/telem/core";

export interface Factory {
  create: (key: string, spec: telem.Spec, root: Factory) => telem.Telem | null;
}

export class CompoundTelemFactory {
  factories: Factory[];

  type = "compound";

  constructor(factories: Factory[]) {
    this.factories = factories;
  }

  create(key: string, props: telem.Spec, root: Factory): telem.Telem | null {
    for (const factory of this.factories) {
      const telem = factory.create(key, props, root);
      if (telem != null) return telem;
    }
    return null;
  }
}
