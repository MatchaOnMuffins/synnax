// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Bounds, Box, Location, Scale } from "@synnaxlabs/x";
import { z } from "zod";

import { aether } from "@/aether/aether";
import { CSS } from "@/css";
import { theming } from "@/theming/aether";
import { fontString } from "@/theming/core/fontString";
import { axis } from "@/vis/axis";
import { Canvas } from "@/vis/axis/canvas";
import { FindResult } from "@/vis/line/aether/line";
import {
  calculateGridPosition,
  autoBounds,
  withinSizeThreshold,
} from "@/vis/lineplot/aether/grid";
import { YAxis, YAxisProps } from "@/vis/lineplot/aether/YAxis";
import { render } from "@/vis/render";

export const xAxisStateZ = axis.axisStateZ
  .extend({
    location: Location.strictYZ.optional().default("bottom"),
    bound: Bounds.looseZ.optional(),
    autoBoundPadding: z.number().optional().default(0.01),
    size: z.number().optional().default(0),
    labelSize: z.number().optional().default(0),
  })
  .partial({
    color: true,
    font: true,
    gridColor: true,
  });

export interface XAxisProps extends Omit<YAxisProps, "xDataToDecimalScale"> {
  viewport: Box;
}

interface InternalState {
  ctx: render.Context;
  core: axis.Axis;
}

export class XAxis extends aether.Composite<typeof xAxisStateZ, InternalState, YAxis> {
  static readonly TYPE = CSS.BE("line-plot", "x-axis");
  schema = xAxisStateZ;

  afterUpdate(): void {
    this.internal.ctx = render.Context.use(this.ctx);
    const theme = theming.use(this.ctx);
    this.internal.core = new Canvas(this.internal.ctx, {
      color: theme.colors.gray.p1,
      font: fontString(theme, "small"),
      gridColor: theme.colors.gray.m2,
      ...this.state,
      size: this.state.size + this.state.labelSize,
    });
  }

  async render(props: XAxisProps): Promise<void> {
    const dataToDecimal = await this.dataToDecimalScale(props.viewport);
    await this.renderAxis(props, dataToDecimal.reverse());
    await this.renderYAxes(props, dataToDecimal);
  }

  async findByXDecimal(props: XAxisProps, target: number): Promise<FindResult[]> {
    const scale = await this.dataToDecimalScale(props.viewport);
    return await this.findByXValue(props, scale.reverse().pos(target));
  }

  async findByXValue(props: XAxisProps, target: number): Promise<FindResult[]> {
    const xDataToDecimalScale = await this.dataToDecimalScale(props.viewport);
    const p = { ...props, xDataToDecimalScale };
    const prom = this.children.map(async (el) => await el.findByXValue(p, target));
    return (await Promise.all(prom)).flat();
  }

  private async renderAxis(
    props: XAxisProps,
    decimalToDataScale: Scale
  ): Promise<void> {
    const { core } = this.internal;
    const { grid, container } = props;
    const position = calculateGridPosition(this.key, grid, container);
    const p = { ...props, position, decimalToDataScale };
    const { size } = core.render(p);
    if (!withinSizeThreshold(this.state.size, size))
      this.setState((p) => ({ ...p, size }));
  }

  private async renderYAxes(
    props: XAxisProps,
    xDataToDecimalScale: Scale
  ): Promise<void> {
    const p = { ...props, xDataToDecimalScale };
    await Promise.all(this.children.map(async (el) => await el.render(p)));
  }

  private async xBounds(): Promise<Bounds> {
    if (this.state.bound != null && !this.state.bound.isZero) return this.state.bound;
    const bounds = (
      await Promise.all(this.children.map(async (el) => await el.xBounds()))
    ).filter((b) => b.isFinite);
    return autoBounds(bounds, this.state.autoBoundPadding, this.state.type);
  }

  private async dataToDecimalScale(viewport: Box): Promise<Scale> {
    const bounds = await this.xBounds();
    return Scale.scale(bounds)
      .scale(1)
      .translate(-viewport.x)
      .magnify(1 / viewport.width);
  }
}