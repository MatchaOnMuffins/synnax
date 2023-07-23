// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { Meta } from "@storybook/react";
import { TimeRange } from "@synnaxlabs/x";

import { Canvas } from "@/core";
import { LinePlot, AxisProps, LineProps } from "@/vis/LinePlot";

const story: Meta<typeof LinePlot> = {
  title: "Vis/LinePlot",
  component: LinePlot,
};

const AXES: AxisProps[] = [
  {
    id: "x",
    location: "bottom",
    label: "Time",
  },
  {
    id: "y",
    location: "left",
    label: "Value",
  },
];

const LINES: LineProps[] = [
  {
    variant: "static",
    range: TimeRange.MAX,
    axes: {
      x: "x",
      y: "y",
    },
    channels: {
      x: 65537,
      y: 65538,
    },
    color: "#F733FF",
    strokeWidth: 2,
  },
];

export const Primary = (): ReactElement => {
  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <div style={{ height: "50%" }}></div>
      <LinePlot axes={AXES} lines={LINES} style={{ height: "50%" }} />
    </Canvas>
  );
};

// eslint-disable-next-line import/no-default-export
export default story;
