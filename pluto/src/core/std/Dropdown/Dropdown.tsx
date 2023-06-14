// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  forwardRef,
  ReactElement,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";

import { CrudeYLocation } from "@synnaxlabs/x";

import { CSS } from "@/core/css";
import { useClickOutside } from "@/core/hooks";
import { Pack, PackProps } from "@/core/std/Pack";
import { Space } from "@/core/std/Space";

import "@/core/std/Dropdown/Dropdown.css";

/** Return type for the {@link useDropdown} hook. */
export interface UseDropdownReturn {
  visible: boolean;
  ref: RefObject<HTMLDivElement>;
  close: () => void;
  open: () => void;
  toggle: (vis?: boolean) => void;
}

export const useDropdown = (initialVisible: boolean = false): UseDropdownReturn => {
  const [visible, setVisible] = useState(initialVisible);
  const ref = useRef<HTMLDivElement>(null);
  const toggle = useCallback(
    (vis?: boolean) => setVisible(vis ?? !visible),
    [setVisible]
  );
  const open = useCallback(() => toggle(true), [toggle]);
  const close = useCallback(() => toggle(false), [toggle]);
  useClickOutside(ref, close);
  return { visible, ref, open, close, toggle };
};

/** Props for the {@link Dropdown} component. */
export interface DropdownProps
  extends Pick<UseDropdownReturn, "visible">,
    Omit<PackProps, "ref" | "reverse" | "size" | "empty"> {
  location?: CrudeYLocation;
  children: [ReactElement, ReactElement];
  keepMounted?: boolean;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      visible,
      children,
      location = "bottom",
      keepMounted = true,
      ...props
    }: DropdownProps,
    ref
  ): ReactElement => (
    <Pack
      {...props}
      ref={ref}
      className={CSS.B("dropdown")}
      direction="y"
      reverse={location === "top"}
    >
      {children[0]}
      <Space
        className={CSS(
          CSS.BE("dropdown", "dialog"),
          CSS.loc(location),
          CSS.visible(visible)
        )}
        role="dialog"
        empty
      >
        {children[1]}
      </Space>
    </Pack>
  )
);
Dropdown.displayName = "Dropdown";
