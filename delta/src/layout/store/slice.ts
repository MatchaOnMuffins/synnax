// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Mosaic, Theming } from "@synnaxlabs/pluto";
import type { MosaicNode, Theme } from "@synnaxlabs/pluto";
import { DeepKey, Location } from "@synnaxlabs/x";

import { LayoutState } from "../types";

/** The state of the layout slice */
export interface LayoutSliceState {
  /** The current theme. */
  activeTheme: string;
  /**
   * A record of theme keys to themes. The active theme is guaranteed to be present
   * in this record. */
  themes: Record<string, Theme>;
  /**
   * A record of layout keys to layouts. These represent the properties of all layouts
   * currently rendered in the mosaic or in external windows.
   */
  layouts: Record<string, LayoutState>;
  mosaic: MosaicState;
  nav: NavState;
  alreadyCheckedGetStarted: boolean;
}

export interface MosaicState {
  activeTab: string | null;
  root: MosaicNode;
}

export interface NavState {
  drawers: NavDrawerState;
}

export type NavdrawerLocation = "right" | "left" | "bottom";

export interface NavDrawerState {
  left: NavdrawerEntryState;
  right: NavdrawerEntryState;
  bottom: NavdrawerEntryState;
}

export interface NavdrawerEntryState {
  activeItem: string | null;
  menuItems: string[];
  size?: number;
}

/**
 * The name of the layout slice in a larger store.
 * NOTE: This must be the name of the slice in the store, or else all selectors will fail.
 */
export const LAYOUT_SLICE_NAME = "layout";

/**
 * Represents a partial view of a larger store that contains the layout slice. This is
 * typically used for hooks that accept the entire store state as a parameter but only
 * need access to the layout slice.
 */
export interface LayoutStoreState {
  [LAYOUT_SLICE_NAME]: LayoutSliceState;
}

export const MAIN_LAYOUT: LayoutState = {
  name: "Main",
  key: "main",
  type: "main",
  location: "window",
  window: {
    navTop: false,
  },
};

const INITIAL_STATE: LayoutSliceState = {
  activeTheme: "synnaxDark",
  themes: Theming.themes,
  alreadyCheckedGetStarted: false,
  layouts: {
    main: MAIN_LAYOUT,
  },
  mosaic: {
    activeTab: null,
    root: {
      key: 1,
      tabs: [],
    },
  },
  nav: {
    drawers: {
      left: {
        activeItem: null,
        menuItems: ["clusters", "resources"],
      },
      right: {
        activeItem: null,
        menuItems: ["workspace"],
      },
      bottom: {
        activeItem: null,
        menuItems: ["visualization"],
      },
    },
  },
};

export const LAYOUT_PERSIST_EXCLUDE = ["alreadyCheckedGetStarted"].map(
  (key) => `${LAYOUT_SLICE_NAME}.${key}`
) as Array<DeepKey<LayoutStoreState>>;

/** Signature for the placeLayut action. */
export type PlaceLayoutPayload = LayoutState;
/** Signature for the removeLayout action. */
export type RemoveLayoutPayload = string;
/** Signature for the setTheme action. */
export type SetActiveThemePayload = string | undefined;

interface MoveLayoutMosaicTabPayload {
  tabKey: string;
  key: number;
  loc: Location;
}
interface ResizeLayoutMosaicTabPayload {
  key: number;
  size: number;
}
interface SelectLayoutMosaicTabPayload {
  tabKey: string;
}
interface RenameLayoutPayload {
  key: string;
  name: string;
}

interface ResizeNavdrawerPayload {
  location: NavdrawerLocation;
  size: number;
}

interface SetNavdrawerVisiblePayload {
  key?: string;
  location?: NavdrawerLocation;
  value?: boolean;
}

