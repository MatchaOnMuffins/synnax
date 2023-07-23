// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ComponentPropsWithoutRef } from "react";

import { ComponentSize } from "@/util/component";

export type InputValue = unknown;

export interface InputControl<
  I extends InputValue = InputValue,
  O extends InputValue = I
> {
  value: I;
  onChange: (value: O) => void;
}

export interface PartialInputControl<
  I extends InputValue = InputValue,
  O extends InputValue = I
> extends Partial<InputControl<I, O>> {}

type HTMLInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "size" | "onChange" | "value" | "children"
>;

export type InputVariant = "outlined" | "shadow";

export interface InputBaseProps<
  I extends InputValue = InputValue,
  O extends InputValue = I
> extends HTMLInputProps,
    InputControl<I, O> {
  size?: ComponentSize;
  variant?: InputVariant;
}
