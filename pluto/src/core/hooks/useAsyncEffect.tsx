// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useEffect, useRef } from "react";

/* An async version of React.Destructor */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncDestructor = Promise<(() => void) | void>;

/** An async version of React.EffectCallback */
export type AsyncEffectCallback = () => AsyncDestructor;

/**
 * A version of useEffect that supports async functions and destructors. NOTE: The behavior
 * of this hook hasn't been carefully though out, so it may produce unexpected results.
 * Caveat emptor.
 *
 * @param effect - The async effect callback.
 * @param deps - The dependencies of the effect.
 */
export const useAsyncEffect = (effect: AsyncEffectCallback, deps?: unknown[]): void => {
  const runningRef = useRef(false);
  useEffect(() => {
    const p = effect();
    return () => {
      p.then((d) => d?.()).catch((e) => console.error(e));
    };
  }, deps);
};
