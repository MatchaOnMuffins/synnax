// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Optional, TimeStamp } from "@synnaxlabs/x";
import { z } from "zod";

export const VARIANTS = [
  "success",
  "error",
  "warning",
  "info",
  "loading",
  "disabled",
] as const;
export const variantZ = z.enum(VARIANTS);
export type Variant = z.infer<typeof variantZ>;

export const specZ = z.object({
  key: z.string(),
  variant: variantZ,
  message: z.string(),
  time: TimeStamp.z,
});

export type Spec = z.infer<typeof specZ>;

export type CrudeSpec = Optional<Spec, "time" | "key">;
