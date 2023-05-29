// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ForwardedRef, forwardRef, ReactElement } from "react";

import { CSS } from "@/core/css";
import { Generic, GenericProps } from "@/core/std/Generic";
import { TypographyLevel } from "@/core/std/Typography/types";

export interface CoreTextProps<L extends TypographyLevel = "h1"> {
  /* The level of text to display i.e. p, h1, h2 */
  level: L;
  /* The text to display */
  children?: string | number;
  /* The color of the text */
  color?: string;
  /* NoWrap prevents the text from wrapping */
  noWrap?: boolean;
}

export type TextProps<L extends TypographyLevel = "h1"> = Omit<GenericProps<L>, "el"> &
  CoreTextProps<L>;

const CoreText = <L extends TypographyLevel = "h1">(
  {
    level = "h1" as L,
    color,
    className,
    style,
    children,
    noWrap = false,
    ...props
  }: TextProps<L>,
  ref: ForwardedRef<JSX.IntrinsicElements[L]>
): ReactElement => (
  // @ts-expect-error
  <Generic<L>
    el={level}
    ref={ref}
    style={{ color, ...style }}
    className={CSS(CSS.B("text"), CSS.BM("text", level), CSS.noWrap(noWrap), className)}
    {...props}
  >
    {children}
  </Generic>
);

export const Text = forwardRef(CoreText) as <L extends TypographyLevel = "h1">(
  props: TextProps<L> & { ref?: ForwardedRef<JSX.IntrinsicElements[L]> }
) => ReactElement;