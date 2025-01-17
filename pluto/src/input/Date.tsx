// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { forwardRef, useEffect } from "react";

import { TimeStamp } from "@synnaxlabs/x";

import { Align } from "@/align";
import { CSS } from "@/css";
import { DragButton, type DragButtonExtensionProps } from "@/input/DragButton";
import { Text } from "@/input/Text";
import { type BaseProps } from "@/input/types";

import "@/input/Date.css";

export interface DateProps extends BaseProps<number>, DragButtonExtensionProps {
  showDragHandle?: boolean;
}

const DRAG_SCALE = {
  x: TimeStamp.HOUR.valueOf(),
  y: TimeStamp.days(0.75).valueOf(),
};

/**
 * A controlled Date input component.
 *
 * @param props - The props for the input component. Unlisted props are passed to the
 * underlying input element.
 * @param props.value - The value of the input represented as a number of nanoseconds
 * since the Unix epoch.
 * @param props.onChange - A function to call when the input value changes.
 * @param props.size - The size of the input: "small" | "medium" | "large".
 * @default "medium"
 * @param props.selectOnFocus - Whether the input should select its contents when focused.
 * @defaul true
 * @param props.centerPlaceholder - Whether the placeholder should be centered.
 * @default false
 * @param props.showDragHandle - Whether or not to show a drag handle to set the time.
 * @default true
 * @param props.dragScale - The scale of the drag handle.
 * @default x: 1 Hour, y: 3/4 Day
 * @param props.dragDirection - The direction of the drag handle.
 * @default undefined
 */
export const Date = forwardRef<HTMLInputElement, DateProps>(
  (
    { size = "medium", onChange, value, className, showDragHandle = true, ...props },
    ref,
  ) => {
    const ts = new TimeStamp(value, "UTC");

    useEffect(() => {
      // We want the date to be at midnight in local time.
      const local = ts.sub(TimeStamp.utcOffset);
      // All good.
      if (local.remainder(TimeStamp.DAY).isZero) return;
      // If it isn't, take off the extra time.
      const tsV = local.sub(local.remainder(TimeStamp.DAY));
      // We have a correcly zeroed timestamp in local, now
      // add back the UTC offset to get the UTC timestamp.
      onChange(new TimeStamp(tsV, "local").valueOf());
    }, [value]);

    const handleChange = (value: string | number): void => {
      let ts: TimeStamp;
      // This is coming from the drag button. We give the drag
      // button a value in UTC, and it adds or subtracts a fixed
      // amount of time, giving us a new UTC timestamp.
      if (typeof value === "number") ts = new TimeStamp(value, "UTC");
      // This means the user hasn't finished inputting a date.
      else if (value.length === 0) return;
      // No need to worry about taking remainders here. The input
      // will prevent values over a day. We interpret the input as
      // local, which adds the UTC offset back in.
      else ts = new TimeStamp(value, "local");
      onChange(ts.valueOf());
    };

    // The props value is in UTC, but we want the user
    // to view AND enter in local. This subtracts the
    // UTC offset from the timestamp.
    const inputValue = ts.fString("ISODate", "local");
    const input = (
      <Text
        ref={ref}
        value={inputValue}
        className={CSS(CSS.B("input-date"), className)}
        onChange={handleChange}
        type="date"
        {...props}
      />
    );

    if (!showDragHandle) return input;
    return (
      <Align.Pack>
        {input}
        <DragButton value={value} onChange={handleChange} dragScale={DRAG_SCALE} />
      </Align.Pack>
    );
  },
);
Date.displayName = "InputDate";
