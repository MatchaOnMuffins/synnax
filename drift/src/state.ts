// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  PreloadedState as BasePreloadedState,
  CombinedState,
  PayloadAction,
  createSlice,
  nanoid,
} from "@reduxjs/toolkit";
import type { NoInfer } from "@reduxjs/toolkit/dist/tsHelpers";
import { XY, Dimensions, positionInCenter, Box, ZERO_XY, Deep } from "@synnaxlabs/x";

import {
  WindowState,
  WindowProps,
  WindowStage,
  MAIN_WINDOW,
  INITIAL_WINDOW_STATE,
  INITIAL_PRERENDER_WINDOW_STATE,
} from "@/window";

/** The Slice State */
export interface DriftState {
  label: string;
  prerenderEnabled: boolean;
  windows: Record<string, WindowState>;
  labelKeys: Record<string, string>;
  keyLabels: Record<string, string>;
}

/** State of a store with a drift slice */
export interface StoreState {
  drift: DriftState;
}

export type PreloadedState<S extends StoreState> = BasePreloadedState<
  CombinedState<NoInfer<S>>
>;

// Disabling consistent type definitions here because 'empty' interfaces can't be named,
// which raises an error on build.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type MaybeKeyPayload = { key?: string };
export interface KeyPayload {
  key: string;
}

export interface LabelPayload {
  label: string;
}

export interface BooleanPayload {
  value: boolean;
}
export interface MaybeBooleanPayload {
  value?: boolean;
}

export interface SizePayload {
  size: Dimensions;
}

export type CreateWindowPayload = WindowProps & {
  label?: string;
  prerenderLabel?: string;
};
export type CloseWindowPayload = MaybeKeyPayload;
export type SetWindowClosedPayload = MaybeKeyPayload;
export type FocusWindowPayload = MaybeKeyPayload;
export type SetWindowMinimizedPayload = MaybeKeyPayload & MaybeBooleanPayload;
export type SetWindowMaximizedPayload = MaybeKeyPayload & MaybeBooleanPayload;
export type SetWindowVisiblePayload = MaybeKeyPayload & MaybeBooleanPayload;
export type SetWindowFullScreenPayload = MaybeKeyPayload & MaybeBooleanPayload;
export type CenterWindowPayload = MaybeKeyPayload;
export type SetWindowPositionPayload = MaybeKeyPayload & { position: XY };
export type SetWindowSizePayload = MaybeKeyPayload & SizePayload;
export type SetWindowMinSizePayload = MaybeKeyPayload & SizePayload;
export type SetWindowMaxSizePayload = MaybeKeyPayload & SizePayload;
export type SetWindowResizablePayload = MaybeKeyPayload & MaybeBooleanPayload;
export type SetWindowSkipTaskbarPayload = MaybeKeyPayload & MaybeBooleanPayload;
export type SetWindowAlwaysOnTopPayload = MaybeKeyPayload & MaybeBooleanPayload;
export type SetWindowTitlePayload = MaybeKeyPayload & { title: string };
export type SetWindowLabelPayload = LabelPayload;
export type SetWindowStatePayload = MaybeKeyPayload & { stage: WindowStage };
export type SetWindowPropsPayload = LabelPayload & Partial<WindowProps>;
export type SetWindowErrorPaylod = KeyPayload & { message: string };
export type SetWindowDecorationsPayload = KeyPayload & BooleanPayload;
export type SetPrererenderEnabledPayload = BooleanPayload;

/** Type representing all possible actions that are drift related. */
export type DriftPayload =
  | CreateWindowPayload
  | CloseWindowPayload
  | SetWindowStatePayload
  | MaybeKeyPayload
  | SetWindowPropsPayload
  | SetWindowErrorPaylod
  | SetWindowLabelPayload
  | SetWindowClosedPayload
  | SetWindowMinimizedPayload
  | SetWindowMaximizedPayload
  | SetWindowVisiblePayload
  | SetWindowFullScreenPayload
  | CenterWindowPayload
  | SetWindowPositionPayload
  | SetWindowSizePayload
  | SetWindowMinSizePayload
  | SetWindowMaxSizePayload
  | SetWindowResizablePayload
  | SetWindowSkipTaskbarPayload
  | SetWindowAlwaysOnTopPayload
  | SetWindowTitlePayload
  | FocusWindowPayload
  | SetWindowDecorationsPayload
  | SetPrererenderEnabledPayload;

/** Type representing all possible actions that are drift related. */
export type DriftAction = PayloadAction<DriftPayload>;

