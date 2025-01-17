// Copyrght 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Icon } from "@synnaxlabs/media";

import { type status } from "@/status/aether";
import { variantColors } from "@/status/colors";

export interface CircleProps {
  variant: status.Variant;
}

export const Circle = ({ variant }: CircleProps): ReactElement => {
  return <Icon.Circle color={variantColors[variant]} />;
};
