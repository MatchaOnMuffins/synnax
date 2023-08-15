// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { NumericTelemSourceSpec, XYTelemSourceSpec } from "@/core/vis/telem";
import {
  Numeric,
  NumericProps as RemoteTelemNumericProps,
} from "@/telem/remote/aether/numeric";
import {
  XYProps as RemoteTelemXYProps,
  DynamicXYProps as RemoteTelemDynamicXyProps,
  XY,
  DynamicXY,
} from "@/telem/remote/aether/xy";

export const useXY = (props: RemoteTelemXYProps): XYTelemSourceSpec => {
  return {
    type: XY.TYPE,
    props,
    variant: "xy-source",
  };
};

export const useDynamicXY = (props: RemoteTelemDynamicXyProps): XYTelemSourceSpec => {
  return {
    type: DynamicXY.TYPE,
    props,
    variant: "xy-source",
  };
};

export const useNumeric = (props: RemoteTelemNumericProps): NumericTelemSourceSpec => {
  return {
    type: Numeric.TYPE,
    props,
    variant: "numeric-source",
  };
};