export const initialState: DriftState = {
  label: MAIN_WINDOW,
  prerenderEnabled: true,
  windows: {
    main: {
      ...INITIAL_WINDOW_STATE,
      key: MAIN_WINDOW,
      reserved: true,
    },
  },
  labelKeys: {
    main: MAIN_WINDOW,
  },
  keyLabels: {
    main: MAIN_WINDOW,
  },
};

export const assignLabel = <T extends MaybeKeyPayload | LabelPayload>(
  a: PayloadAction<T>,
  s: DriftState
): PayloadAction<T & LabelPayload> => {
  if (a.type === createWindow.type) {
    if (s.label !== MAIN_WINDOW) return a as PayloadAction<T & LabelPayload>;
    (a.payload as CreateWindowPayload).label = nanoid();
    (a.payload as CreateWindowPayload).prerenderLabel = nanoid();
    return a as PayloadAction<T & LabelPayload>;
  }
  if ("label" in a.payload) return a as PayloadAction<T & LabelPayload>;
  let label = s.label;
  // eslint-disable-next-line
  const pld = a.payload as MaybeKeyPayload;
  if (pld.key != null)
    if (pld.key in s.windows) label = pld.key;
    else label = s.keyLabels[pld.key];
  a.payload = { ...a.payload, label };
  return a as PayloadAction<T & LabelPayload>;
};

const assertLabel =
  <T extends DriftPayload>(
    f: (state: DriftState, action: PayloadAction<T & LabelPayload>) => void
  ): ((s: DriftState, a: PayloadAction<T>) => void) =>
  (s, a) => {
    if (!("label" in a.payload)) throw new Error("Missing label");
    f(s, a as PayloadAction<T & LabelPayload>);
  };

const assignBool = <T extends MaybeKeyPayload & MaybeBooleanPayload>(
  prop: keyof WindowProps,
  def_: boolean = false
): ((s: DriftState, a: PayloadAction<T>) => void) =>
  assertLabel<T>((s, a) => {
    let v = def_;
    const win = s.windows[a.payload.label];
    if (a.payload.value != null) v = a.payload.value;
    else {
      const existing = win[prop] as boolean | undefined;
      if (existing != null) v = !existing;
    }
    s.windows[a.payload.label] = { ...win, [prop]: v };
  });

const incrementCounter =
  (prop: keyof WindowState, decrement: boolean = false) =>
  (s: DriftState, a: PayloadAction<LabelPayload>) => {
    const win = s.windows[a.payload.label];
    s.windows[a.payload.label] = {
      ...win,
      [prop]: (win[prop] as number) + (decrement ? -1 : 1),
    };
  };

export const DRIFT_SLICE_NAME = "drift";

