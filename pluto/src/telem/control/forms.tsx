// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { ChannelKey } from "@synnaxlabs/client";

import { Channel } from "@/channel";
import { componentRenderProp } from "@/index";
import { Input } from "@/input";
import { control } from "@/telem/control/aether";

export interface NumericSinkFormProps
  extends Input.ItemProps<control.NumericSinkProps> {}

export const NumericSinkForm = ({
  value,
  onChange,
  ...props
}: NumericSinkFormProps): ReactElement => {
  const handleChannelChange = (channel: ChannelKey): void =>
    onChange({ ...value, channel });

  return (
    <Input.Item<ChannelKey, ChannelKey, Channel.SelectSingleProps>
      label="Channel"
      value={value.channel}
      onChange={handleChannelChange}
      {...props}
    >
      {componentRenderProp(Channel.SelectSingle)}
    </Input.Item>
  );
};