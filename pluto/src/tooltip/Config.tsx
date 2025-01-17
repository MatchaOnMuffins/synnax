// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type PropsWithChildren,
  type ReactElement,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { TimeSpan, type CrudeTimeSpan } from "@synnaxlabs/x";

export interface ContextValue {
  delay: CrudeTimeSpan;
  startAccelerating: () => void;
}

export interface ConfigProps
  extends PropsWithChildren,
    Partial<Omit<ContextValue, "startAccelerating">> {
  accelerate?: boolean;
  acceleratedDelay?: CrudeTimeSpan;
  accelartionDuration?: CrudeTimeSpan;
}

const ZERO_TOOLTIP_CONFIG: ContextValue = {
  delay: TimeSpan.milliseconds(50),
  startAccelerating: () => {},
};

export const Context = createContext<ContextValue>(ZERO_TOOLTIP_CONFIG);

export const useConfig = (): ContextValue => useContext(Context);

/**
 * Sets the default configuration for all tooltips in its children.
 *
 * @param props - The props for the tooltip config.
 * @param props.delay - The delay before the tooltip appears, in milliseconds.
 * @default 500ms.
 * @param props.accelerate - Whether to enable accelerated visibility of tooltps for
 * a short period of time after the user has hovered over a first tooltip.
 * @default true.
 * @param props.acceleratedDelay - The delay before the tooltip appears when
 * accelerated visibility is enabled.
 * @default 100 ms.
 * @param props.acceleratedDuration - The duration of accelerated visibility.
 * @default 10 seconds.
 */
export const Config = ({
  delay = TimeSpan.milliseconds(500),
  accelerate = true,
  acceleratedDelay = TimeSpan.milliseconds(50),
  accelartionDuration = TimeSpan.seconds(5),
  children,
}: ConfigProps): ReactElement => {
  const [accelerating, setAccelerating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAccelerating = useCallback((): void => {
    if (accelerating || !accelerate) return;
    setAccelerating(true);
    timeoutRef.current = setTimeout(() => {
      setAccelerating(false);
    }, new TimeSpan(accelartionDuration).milliseconds);
  }, [accelerating, accelartionDuration]);
  return (
    <Context.Provider
      value={{
        delay: accelerating ? acceleratedDelay : delay,
        startAccelerating,
      }}
    >
      {children}
    </Context.Provider>
  );
};
