// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ComponentPropsWithoutRef, ReactElement, useRef } from "react";

import { Key, KeyedRenderableRecord } from "@synnaxlabs/x";
import { useVirtualizer } from "@tanstack/react-virtual";

import { CSS } from "@/core/css";
import { useListContext } from "@/core/std/List/ListContext";
import { ListItemProps } from "@/core/std/List/types";
import { RenderProp } from "@/util/renderProp";

import "@/core/std/List/ListCore.css";

export interface ListVirtualCoreProps<
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>
> extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  itemHeight: number;
  children: RenderProp<ListItemProps<K, E>>;
  overscan?: number;
}

const ListVirtualCore = <
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>
>({
  itemHeight,
  children,
  overscan = 5,
  ...props
}: ListVirtualCoreProps<K, E>): ReactElement => {
  if (itemHeight <= 0) throw new Error("itemHeight must be greater than 0");
  const {
    data,
    emptyContent,
    columnar: { columns },
    hover,
    select,
  } = useListContext<K, E>();
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={CSS.BE("list", "container")} {...props}>
      {data.length === 0 ? (
        emptyContent
      ) : (
        <div style={{ height: virtualizer.getTotalSize() }}>
          {items.map(({ index, start }) => {
            const entry = data[index];
            return children({
              key: entry.key,
              index,
              onSelect: select.onSelect,
              entry,
              columns,
              selected: select.value.includes(entry.key),
              hovered: index === hover.value,
              style: {
                transform: `translateY(${start}px)`,
                position: "absolute",
              },
            });
          })}
        </div>
      )}
    </div>
  );
};

export const ListCore = <
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>
>(
  props: Omit<ComponentPropsWithoutRef<"div">, "children"> & {
    children: RenderProp<ListItemProps<K, E>>;
  }
): ReactElement => {
  const { data, emptyContent, columnar, hover, select } = useListContext<K, E>();

  return (
    <div className={CSS.BE("list", "container")} {...props}>
      {data.length === 0 ? (
        emptyContent
      ) : (
        <div>
          {data.map((entry, index) =>
            props.children({
              key: entry.key,
              index,
              onSelect: select.onSelect,
              entry,
              columns: columnar.columns,
              selected: select.value.includes(entry.key),
              hovered: index === hover.value,
              style: {},
            })
          )}
        </div>
      )}
    </div>
  );
};

export type ListCoreBaseType = typeof ListCore;

export interface ListCoreType extends ListCoreBaseType {
  /**
   * A virtualized list core.
   *
   * @param props - Props for the virtualized list core. All props not defined below
   * are passed to the underlying div element wrapping the list.
   * @param props.itemHeight - The height of each item in the list.
   * @param props.overscan - The number of extra items to render during virtualization.
   * This improves scroll performance, but also adds extra DOM elements, so make sure
   * to set this to a reasonable value.
   * @param props.children - A render props that renders each item in the list. It should
   * implement the {@link ListItemProps} interface. The virtualizer will pass all props
   * satisfying this interface to the render props.
   */
  Virtual: typeof ListVirtualCore;
}

ListCore.Virtual = ListVirtualCore;
