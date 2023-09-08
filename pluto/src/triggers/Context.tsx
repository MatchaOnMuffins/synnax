// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  createContext,
  useContext as reactUseContext,
  useEffect,
  useCallback,
  useRef,
  type PropsWithChildren,
  type ReactElement,
} from "react";

import { XY, TimeStamp, TimeSpan, type Destructor } from "@synnaxlabs/x";

import { useStateRef } from "@/hooks/useStateRef";
import {
  type MouseKey,
  MOUSE_KEYS,
  eventKey,
  type Trigger,
  type Callback,
  match,
} from "@/triggers/triggers";

type Listen = (callback: Callback) => Destructor;

export interface ContextValue {
  listen: Listen;
}

const ZERO_CONTEXT_VALUE: ContextValue = {
  listen: () => () => {},
};

const Context = createContext<ContextValue>(ZERO_CONTEXT_VALUE);

export const useContext = (): ContextValue => reactUseContext(Context);

interface RefState {
  next: Trigger;
  prev: Trigger;
  last: TimeStamp;
}

const ZERO_REF_STATE: RefState = {
  next: [],
  prev: [],
  last: new TimeStamp(0),
};

const EXCLUDE_TRIGGERS = ["CapsLock"];

export interface ProviderProps extends PropsWithChildren {
  preventDefaultOn?: Trigger[];
}

export const Provider = ({
  children,
  preventDefaultOn,
}: ProviderProps): ReactElement => {
  // We track mouse movement to allow for cursor position on keybord events;
  const cursor = useRef<XY>(XY.ZERO);
  const handleMouseMove = useCallback((e: MouseEvent): void => {
    cursor.current = new XY(e);
  }, []);

  // All registered triggers and callbacks
  const registry = useRef<Map<Callback, null>>(new Map());

  // The current trigger.
  const [, setCurr] = useStateRef<RefState>({ ...ZERO_REF_STATE });

  const updateListeners = useCallback((state: RefState, target: HTMLElement): void => {
    const next = state.next.length > 0 ? [state.next] : [];
    const prev = state.prev.length > 0 ? [state.prev] : [];
    const event = { target, next, prev, cursor: cursor.current };
    registry.current.forEach((_, f) => f(event));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent | MouseEvent): void => {
    const key = eventKey(e);
    // We prevent the default behavior of arrow keys to prevent scrolling and movement
    // of the cursor. We might want to move this elsewhere in the future.
    if (["ArrowUp", "ArrowDown"].includes(key)) e.preventDefault();
    if (EXCLUDE_TRIGGERS.includes(key as string)) return;
    setCurr((prev) => {
      const next: Trigger = [...prev.next, key];
      if (prev.next.includes(key)) return prev;
      // This is considered a double press.
      if (
        prev.prev.includes(key) &&
        TimeStamp.since(prev.last).valueOf() < TimeSpan.milliseconds(300).valueOf()
      )
        next.push(key);
      const nextState: RefState = {
        next,
        prev: prev.next,
        last: new TimeStamp(),
      };
      if (shouldPreventDefault(next, preventDefaultOn)) e.preventDefault();
      updateListeners(nextState, e.target as HTMLElement);
      return nextState;
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent | MouseEvent): void => {
    const key = eventKey(e);
    if (key === "P") e.preventDefault();
    if (["ArrowUp", "ArrowDown"].includes(key)) e.preventDefault();
    if (EXCLUDE_TRIGGERS.includes(key as string)) return;
    setCurr((prevS) => {
      const next = prevS.next.filter(
        (k) => k !== key && !MOUSE_KEYS.includes(k as MouseKey),
      );
      const prev = prevS.next;
      const nextS: RefState = {
        ...prevS,
        next,
        prev,
      };
      if (shouldPreventDefault(next, preventDefaultOn)) e.preventDefault();
      updateListeners(nextS, e.target as HTMLElement);
      return nextS;
    });
  }, []);

  /**
   * If the mouse leaves the window, we want to clear all triggers. This prevents
   * issues with the user holding down a key and then moving the mouse out of the
   * window.
   */
  const handlePageVisbility = useCallback((event: Event): void => {
    setCurr((prevS) => {
      const prev = prevS.next;
      const nextS: RefState = {
        ...prevS,
        next: [],
        prev,
      };
      updateListeners(nextS, event.target as HTMLElement);
      return nextS;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleKeyDown);
    window.addEventListener("mouseup", handleKeyUp);
    window.addEventListener("dragend", handleKeyUp);
    window.addEventListener("drop", handleKeyUp);
    window.addEventListener("blur", handlePageVisbility);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleKeyDown);
      window.removeEventListener("mouseup", handleKeyUp);
      window.removeEventListener("dragend", handleKeyUp);
      window.removeEventListener("drop", handleKeyUp);
      window.removeEventListener("blur", handlePageVisbility);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove]);

  const listen = useCallback<Listen>((callback) => {
    registry.current.set(callback, null);
    return () => registry.current.delete(callback);
  }, []);

  return <Context.Provider value={{ listen }}>{children}</Context.Provider>;
};

const shouldPreventDefault = (t: Trigger, preventDefaultOn?: Trigger[]): boolean =>
  preventDefaultOn != null && match([t], preventDefaultOn);
