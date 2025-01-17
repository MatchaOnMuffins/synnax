// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  Action as CoreAction,
  AnyAction,
  Dispatch,
  Middleware,
} from "@reduxjs/toolkit";
import type { CurriedGetDefaultMiddleware } from "@reduxjs/toolkit/dist/getDefaultMiddleware";

import { log } from "@/debug";
import { Runtime } from "@/runtime";
import {
  StoreState,
  isDriftAction,
  shouldEmit,
  Action,
  assignLabel,
  SliceState,
  setWindowProps,
  setWindowError,
} from "@/state";
import { desugar } from "@/sugar";
import { sync } from "@/sync";
import { validateAction } from "@/validate";

export type Middlewares<S> = ReadonlyArray<Middleware<{}, S>>;

/**
 * Redux middleware that conditionally does two things:
 *
 *      1. Emit actions to other windows.
 *      2. Execute window lifecycle actions.
 *
 * @param runtime - The runtime of the current application window.
 * @returns a Redux middleware.
 */
export const middleware =
  <S extends StoreState, A extends CoreAction = AnyAction>(
    runtime: Runtime<S, A>,
    debug: boolean = false
  ): Middleware<Record<string, never>, S, Dispatch<A | Action>> =>
  ({ getState, dispatch }) =>
  (next) =>
  (action_) => {
    // eslint-disable-next-line prefer-const
    let { action, emitted, emitter } = desugar(action_);

    const label = runtime.label();

    validateAction({ action: action_, emitted, emitter });

    log(debug, "[drift] - middleware", {
      action,
      emitted,
      emitter,
      host: label,
    });

    // The action is recirculating from our own relay.
    if (emitter === runtime.label()) return;

    const isDrift = isDriftAction(action.type);

    // If the runtime is updating its own props, no need to sync.
    const shouldSync = isDrift && action.type !== setWindowProps.type;

    let prevS: SliceState | null = null;
    if (isDrift) {
      prevS = getState().drift;
      action = assignLabel(action, prevS);
    }

    const res = next(action);

    const nextS = shouldSync ? getState().drift : null;

    const shouldEmit_ = shouldEmit(emitted, action.type);

    // Wrap everything in an async closure eto ensure that we synchronize before
    // before emitting to other windows.
    void (async (): Promise<void> => {
      try {
        if (prevS !== null && nextS !== null) await sync(prevS, nextS, runtime, debug);
        if (shouldEmit_) await runtime.emit({ action });
      } catch (err) {
        log(debug, "[drift] - middleware", {
          error: err,
          action,
          emitted,
          emitter,
          host: label,
        });
        dispatch(setWindowError({ key: label, message: (err as Error).message }));
      }
    })();

    return res;
  };

/**
 * Configures the Redux middleware for the curent window's store.
 *
 * @param mw - Middleware provided by the drift user (if any).
 * @param runtime - The runtime of the current window.
 * @returns a middleware function to be passed to `configureStore`.
 */
export const configureMiddleware = <
  S extends StoreState,
  A extends CoreAction = AnyAction,
  M extends Middlewares<S> = Middlewares<S>
>(
  mw: M | ((def: CurriedGetDefaultMiddleware<S>) => M) | undefined,
  runtime: Runtime<S, A>,
  debug: boolean = false
): ((def: CurriedGetDefaultMiddleware<S>) => M) => {
  return (def) => {
    const base = mw != null ? (typeof mw === "function" ? mw(def) : mw) : def();
    return [...base, middleware<S, A>(runtime, debug)] as unknown as M;
  };
};
