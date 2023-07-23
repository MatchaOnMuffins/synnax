// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { DetailedHTMLProps, HTMLAttributes, ReactElement, useRef } from "react";

import { Location, LooseLocationT } from "@synnaxlabs/x";

import { CSS } from "@/core/css";
import { preventDefault } from "@/util/event";

import "@/core/std/Resize/ResizeCore.css";

export interface ResizeCoreProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  location: LooseLocationT;
  size: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  sizeUnits?: "px" | "%";
  showHandle?: boolean;
}

export const ResizeCore = ({
  location: loc_,
  style,
  size,
  className,
  children,
  onDragStart,
  sizeUnits = "px",
  showHandle = true,
  ...props
}: ResizeCoreProps): ReactElement => {
  const loc = new Location(loc_);
  return (
    <div
      className={CSS(CSS.B("resize"), CSS.loc(loc), CSS.dir(loc.direction), className)}
      style={{ [loc.direction.dimension]: `${size}${sizeUnits}`, ...style }}
      {...props}
    >
      {children}
      {showHandle && (
        <div
          draggable
          className={CSS(CSS.BE("resize", "handle"), CSS.bordered(loc.inverse.crude))}
          onDragStart={onDragStart}
          onDrag={preventDefault}
          onDragEnd={preventDefault}
        />
      )}
    </div>
  );
};
