// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Box, Destructor, XY } from "@synnaxlabs/x";
import { z } from "zod";

import { AetherLeaf } from "@/core/aether/worker";
import { Color } from "@/core/color";
import { textDimensions } from "@/core/std/Typography/textDimensions";
import { PIDElement } from "@/core/vis/PID/aether";
import { RenderContext, RenderController } from "@/core/vis/render";
import { TelemContext } from "@/core/vis/telem/TelemContext";
import {
  NumericTelemSource,
  numericTelemSourceProps,
} from "@/core/vis/telem/TelemSource";

const valueState = z.object({
  box: Box.z,
  telem: numericTelemSourceProps,
  units: z.string(),
  font: z.string(),
  color: Color.z,
  precision: z.number().optional().default(2),
  width: z.number().optional().default(100),
});

export interface ValueProps {
  position: XY;
}

interface InternalState {
  render: RenderContext;
  telem: NumericTelemSource;
  cleanupTelem: Destructor;
  requestRender: (() => void) | null;
}

export class AetherValue
  extends AetherLeaf<typeof valueState, InternalState>
  implements PIDElement
{
  static readonly TYPE = "value";
  static readonly z = valueState;
  schema = AetherValue.z;

  afterUpdate(): void {
    this.internal.render = RenderContext.use(this.ctx);
    const { telem, cleanupTelem } = TelemContext.use<NumericTelemSource>(
      this.ctx,
      this.key,
      this.state.telem
    );
    this.internal.telem = telem;
    this.internal.cleanupTelem = cleanupTelem;
    this.internal.telem.onChange(() => this.requestRender());
    this.internal.requestRender = RenderController.useOptionalRequest(this.ctx);
    this.requestRender();
  }

  afterDelete(): void {
    const { requestRender, cleanupTelem, render: renderCtx } = this.internal;
    cleanupTelem();
    if (requestRender == null) renderCtx.erase(new Box(this.state.box));
    else requestRender();
  }

  private requestRender(): void {
    const { requestRender } = this.internal;
    if (requestRender != null) requestRender();
    else void this.render();
  }

  async render(props?: ValueProps): Promise<void> {
    const { render: renderCtx, telem } = this.internal;
    const box = new Box(this.state.box);
    if (box.isZero) return;
    const { lower2d: canvas } = renderCtx;

    const value = (await telem.value()).toFixed(this.state.precision);
    const valueStr = `${value} ${this.state.units}`;

    canvas.font = this.state.font;
    const dims = textDimensions(valueStr, this.state.font, canvas);
    renderCtx.erase(new Box(this.prevState.box));

    if (this.state.width < dims.width)
      this.setState((p) => ({ ...p, width: dims.width }));

    const labelPosition = box.topLeft
      .translate(props?.position ?? XY.ZERO)
      .translate({
        x: box.width / 2,
        y: box.height / 2,
      })
      .translate({ y: dims.height / 2, x: -dims.width / 2 });

    canvas.fillStyle = this.state.color.hex;
    canvas.fillText(valueStr, ...labelPosition.couple);
  }
}
