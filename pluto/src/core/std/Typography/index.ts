// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Text as CoreText } from "./Text";
import { TextDateTime } from "./TextDateTime";
import { TextEditable } from "./TextEditable";
import { TextLink } from "./TextLink";
import { TextWithIcon } from "./TextWithIcon";
import {
  ComponentSizeTypographyLevels,
  TypographyLevelComponentSizes,
  TypographyLevels,
} from "./types";
import "./Typography.css";

export type { CoreTextProps, TextProps } from "./Text";
export type { Size, TypographySpec, TypographyLevel } from "./types";
export type { TextWithIconProps } from "./TextWithIcon";
export type { TextLinkProps } from "./TextLink";

type CoreTextType = typeof CoreText;

interface TextType extends CoreTextType {
  WithIcon: typeof TextWithIcon;
  Editable: typeof TextEditable;
  DateTime: typeof TextDateTime;
  Link: typeof TextLink;
}

export const Text = CoreText as TextType;

Text.WithIcon = TextWithIcon;
Text.Editable = TextEditable;
Text.DateTime = TextDateTime;
Text.Link = TextLink;

/** Holds typography related components and constants. */
export const Typography = {
  /** A map of component sizes to typography levels that are similar in size. */
  ComponentSizeLevels: ComponentSizeTypographyLevels,
  /** A map of typography levels to component sizes that are similar in size. */
  LevelComponentSizes: TypographyLevelComponentSizes,
  /** A list of all typography levels. */
  Levels: TypographyLevels,
  /**
   * Renders text of a given typography level.
   */
  Text,
};