// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ChannelKey, ChannelKeys } from "@synnaxlabs/client";
import { TypographyLevel, ViewportMode } from "@synnaxlabs/pluto";
import {
  XY,
  Dimensions,
  CrudeBounds,
  CrudeXY,
  CrudeDimensions,
  Bounds,
  Deep,
  unique,
  toArray,
  CrudeDirection,
} from "@synnaxlabs/x";
import { nanoid } from "nanoid";

import { LayoutState, LayoutCreator } from "@/layout";
import {
  AxisKey,
  MultiXAxisRecord,
  MultiYAxisRecord,
  XAxisKey,
  XAxisRecord,
  X_AXIS_KEYS,
  YAxisKey,
} from "@/vis/axis";
import { Range } from "@/workspace";

// |||||| TITLE ||||||

export interface TitleState {
  level: TypographyLevel;
  visible: boolean;
}

const ZERO_TITLE_STATE: TitleState = {
  level: "h4",
  visible: false,
};

// |||||| LEGEND ||||||

export interface LegendState {
  visible: boolean;
}

const ZERO_LEGEND_STATE = {
  visible: true,
};

// |||||| VIEWPORT ||||||

export interface ViewportState {
  zoom: CrudeDimensions;
  pan: CrudeXY;
}

export const ZERO_VIEWPORT_STATE: ViewportState = {
  zoom: Dimensions.DECIMAL.crude,
  pan: XY.ZERO.crude,
};

// |||||| AXES ||||||

export interface AxisState {
  label?: string;
  labelDirection: CrudeDirection;
  bounds: CrudeBounds;
  driven: boolean;
}

export type AxesState = Record<AxisKey, AxisState>;

// |||| LINE ||||||

export interface LineState {
  key: string;
  label?: string;
  color: string;
  strokeWidth: number;
  downsample: number;
}

export type LinesState = LineState[];

const ZERO_LINE_STATE: Omit<LineState, "key"> = {
  color: "",
  strokeWidth: 2,
  downsample: 1,
};

export const ZERO_LINES_STATE: LinesState = [];

// |||||| RULES ||||||

export interface RuleState {
  key: string;
  label: string;
  color: string;
  position: number;
  axis: AxisKey;
  lineWidth: number;
  lineDash: number;
  units: string;
}

export type RulesState = RuleState[];

const ZERO_RULE_STATE: Omit<RuleState, "key"> = {
  color: "#ffffff",
  label: "",
  position: 0,
  axis: "y1",
  lineWidth: 2,
  lineDash: 3,
  units: "",
};

export const ZERO_RULES_STATE: RulesState = [];

// |||||| CHANNELS |||||

export type ChannelsState = MultiYAxisRecord<ChannelKey[]> & XAxisRecord<ChannelKey>;

export const ZERO_CHANNELS_STATE: ChannelsState = {
  x1: 0,
  x2: 0,
  y1: [] as number[],
  y2: [] as number[],
  y3: [] as number[],
  y4: [] as number[],
};

export const shouldDisplayAxis = (key: AxisKey, state: LinePlotState): boolean => {
  if (["x1", "y1"].includes(key)) return true;
  const channels = state.channels[key];
  if (Array.isArray(channels)) {
    return channels.length > 0;
  }
  return channels !== 0;
};

// |||||| RANGES ||||||

export type RangesState = MultiXAxisRecord<string>;

export const ZERO_RANGES_STATE: RangesState = {
  x1: [] as string[],
  x2: [] as string[],
};

export type SugaredRangesState = MultiXAxisRecord<Range>;

export interface LinePlotState {
  key: string;
  title: TitleState;
  legend: LegendState;
  channels: ChannelsState;
  ranges: RangesState;
  viewport: ViewportState;
  axes: AxesState;
  lines: LinesState;
  rules: RulesState;
}

export const ZERO_AXIS_STATE: AxisState = {
  label: "",
  labelDirection: "x",
  driven: true,
  bounds: Bounds.ZERO.crude,
};

export const ZERO_AXES_STATE: AxesState = {
  y1: ZERO_AXIS_STATE,
  y2: ZERO_AXIS_STATE,
  y3: ZERO_AXIS_STATE,
  y4: ZERO_AXIS_STATE,
  x1: ZERO_AXIS_STATE,
  x2: ZERO_AXIS_STATE,
};

export const ZERO_LINE_VIS: LinePlotState = {
  key: "",
  title: ZERO_TITLE_STATE,
  legend: ZERO_LEGEND_STATE,
  channels: ZERO_CHANNELS_STATE,
  ranges: ZERO_RANGES_STATE,
  viewport: ZERO_VIEWPORT_STATE,
  lines: ZERO_LINES_STATE,
  axes: ZERO_AXES_STATE,
  rules: ZERO_RULES_STATE,
};

// |||||| TOOLBAR ||||||

const LINE_TOOLBAR_TABS = [
  "data",
  "lines",
  "axes",
  "annotations",
  "properties",
] as const;
export type LineToolbarTab = (typeof LINE_TOOLBAR_TABS)[number];

