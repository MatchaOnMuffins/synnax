// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { Icon } from "@synnaxlabs/media";

import { Color, CrudeColor } from "@/core/color";
import { CSS } from "@/core/css";
import { Button } from "@/core/std/Button";
import { Typography, Text, TextProps } from "@/core/std/Typography";
import { ComponentSize } from "@/util/component";

import "@/core/std/Tag/Tag.css";

export interface TagProps extends Omit<TextProps, "level" | "size" | "wrap"> {
  icon?: ReactElement;
  onClose?: () => void;
  color?: CrudeColor;
  size?: ComponentSize;
  variant?: "filled" | "outlined";
}

export const Tag = ({
  children = "",
  size = "medium",
  variant = "filled",
  color = "var(--pluto-primary-z)",
  icon,
  onClose,
  style,
  onDragStart,
  ...props
}: TagProps): ReactElement => {
  const cssColor = Color.cssString(color);
  const closeIcon =
    onClose == null ? undefined : (
      <Button.Icon
        aria-label="close"
        className={CSS.BE("tag", "close")}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <Icon.Close />
      </Button.Icon>
    );
  return (
    <Text.WithIcon
      endIcon={closeIcon}
      startIcon={icon}
      className={CSS.B("tag")}
      level={Typography.ComponentSizeLevels[size]}
      noWrap
      onDragStart={onDragStart}
      style={{
        border: `var(--pluto-border-width) solid ${cssColor}`,
        backgroundColor: variant === "filled" ? cssColor : "transparent",
        cursor: onClose == null ? "default" : "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </Text.WithIcon>
  );
};
