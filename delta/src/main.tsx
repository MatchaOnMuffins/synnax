// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { Provider } from "@synnaxlabs/drift";
import { Menu as PMenu, Pluto } from "@synnaxlabs/pluto";
import ReactDOM from "react-dom/client";

import "./index.css";
import { LinePlot } from "./line/LinePlot/LinePlot";
import { PID } from "./pid/PID/PID";
import { VisCanvas } from "./vis";
import { VisLayoutSelectorRenderer } from "./vis/components/VisLayoutSelector";
import WorkerURL from "./worker?worker&url";

import { ConnectCluster, useSelectCluster } from "@/cluster";
import { Menu } from "@/components";
import { Docs } from "@/docs";
import {
  LayoutRendererProvider,
  LayoutWindow,
  useThemeProvider,
  GetStarted,
} from "@/layout";
import { LayoutMain } from "@/layouts/LayoutMain";
import { store } from "@/store";
import { useLoadTauriVersion } from "@/version";
import { DefineRange } from "@/workspace";

import "@synnaxlabs/media/dist/style.css";
import "@synnaxlabs/pluto/dist/style.css";

const layoutRenderers = {
  main: LayoutMain,
  connectCluster: ConnectCluster,
  visualization: VisLayoutSelectorRenderer,
  defineRange: DefineRange,
  getStarted: GetStarted,
  docs: Docs,
  pid: PID,
  vis: VisLayoutSelectorRenderer,
  line: LinePlot,
};

export const DefaultContextMenu = (): ReactElement => (
  <PMenu>
    <Menu.Item.HardReload />
  </PMenu>
);

const MainUnderContext = (): ReactElement => {
  const theme = useThemeProvider();
  const menuProps = PMenu.useContextMenu();
  useLoadTauriVersion();
  const cluster = useSelectCluster();
  return (
    <Pluto {...theme} workerEnabled connParams={cluster?.props} workerURL={WorkerURL}>
      <VisCanvas>
        <PMenu.ContextMenu menu={() => <DefaultContextMenu />} {...menuProps}>
          <LayoutWindow />
        </PMenu.ContextMenu>
      </VisCanvas>
    </Pluto>
  );
};

const Main = (): ReactElement | null => {
  return (
    <Provider store={store} errorContent={(e) => <h1>{e.message}</h1>}>
      <LayoutRendererProvider value={layoutRenderers}>
        <MainUnderContext />
      </LayoutRendererProvider>
    </Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Main />);
