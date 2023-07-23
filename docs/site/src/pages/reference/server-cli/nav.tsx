// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { PageNavLeaf } from "@/components/PageNav";

export const serverCLINav: PageNavLeaf = {
  key: "server-cli",
  name: "Server CLI",
  children: [
    {
      key: "start",
      url: "/reference/server-cli/start",
      name: "Start",
    },
    {
      key: "systemd-service",
      url: "/reference/server-cli/systemd-service",
      name: "Systemd Service",
    },
  ],
};