export interface LineToolbarState {
  activeTab: LineToolbarTab;
}

export type ClickMode = "annotate" | "measure";

export interface LineControlState {
  clickMode: ClickMode | null;
  enableTooltip: boolean;
  mode: ViewportMode;
}

export const ZERO_LINE_CONTROL_STATE: LineControlState = {
  clickMode: null,
  enableTooltip: true,
  mode: "zoom",
};

export interface LineSliceState {
  control: LineControlState;
  toolbar: LineToolbarState;
  plots: Record<string, LinePlotState>;
}

export const LINE_SLICE_NAME = "line";

export interface LineStoreState {
  [LINE_SLICE_NAME]: LineSliceState;
}

export const ZERO_LINE_SLICE_STATE: LineSliceState = {
  control: ZERO_LINE_CONTROL_STATE,
  toolbar: {
    activeTab: "data",
  },
  plots: {},
};

export interface CreateLinePlotPayload extends LinePlotState {}

export interface DeleteLinePlotPayload {
  layoutKey: string;
}

export interface SetLinePlotViewportPayload extends ViewportState {
  layoutKey: string;
}

export interface SetLinePlotYChannelsPayload {
  key: string;
  axisKey: YAxisKey;
  channels: ChannelKey[];
}

export interface AddLinePlotYChannelPayload {
  key: string;
  axisKey: YAxisKey;
  channels: ChannelKey[];
}

export interface SetLinePlotXChannelPayload {
  key: string;
  axisKey: XAxisKey;
  channel: ChannelKey;
}

export interface SetLinePlotRangesPayload {
  key: string;
  axisKey: XAxisKey;
  ranges: string[];
}

export interface SetLinePlotLinePaylaod {
  key: string;
  line:
    | (Partial<LineState> & { key: string })
    | Array<Partial<LineState> & { key: string }>;
}

export interface SetLinePlotTitlePayload {
  key: string;
  title: Partial<TitleState>;
}

export interface SetLinePlotLegendPayload {
  key: string;
  legend: Partial<LegendState>;
}

export interface SetLinePlotAxisPayload {
  key: string;
  axisKey: AxisKey;
  axis: Partial<AxisState>;
}

export interface SetLinePlotRulePayload {
  key: string;
  rule: Partial<RuleState> & { key: string };
}

export interface SetActiveToolbarTabPayload {
  tab: LineToolbarTab;
}

export interface SetLineControlStatePayload {
  state: Partial<LineControlState>;
}

interface TypedLineKey {
  range: string;
  xAxis: XAxisKey;
  yAxis: YAxisKey;
  channels: {
    x: ChannelKey;
    y: ChannelKey;
  };
}

export const typedLineKeyToString = (key: TypedLineKey): string =>
  `${key.yAxis}-${key.xAxis}-${key.range}-${key.channels.x}-${key.channels.y}`;

export const typedLineKeyFromString = (key: string): TypedLineKey => {
  const [yAxis, xAxis, range, x, y] = key.split("-");
  return {
    range,
    xAxis: xAxis as XAxisKey,
    yAxis: yAxis as YAxisKey,
    channels: {
      x: Number(x),
      y: Number(y),
    },
  };
};

const generateTypedLineKeys = (state: LinePlotState): TypedLineKey[] =>
  Object.entries(state.ranges)
    .map(([xAxis, ranges]) =>
      ranges.flatMap((range) =>
        Object.entries(state.channels)
          .filter(([axis]) => !X_AXIS_KEYS.includes(axis as XAxisKey))
          .flatMap(([yAxis, yChannels]) => {
            const xChannel = state.channels[xAxis as XAxisKey];
            return (yChannels as ChannelKeys).map((yChannel) => ({
              range,
              xAxis: xAxis as XAxisKey,
              yAxis: yAxis as YAxisKey,
              channels: {
                x: xChannel,
                y: yChannel,
              },
            }));
          })
      )
    )
    .flat();

const updateLines = (state: LinePlotState): LineState[] => {
  const keys = generateTypedLineKeys(state);
  const lines: LineState[] = [];
  unique(keys).forEach((key) => {
    const strKey = typedLineKeyToString(key);
    const existing = state.lines.find((line) => strKey === line.key);
    if (existing != null) lines.push(existing);
    else lines.push({ key: strKey, ...ZERO_LINE_STATE });
  });
  return lines;
};

