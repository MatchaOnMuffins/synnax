// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement } from "react";

import { List, Text } from "@synnaxlabs/pluto";
import { useDispatch } from "react-redux";

import {
  renameLayout,
  RenderableLayout,
  selectLayoutMosaicTab,
  useSelectActiveMosaicTabKey,
  useSelectLayouts,
} from "@/layout";

export const VisList = (): ReactElement => {
  const layouts = useSelectLayouts().filter((layout) =>
    ["line", "pid"].includes(layout.type)
  );
  const activeLayout = useSelectActiveMosaicTabKey();
  const d = useDispatch();
  const handleSelect = ([key]: readonly string[]): void => {
    d(selectLayoutMosaicTab({ tabKey: key }));
  };
  return (
    <List<string, RenderableLayout> data={layouts}>
      <List.Selector
        value={activeLayout != null ? [activeLayout] : []}
        onChange={handleSelect}
        allowMultiple={false}
      />
      <List.Column.Header<string, RenderableLayout>
        columns={[
          {
            key: "name",
            name: "Name",
            render: ({ entry, style }) => (
              <Text.Editable
                level="p"
                style={style}
                onChange={(name) => {
                  d(renameLayout({ key: entry.key, name }));
                }}
                value={entry.name}
              />
            ),
          },
        ]}
      />
      <List.Core.Virtual
        itemHeight={30}
        style={{ height: "100%", overflowX: "hidden" }}
      >
        {List.Column.Item}
      </List.Core.Virtual>
    </List>
  );
};
