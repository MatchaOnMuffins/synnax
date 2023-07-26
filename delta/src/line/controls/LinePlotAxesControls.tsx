// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { Input, InputControl, Select, Space } from "@synnaxlabs/pluto";
import { useDispatch } from "react-redux";

import { useSelectLinePlot } from "../store/selectors";
import { AxisState, setLinePlotAxis, shouldDisplayAxis } from "../store/slice";

import { AxisKey } from "@/vis";

export interface LinePlotAxesControlsProps {
  layoutKey: string;
}

export const LinePlotAxesControls = ({
  layoutKey,
}: LinePlotAxesControlsProps): ReactElement => {
  const vis = useSelectLinePlot(layoutKey);
  const dispatch = useDispatch();

  const handleAxisChange = (key: AxisKey) => (axis: AxisState) => {
    dispatch(setLinePlotAxis({ key: layoutKey, axisKey: key, axis }));
  };

  return (
    <Space style={{ padding: "2rem", width: "100%" }}>
      {Object.entries(vis.axes)
        .filter(([key]) => shouldDisplayAxis(key as AxisKey, vis))
        .map(([key, axis]) => (
          <LinePlotAxisControls
            key={key}
            axis={axis}
            axisKey={key as AxisKey}
            onChange={handleAxisChange(key as AxisKey)}
          />
        ))}
    </Space>
  );
};

export interface LinePlotAxisControlsProps {
  axisKey: AxisKey;
  axis: AxisState;
  onChange: (axis: AxisState) => void;
}

export const LinePlotAxisControls = ({
  axisKey,
  axis,
  onChange,
}: LinePlotAxisControlsProps): ReactElement => {
  const handleLabelChange: InputControl<string>["onChange"] = (value: string) => {
    onChange({ ...axis, label: value });
  };

  const handleLowerBoundChange: InputControl<number>["onChange"] = (value: number) => {
    onChange({ ...axis, bounds: { ...axis.bounds, lower: value } });
  };

  const handleUpperBoundChange: InputControl<number>["onChange"] = (value: number) => {
    onChange({ ...axis, bounds: { ...axis.bounds, upper: value } });
  };

  const handleLabelDirectionChange: InputControl<"x" | "y">["onChange"] = (value) => {
    onChange({ ...axis, labelDirection: value });
  };

  return (
    <Space direction="x">
      <Input
        value={axis.label}
        placeholder={axisKey.toUpperCase()}
        onChange={handleLabelChange}
      />
      <Input.Numeric
        value={axis.bounds.lower}
        onChange={handleLowerBoundChange}
        resetValue={0}
        dragScale={AXES_BOUNDS_DRAG_SCALE}
      />
      <Input.Numeric
        value={axis.bounds.upper}
        onChange={handleUpperBoundChange}
        resetValue={0}
        dragScale={AXES_BOUNDS_DRAG_SCALE}
      />
      <Select.Button
        value={axis.labelDirection}
        onChange={handleLabelDirectionChange}
        entryRenderKey="label"
        data={[
          {
            key: "x",
            label: "X",
          },
          {
            key: "y",
            label: "Y",
          },
        ]}
      />
    </Space>
  );
};

const AXES_BOUNDS_DRAG_SCALE = {
  x: 0.1,
  y: 0.1,
};
