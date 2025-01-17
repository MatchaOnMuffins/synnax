// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Icon } from "@synnaxlabs/media";

import { Button } from "@/button";
import { Color } from "@/color";
import { CSS } from "@/css";
import { Text } from "@/text";
import { type ComponentSize } from "@/util/component";

import "@/tag/Tag.css";

export interface TagProps extends Omit<Text.TextProps, "level" | "size" | "wrap"> {
  icon?: ReactElement;
  onClose?: () => void;
  color?: Color.Crude;
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
      level={Text.ComponentSizeLevels[size]}
      noWrap
      onDragStart={onDragStart}
      style={{
        border: `var(--pluto-border-width) solid ${cssColor ?? ""}`,
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
