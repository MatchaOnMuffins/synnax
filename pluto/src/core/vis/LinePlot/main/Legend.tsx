// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  CSSProperties,
  ReactElement,
  RefObject,
  memo,
  useCallback,
  useRef,
  useState,
} from "react";

import { XY, CrudeXY, Box, XYScale, XYLocation, Scale } from "@synnaxlabs/x";

import { useLinePlotContext } from "./LinePlot";

import { Color } from "@/core/color";
import { ColorSwatch } from "@/core/color/ColorSwatch";
import { CSS } from "@/core/css";
import { useCursorDrag } from "@/core/hooks/useCursorDrag";
import { Input, Space, SpaceProps, Text } from "@/core/std";
import { PartialInputControl } from "@/core/std/Input/types";
import { preventDefault } from "@/util/event";

import "@/core/vis/LinePlot/main/Legend.css";

export interface LegendProps
  extends Omit<SpaceProps, "onChange">,
    Partial<PartialInputControl<CrudeXY>> {
  onLabelChange?: (id: string, label: string) => void;
  onColorChange?: (id: string, color: Color) => void;
}

type CSSPosition = Partial<
  Pick<CSSProperties, "left" | "right" | "top" | "bottom" | "display">
>;

export const intelligentPosition = (
  pos: XY,
  ref: RefObject<HTMLDivElement>
): CSSPosition => {
  if (ref.current == null) return { display: "none" };
  const ret: CSSPosition = {};
  const parentBox = new Box(ref.current.parentElement as HTMLDivElement);
  const box = new Box(ref.current);
  if (pos.x > 0.8) {
    ret.right = `${(1 - pos.x) * parentBox.width - box.width}px`;
  } else if (pos.x < 0.2) {
    ret.left = `${pos.x * parentBox.width}px`;
  } else {
    ret.left = `${pos.x * 100}%`;
  }
  if (pos.y > 0.8) {
    ret.bottom = `${(1 - pos.y) * parentBox.height - box.height}px`;
  } else if (pos.y < 0.2) {
    ret.top = `${pos.y * parentBox.height}px`;
  } else {
    ret.top = `${pos.y * 100}%`;
  }
  return ret;
};

export const Legend = memo(
  ({
    className,
    value,
    onChange,
    style,
    onLabelChange,
    onColorChange,
    ...props
  }: LegendProps): ReactElement | null => {
    const { lines } = useLinePlotContext("Legend");
    const [position, setPosition] = Input.usePassthrough({
      value,
      onChange,
      initialValue: new XY(0.1, 0.1).crude,
    });
    const [pickerVisible, setPickerVisible] = useState(false);
    useLinePlotContext("Legend");
    const positionRef = useRef(position);
    const ref = useRef<HTMLDivElement | null>(null);
    const [intelligentPos, setIntelligentPos] = useState<CSSPosition>({});
    if (position !== null) {
      style = {
        ...style,
        ...intelligentPos,
      };
    }

    const refCallback = useCallback((el: HTMLDivElement | null) => {
      ref.current = el;
      setIntelligentPos(intelligentPosition(new XY(position), ref));
    }, []);

    const calculatePosition = useCallback(
      (box: Box): CrudeXY => {
        if (ref.current?.parentElement == null || pickerVisible)
          return positionRef.current;
        const bounds = new Box(ref.current.parentElement);
        const b = Box.DECIMAL.reRoot(XYLocation.TOP_LEFT);
        const scale = XYScale.scale(bounds).scale(b);
        const el = scale.box(new Box(ref.current));
        const clamp = new XYScale().clamp(
          new Box(b.topLeft, {
            width: b.width - el.width,
            height: b.height - el.height,
          })
        );
        return clamp.pos(
          new XY(positionRef.current).translate(scale.box(box).signedDims)
        ).crude;
      },
      [pickerVisible]
    );

    const handleCursorDragStart = useCursorDrag({
      onMove: useCallback(
        (box: Box) => {
          const pos = calculatePosition(box);
          setIntelligentPos(intelligentPosition(new XY(pos), ref));
        },
        [setPosition]
      ),
      onEnd: useCallback(
        (box: Box) => (positionRef.current = calculatePosition(box)),
        [pickerVisible]
      ),
    });

    if (lines.length === 0) return null;

    return (
      <Space
        className={CSS(className, CSS.B("legend"))}
        bordered
        rounded
        style={style}
        onDragStart={handleCursorDragStart}
        draggable
        ref={refCallback}
        {...props}
        onDrag={preventDefault}
        onDragEnd={preventDefault}
        size="small"
      >
        {lines.map(({ key, color, label }) => (
          <Space key={key} direction="x" align="center">
            <ColorSwatch
              value={color}
              onChange={(c) => onColorChange?.(key, c)}
              onVisibleChange={setPickerVisible}
              size="tiny"
            />
            <Text.MaybeEditable
              level="small"
              value={label}
              onChange={onLabelChange != null && ((l) => onLabelChange(key, l))}
              noWrap
            />
          </Space>
        ))}
      </Space>
    );
  }
);
Legend.displayName = "Legend";
