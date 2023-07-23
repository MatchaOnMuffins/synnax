// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ForwardedRef, ReactElement, forwardRef } from "react";

import {
  TimeStampStringFormat,
  TimeStamp,
  CrudeTimeStamp,
  TZInfo,
} from "@synnaxlabs/x";

import { Text } from "@/core/std/Typography/Text";
import type { TextProps } from "@/core/std/Typography/Text";
import { TypographyLevel } from "@/core/std/Typography/types";

export type TextDateTimeProps<L extends TypographyLevel = "h1"> = Omit<
  TextProps<L>,
  "children" | "ref"
> & {
  children: CrudeTimeStamp;
  format?: TimeStampStringFormat;
  suppliedTZ?: TZInfo;
  displayTZ?: TZInfo;
};

export const CoreTextDateTime = <L extends TypographyLevel = "h1">(
  {
    format = "dateTime",
    suppliedTZ = "UTC",
    displayTZ = "local",
    children,
    ...props
  }: TextDateTimeProps<L>,
  ref: ForwardedRef<JSX.IntrinsicElements[L]>
): ReactElement => (
  // @ts-expect-error
  <Text<L> ref={ref} {...props}>
    {new TimeStamp(children, suppliedTZ).fString(format, displayTZ)}
  </Text>
);

// @ts-expect-error
export const TextDateTime = forwardRef(CoreTextDateTime) as <
  L extends TypographyLevel = "h1"
>(
  props: TextDateTimeProps<L> & { ref?: React.Ref<L> }
) => ReactElement;
