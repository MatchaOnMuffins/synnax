// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { TypographyLevel } from "@/core/std";
import { Theme } from "@/core/theming/theme";
import { useThemeContext } from "@/core/theming/ThemeContext";

export const font = (theme: Theme, level: TypographyLevel): string => {
  const {
    typography,
    sizes: { base },
  } = theme;
  const size = typography[level].size as number;
  return ` ${base * size}px ${typography.family}`;
};

export const useFont = (level: TypographyLevel): string => {
  const { theme } = useThemeContext();
  return font(theme, level);
};