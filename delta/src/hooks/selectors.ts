// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useCallback } from "react";

import type { Key, KeyedRecord } from "@synnaxlabs/x";
import memoize from "proxy-memoize";
import { useSelector } from "react-redux";

/**
 * A memoized version of the redux useSelector hook. Only re-renders when the portions
 * of state accessed by the selector OR its dependencies change.
 *
 * @param selector - The selector function. NOTE: Avoid using object destructuring in the
 * selector, as it may cauase issues with memoization.
 * @param deps - The dependencies of the selector. If not provided, the selector will only
 * re-run when the state changes.
 * @returns The result of the selector.
 */
export const useMemoSelect = <S extends object, R>(
  selector: (state: S) => R,
  deps: unknown[]
): R => useSelector(useCallback(memoize(selector), deps));

export const selectByKeys = <K extends Key, S extends KeyedRecord<K, S>>(
  state: S[] | Record<K, S>,
  keys?: K[]
): S[] => {
  if (!Array.isArray(state)) state = Object.values(state);
  if (keys == null) return state;
  return state.filter((s) => keys.includes(s.key));
};

export const selectByKey = <K extends Key, S extends KeyedRecord<K, S>>(
  state: Record<string, S>,
  key?: string | null,
  defaultKey?: string | null
): S | null | undefined => {
  if (key == null) key = defaultKey;
  if (key == null) return null;
  return state[key];
};