export const { actions, reducer: layoutReducer } = createSlice({
  name: LAYOUT_SLICE_NAME,
  initialState: INITIAL_STATE,
  reducers: {
    placeLayout: (state, { payload: layout }: PayloadAction<PlaceLayoutPayload>) => {
      const { key, location, name, tab } = layout;

      const prev = state.layouts[key];

      // If we're moving from a mosaic, remove the tab.
      if (prev != null && prev.location === "mosaic" && location !== "mosaic")
        [state.mosaic.root] = Mosaic.removeTab(state.mosaic.root, key);

      const mosaicTab = {
        ...tab,
        name,
        tabKey: key,
      };
      delete mosaicTab.location;
      delete mosaicTab.mosaicKey;

      // If we're moving to a mosaic, insert a tab.
      if (prev?.location !== "mosaic" && location === "mosaic") {
        state.mosaic.root = Mosaic.insertTab(
          state.mosaic.root,
          mosaicTab,
          tab?.location,
          tab?.mosaicKey
        );
        state.mosaic.activeTab = key;
      }

      // If the tab already exists and its in the mosaic, make it the active tab
      // and select it. Also rename it.
      if (prev?.location === "mosaic" && location === "mosaic") {
        state.mosaic.activeTab = key;
        state.mosaic.root = Mosaic.renameTab(
          Mosaic.selectTab(state.mosaic.root, key),
          key,
          name
        );
      }

      state.layouts[key] = layout;
    },
    removeLayout: (
      state,
      { payload: contentKey }: PayloadAction<RemoveLayoutPayload>
    ) => {
      const layout = state.layouts[contentKey];
      if (layout == null) return;
      const { location } = layout;

      if (location === "mosaic") {
        [state.mosaic.root, state.mosaic.activeTab] = Mosaic.removeTab(
          state.mosaic.root,
          contentKey
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state.layouts[contentKey];
    },
    moveLayoutMosaicTab: (
      state,
      { payload: { tabKey, key, loc } }: PayloadAction<MoveLayoutMosaicTabPayload>
    ) => {
      [state.mosaic.root] = Mosaic.moveTab(state.mosaic.root, tabKey, loc, key);
    },
    selectLayoutMosaicTab: (
      state,
      { payload: { tabKey } }: PayloadAction<SelectLayoutMosaicTabPayload>
    ) => {
      state.mosaic.root = Mosaic.selectTab(state.mosaic.root, tabKey);
      state.mosaic.activeTab = tabKey;
    },
    resizeLayoutMosaicTab: (
      state,
      { payload: { key, size } }: PayloadAction<ResizeLayoutMosaicTabPayload>
    ) => {
      state.mosaic.root = Mosaic.resizeNode(state.mosaic.root, key, size);
    },
    renameLayout: (
      state,
      { payload: { key: tabKey, name } }: PayloadAction<RenameLayoutPayload>
    ) => {
      if (name.length === 0) return;
      const layout = state.layouts[tabKey];
      if (layout != null) layout.name = name;
      state.mosaic.root = Mosaic.renameTab(state.mosaic.root, tabKey, name);
    },
    setActiveTheme: (state, { payload: key }: PayloadAction<SetActiveThemePayload>) => {
      if (key != null) state.activeTheme = key;
      else {
        const keys = Object.keys(state.themes).sort();
        const index = keys.indexOf(state.activeTheme);
        const next = keys[(index + 1) % keys.length];
        state.activeTheme = next;
      }
    },
    toggleActiveTheme: (state) => {
      const keys = Object.keys(state.themes);
      const index = keys.indexOf(state.activeTheme);
      const next = keys[(index + 1) % keys.length];
      state.activeTheme = next;
    },
    resizeNavdrawer: (
      state,
      { payload: { location, size } }: PayloadAction<ResizeNavdrawerPayload>
    ) => {
      state.nav.drawers[location].size = size;
    },
    setNavdrawerVisible: (
      state,
      { payload: { key, location, value } }: PayloadAction<SetNavdrawerVisiblePayload>
    ) => {
      if (key != null) {
        Object.values(state.nav.drawers).forEach((drawer) => {
          if (drawer.menuItems.includes(key)) {
            drawer.activeItem = value ?? drawer.activeItem !== key ? key : null;
          }
        });
      } else if (location != null) {
        const drawer = state.nav.drawers[location];
        if (value === true && drawer.activeItem == null)
          drawer.activeItem = drawer.menuItems[0];
        else if (value === false) drawer.activeItem = null;
        else if (drawer.activeItem == null) drawer.activeItem = drawer.menuItems[0];
        else drawer.activeItem = null;
      } else {
        throw new Error("setNavdrawerVisible requires either a key or location");
      }
    },
    maybeCreateGetStartedTab: (state) => {
      const checkedGetStarted = state.alreadyCheckedGetStarted;
      state.alreadyCheckedGetStarted = true;
      if (
        Object.values(state.layouts).filter(({ location }) => location === "mosaic")
          .length !== 0 ||
        checkedGetStarted
      )
        return;
      state.mosaic.root = Mosaic.insertTab(state.mosaic.root, {
        tabKey: "getStarted",
        name: "Get Started",
        editable: false,
      });
      state.layouts.getStarted = {
        name: "Get Started",
        key: "getStarted",
        location: "mosaic",
        type: "getStarted",
      };
    },
  },
});

export const {
  placeLayout,
  removeLayout,
  toggleActiveTheme,
  setActiveTheme,
  moveLayoutMosaicTab,
  selectLayoutMosaicTab,
  resizeLayoutMosaicTab,
  renameLayout,
  resizeNavdrawer,
  setNavdrawerVisible,
  maybeCreateGetStartedTab,
} = actions;

export type LayoutAction = ReturnType<(typeof actions)[keyof typeof actions]>;
export type LayoutPayload = LayoutAction["payload"];
