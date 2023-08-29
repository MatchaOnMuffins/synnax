// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement, useCallback, useEffect, useRef } from "react";

import { Bounds, Box } from "@synnaxlabs/x";
import { z } from "zod";

import { Aether } from "@/aether";
import { Align } from "@/align";
import { useCursorDrag } from "@/hooks/useCursorDrag";
import { state } from "@/state";
import { Text } from "@/text";
import { preventDefault } from "@/util/event";
import { rule } from "@/vis/rule/aether";

export interface RuleProps
  extends Omit<z.input<typeof rule.ruleStateZ>, "dragging" | "pixelPosition"> {
  label?: string;
  onLabelChange?: (label: string) => void;
  units?: string;
  onPositionChange?: (position: number) => void;
}

export const Rule = Aether.wrap<RuleProps>(
  "Rule",
  ({
    aetherKey,
    label,
    position: propsPosition,
    onLabelChange,
    onPositionChange,
    units = "",
    color,
    lineWidth,
    lineDash,
  }): ReactElement | null => {
    const [internalLabel, setInternalLabel] = state.usePurePassthrough({
      value: label,
      onChange: onLabelChange,
      initial: "",
    });

    const [, { position, pixelPosition }, setState] = Aether.use({
      aetherKey,
      type: rule.Rule.TYPE,
      schema: rule.ruleStateZ,
      initialState: {
        color,
        dragging: false,
        position: propsPosition,
        lineWidth,
        lineDash,
      },
    });

    useEffect(() => {
      const b = new Bounds(position + 0.01, position - 0.01);
      if (!b.contains(propsPosition))
        onPositionChange?.(Math.trunc(position * 100) / 100);
    }, [position]);

    const pixelPosRef = useRef(pixelPosition);
    if (pixelPosition !== pixelPosRef.current) pixelPosRef.current = pixelPosition;

    const dragStartRef = useRef(pixelPosition);

    useEffect(() => {
      setState((p) => ({ ...p, position: propsPosition, color, lineWidth, lineDash }));
    }, [propsPosition, color, lineWidth, lineDash]);

    const handleDragStart = useCursorDrag({
      onStart: useCallback(() => {
        setState((p) => ({ ...p, dragging: true }));
        dragStartRef.current = pixelPosRef.current;
      }, []),
      onMove: (box: Box) => {
        setState((p) => ({
          ...p,
          pixelPosition: dragStartRef.current + box.signedHeight,
        }));
      },
      onEnd: useCallback(() => {
        setState((p) => ({ ...p, dragging: false }));
        dragStartRef.current = pixelPosition;
      }, []),
    });

    return (
      <div
        style={{
          position: "absolute",
          top: `calc(${pixelPosition}px - 0.5rem)`,
          gridColumnStart: "plot-start",
          gridColumnEnd: "plot-end",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "1rem",
            cursor: "ns-resize",
            width: "100%",
          }}
          onDrag={preventDefault}
          onDragEnd={preventDefault}
          onDragStart={handleDragStart}
          draggable
        />
        <Align.Space direction="x" align="center" style={{ marginLeft: "2rem" }}>
          <Text.Editable level="p" value={internalLabel} onChange={setInternalLabel} />
          <Text.Text
            level="p"
            style={{ padding: "0.25rem 0", width: "fit-content" }}
          >{`${position.toFixed(2)} ${units}`}</Text.Text>
        </Align.Space>
      </div>
    );
  }
);