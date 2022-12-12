export type Series = {
  label: string;
  x: string;
  y: string;
  color?: string;
  axis?: string;
};

type AxisLocation = "top" | "bottom" | "left" | "right";

export type Axis = {
  key: string;
  location?: AxisLocation;
  range?: [number, number];
  label: string;
};

export type Array = uPlot.TypedArray | number[];

export interface PlotData {
  [key: string]: Array;
}

export interface LinePlotMetadata {
  width: number;
  height: number;
  series: Series[];
  axes: Axis[];
}