export const { actions, reducer: lineReducer } = createSlice({
  name: LINE_SLICE_NAME,
  initialState: ZERO_LINE_SLICE_STATE,
  reducers: {
    setLinePlot: (state, { payload }: PayloadAction<CreateLinePlotPayload>) => {
      const { key: layoutKey } = payload;
      const existing = state.plots[layoutKey];
      if (existing != null) return;
      state.plots[layoutKey] = payload;
      state.plots[layoutKey].lines = updateLines(payload);
    },
    deleteLinePlot: (state, { payload }: PayloadAction<DeleteLinePlotPayload>) => {
      const { layoutKey } = payload;
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state.plots[layoutKey];
    },
    setLinePlotViewport: (
      state,
      { payload }: PayloadAction<SetLinePlotViewportPayload>
    ) => {
      state.plots[payload.layoutKey].viewport = payload;
    },
    setLinePlotYChannels: (
      state,
      { payload }: PayloadAction<SetLinePlotYChannelsPayload>
    ) => {
      const { key: layoutKey, axisKey, channels } = payload;
      const p = state.plots[layoutKey];
      p.channels[axisKey] = channels;
      p.lines = updateLines(p);
    },
    addLinePlotYChannel: (
      state,
      { payload }: PayloadAction<AddLinePlotYChannelPayload>
    ) => {
      const { key: layoutKey, axisKey, channels } = payload;
      const p = state.plots[layoutKey];
      p.channels[axisKey] = unique([...p.channels[axisKey], ...channels]);
      p.lines = updateLines(p);
    },
    setLinePlotXChannel: (
      state,
      { payload }: PayloadAction<SetLinePlotXChannelPayload>
    ) => {
      const { key: layoutKey, axisKey, channel } = payload;
      const p = state.plots[layoutKey];
      p.channels[axisKey] = channel;
      p.lines = updateLines(p);
    },
    setLinePlotRanges: (
      state,
      { payload }: PayloadAction<SetLinePlotRangesPayload>
    ) => {
      const { key: layoutKey, axisKey, ranges } = payload;
      const p = state.plots[layoutKey];
      p.ranges[axisKey] = ranges;
      p.lines = updateLines(p);
    },
    setLinePlotLine: (state, { payload }: PayloadAction<SetLinePlotLinePaylaod>) => {
      const { key: layoutKey, line: line_ } = payload;
      const plot = state.plots[layoutKey];
      toArray(line_).forEach((line) => {
        const idx = plot.lines.findIndex((l) => l.key === line.key);
        if (idx >= 0) plot.lines[idx] = { ...plot.lines[idx], ...line };
      });
    },
    setLinePlotAxis: (state, { payload }: PayloadAction<SetLinePlotAxisPayload>) => {
      const { key: layoutKey, axisKey, axis } = payload;
      const plot = state.plots[layoutKey];
      plot.axes[axisKey] = { ...plot.axes[axisKey], ...axis };
    },
    setLinePlotTitle: (state, { payload }: PayloadAction<SetLinePlotTitlePayload>) => {
      const { key: layoutKey, title } = payload;
      const plot = state.plots[layoutKey];
      plot.title = { ...plot.title, ...title };
    },
    setLinePlotLegend: (
      state,
      { payload }: PayloadAction<SetLinePlotLegendPayload>
    ) => {
      const { key: layoutKey, legend } = payload;
      const plot = state.plots[layoutKey];
      plot.legend = { ...plot.legend, ...legend };
    },
    setLinePlotRule: (state, { payload }: PayloadAction<SetLinePlotRulePayload>) => {
      const { key: layoutKey, rule } = payload;
      const plot = state.plots[layoutKey];
      toArray(rule).forEach((r) => {
        const idx = plot.rules.findIndex((rr) => rr.key === r.key);
        if (idx >= 0) plot.rules[idx] = { ...plot.rules[idx], ...r };
        else {
          plot.rules.push({
            ...ZERO_RULE_STATE,
            label: `Rule ${plot.rules.length}`,
            ...r,
          });
        }
      });
    },
    setLineActiveToolbarTab: (
      state,
      { payload }: PayloadAction<SetActiveToolbarTabPayload>
    ) => {
      state.toolbar.activeTab = payload.tab;
    },
    setLineControlState: (
      state,
      { payload }: PayloadAction<SetLineControlStatePayload>
    ) => {
      state.control = { ...state.control, ...payload.state };
    },
  },
});

export const {
  deleteLinePlot,
  setLinePlotViewport,
  setLinePlotYChannels,
  setLinePlotXChannel,
  setLinePlotRanges,
  setLinePlotLine,
  setLinePlotAxis,
  addLinePlotYChannel,
  setLinePlotTitle,
  setLinePlotLegend,
  setLinePlotRule,
  setLineActiveToolbarTab,
  setLineControlState,
} = actions;

export type LineAction = ReturnType<(typeof actions)[keyof typeof actions]>;
export type LinePayload = LineAction["payload"];

export const createLinePlot =
  (
    initial: Partial<LinePlotState> & Omit<Partial<LayoutState>, "type">
  ): LayoutCreator =>
  ({ dispatch }) => {
    const { name = "Line Plot", location = "mosaic", window, tab, ...rest } = initial;
    const key = initial.key ?? nanoid();
    dispatch(actions.setLinePlot({ ...Deep.copy(ZERO_LINE_VIS), ...rest, key }));
    return {
      key,
      name,
      location,
      type: "line",
      window,
      tab,
    };
  };
