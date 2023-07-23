// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  WorkspaceSliceState,
  WorkspaceStoreState,
  WORKSPACE_SLICE_NAME,
} from "./slice";
import type { Range } from "./types";

import { selectByKey, useMemoSelect } from "@/hooks";

/**
 * Selects the workspace state.
 * @param state - The state of the workspace store.
 * @returns The workspace state.
 */
const selectWorkSpaceState = (state: WorkspaceStoreState): WorkspaceSliceState =>
  state[WORKSPACE_SLICE_NAME];

/**
 * Selects ranges with the given keys. If no keys are provided, all ranges are selected.
 *
 * @param state  - The state of the workspace store.
 * @param keys  - The keys of the ranges to select. If not provided, all ranges are
 * selected.
 * @returns The ranges with the given keys.
 */
export const selectRanges = (
  state: WorkspaceStoreState,
  keys?: string[] | readonly string[]
): Range[] => {
  const all = Object.values(selectWorkSpaceState(state).ranges);
  if (keys == null) return all;
  return all.filter((range) => keys.includes(range.key));
};
/**
 * Selects the key of the active range.
 *
 * @param state - The state of the workspace store.
 * @returns The key of the active range, or null if no range is active.
 */
const selectActiveRangeKey = (state: WorkspaceStoreState): string | null =>
  selectWorkSpaceState(state).activeRange;

/**
 * Selects a range from the workspace store.
 *
 * @param state - The state of the workspace store.
 * @param key - The key of the range to select. If not provided, the active range key
 * will be used.
 *
 * @returns The range with the given key. If no key is provided, the active range is
 * key is used. If no active range is set, returns null. If the range does not exist,
 * returns undefined.
 */
export const selectRange = (
  state: WorkspaceStoreState,
  key?: string | null
): Range | null | undefined =>
  selectByKey(selectWorkSpaceState(state).ranges, key, selectActiveRangeKey(state));

/**
 * Selects a range from the workspace store.
 *
 * @returns The range with the given key. If no key is provided, the active range is
 * key is used. If no active range is set, returns null. If the range does not exist,
 * returns undefined.
 */
export const useSelectRange = (key?: string): Range | null | undefined =>
  useMemoSelect((state: WorkspaceStoreState) => selectRange(state, key), [key]);

/**
 * Selects ranges from the workspace store. If no keys are provided, all ranges are
 * selected.
 *
 * @param keys - The keys of the ranges to select. If not provided, all ranges are
 * @returns The ranges with the given keys.
 */
export const useSelectRanges = (keys?: string[]): Range[] =>
  useMemoSelect((state: WorkspaceStoreState) => selectRanges(state, keys), [keys]);
