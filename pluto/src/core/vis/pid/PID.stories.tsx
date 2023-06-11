// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import type { Meta, StoryFn } from "@storybook/react";

import { VisCanvas } from "../Canvas";

import { PID } from "./PID";

import { Pluto } from "@/Pluto";

const story: Meta<typeof PID> = {
  title: "Vis/PID",
  component: PID,
};

const Example = (): ReactElement => {
  return (
    <Pluto>
      <VisCanvas
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <PID />
      </VisCanvas>
    </Pluto>
  );
};

export const Default: StoryFn = Example.bind({});

// eslint-disable-next-line import/no-default-export
export default story;