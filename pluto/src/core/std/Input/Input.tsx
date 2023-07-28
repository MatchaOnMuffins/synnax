// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactNode, forwardRef } from "react";

import { CSS } from "@/core/css";
import { InputBaseProps } from "@/core/std/Input/types";

import "@/core/std/Input/Input.css";

export interface InputProps extends Omit<InputBaseProps<string>, "placeholder"> {
  selectOnFocus?: boolean;
  centerPlaceholder?: boolean;
  placeholder?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = "medium",
      value,
      onChange,
      className,
      onFocus,
      selectOnFocus = false,
      centerPlaceholder = false,
      variant = "outlined",
      placeholder,
      ...props
    },
    ref
  ) => (
    <div
      className={CSS(
        CSS.BE("input", "container"),
        centerPlaceholder && CSS.BEM("input", "container", "placeholder-centered")
      )}
    >
      {value.length === 0 && <p>{placeholder}</p>}
      <input
        ref={ref}
        value={value}
        className={CSS(
          CSS.B("input"),
          CSS.size(size),
          CSS.BM("input", variant),
          className
        )}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if (selectOnFocus) e.target.select();
          onFocus?.(e);
        }}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";