const slice = createSlice({
  name: DRIFT_SLICE_NAME,
  initialState,
  reducers: {
    setPrererenderEnabled: (
      s: DriftState,
      a: PayloadAction<SetPrererenderEnabledPayload>
    ) => {
      s.prerenderEnabled = a.payload.value;
      if (s.prerenderEnabled) return;
      s.windows = Object.fromEntries(
        Object.entries(s.windows).filter(([, v]) => v.reserved)
      );
    },
    setWindowLabel: (s: DriftState, a: PayloadAction<SetWindowLabelPayload>) => {
      s.label = a.payload.label;
      if (s.label !== MAIN_WINDOW && !s.prerenderEnabled) return;
      const prerenderLabel = nanoid();
      s.windows[prerenderLabel] = INITIAL_PRERENDER_WINDOW_STATE;
    },
    createWindow: (s: DriftState, { payload }: PayloadAction<CreateWindowPayload>) => {
      const { key, label, prerenderLabel } = payload;
      if (label == null || prerenderLabel == null)
        throw new Error("[drift] - bug - missing label and prerender label");

      // If the window already exists, just focus it
      if (key in s.keyLabels) {
        const label = s.keyLabels[payload.key];
        s.windows[label].visible = true;
        s.windows[label].focusCount += 1;
        return;
      }

      const mainWin = s.windows.main;

      // If the user hasn't explicitly specified a position, we'll center it in the main
      // window for the nicest experience.
      payload = maybePositionInCenter(payload, mainWin);

      const [availableLabel, available] = Object.entries(s.windows).find(
        ([, w]) => !w.reserved
      ) ?? [null, null];

      // If we have an available prerendered window,
      // use it.
      if (availableLabel != null) {
        s.windows[availableLabel] = {
          ...available,
          visible: true,
          reserved: true,
          ...payload,
        };
        s.labelKeys[availableLabel] = payload.key;
        s.keyLabels[payload.key] = availableLabel;
      } else {
        // If we don't, just create the window directly.
        s.windows[label] = {
          ...INITIAL_WINDOW_STATE,
          ...payload,
          reserved: true,
        };
        s.labelKeys[label] = key;
        s.keyLabels[key] = label;
      }

      if (s.prerenderEnabled)
        s.windows[prerenderLabel] = Deep.copy(INITIAL_PRERENDER_WINDOW_STATE);
    },
    setWindowStage: assertLabel<SetWindowStatePayload>((s, a) => {
      s.windows[a.payload.label].stage = a.payload.stage;
    }),
    closeWindow: assertLabel<CloseWindowPayload>((s, { payload: { label } }) => {
      const win = s.windows[label];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete s.windows[label];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete s.labelKeys[label];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete s.keyLabels[win.key];
    }),
    registerProcess: assertLabel<MaybeKeyPayload>(incrementCounter("processCount")),
    completeProcess: assertLabel<MaybeKeyPayload>(
      incrementCounter("processCount", true)
    ),
    setWindowError: (s: DriftState, a: PayloadAction<SetWindowErrorPaylod>) => {
      s.windows[a.payload.key].error = a.payload.message;
    },
    focusWindow: assertLabel<FocusWindowPayload>((s, a) => {
      const win = s.windows[a.payload.label];
      if (win?.visible !== true) s.windows[a.payload.label].visible = true;
      incrementCounter("focusCount")(s, a);
    }),
    setWindowMinimized: assignBool("minimized"),
    setWindowMaximized: assignBool("maximized"),
    setWindowVisible: assignBool("visible", true),
    setWindowFullscreen: assignBool("fullscreen", true),
    centerWindow: assertLabel<CenterWindowPayload>(incrementCounter("centerCount")),
    setWindowPosition: assertLabel<SetWindowPositionPayload>((s, a) => {
      s.windows[a.payload.label].position = a.payload.position;
    }),
    setWindowSize: assertLabel<SetWindowSizePayload>((s, a) => {
      s.windows[a.payload.label].size = a.payload.size;
    }),
    setWindowMinSize: assertLabel<SetWindowMinSizePayload>((s, a) => {
      s.windows[a.payload.label].minSize = a.payload.size;
    }),
    setWindowMaxSize: assertLabel<SetWindowMaxSizePayload>((s, a) => {
      s.windows[a.payload.label].maxSize = a.payload.size;
    }),
    setWindowResizable: assignBool("resizable"),
    setWindowSkipTaskbar: assignBool("skipTaskbar"),
    setWindowAlwaysOnTop: assignBool("alwaysOnTop"),
    setWindowTitle: assertLabel<SetWindowTitlePayload>((s, a) => {
      s.windows[a.payload.label].title = a.payload.title;
    }),
    setWindowDecorations: assignBool("decorations"),
    setWindowProps: (s: DriftState, a: PayloadAction<SetWindowPropsPayload>) => {
      const prev = s.windows[a.payload.label];
      const deepPartialEqual = Deep.partialEqual(prev, a.payload);
      if (!deepPartialEqual) s.windows[a.payload.label] = { ...prev, ...a.payload };
    },
  },
});

export const {
  reducer,
  actions: {
    setPrererenderEnabled,
    setWindowProps,
    setWindowLabel,
    createWindow,
    setWindowStage,
    closeWindow,
    registerProcess,
    completeProcess,
    setWindowError,
    focusWindow,
    setWindowMinimized,
    setWindowMaximized,
    setWindowVisible,
    setWindowFullscreen,
    centerWindow,
    setWindowPosition,
    setWindowSize,
    setWindowMinSize,
    setWindowMaxSize,
    setWindowResizable,
    setWindowSkipTaskbar,
    setWindowAlwaysOnTop,
    setWindowTitle,
    setWindowDecorations,
  },
} = slice;

/**
 * @returns true if the given action type is a drift action.
 * @param type - The action type to check.
 */
export const isDriftAction = (type: string): boolean =>
  type.startsWith(DRIFT_SLICE_NAME);

/** A list of actions that shouldn't be emitted to other windows. */
const EXCLUDED_ACTIONS: readonly string[] = [setWindowLabel.type];

/**
 * @returns true if the action with the given type should be emitted to other
 * windows.
 * @param emitted - Boolean indicating if the action was emitted by another window.
 * @param type - The action type to check.
 *
 */
export const shouldEmit = (emitted: boolean, type: string): boolean =>
  !emitted && !EXCLUDED_ACTIONS.includes(type);

const maybePositionInCenter = (
  pld: CreateWindowPayload,
  mainWin: WindowState
): CreateWindowPayload => {
  if (mainWin.position != null && mainWin.size != null && pld.position == null)
    pld.position = positionInCenter(
      new Box(ZERO_XY, pld.size ?? ZERO_XY),
      new Box(mainWin.position, mainWin.size)
    ).topLeft;
  return pld;
};
