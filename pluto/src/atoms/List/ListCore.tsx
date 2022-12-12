import { useVirtualizer } from "@tanstack/react-virtual";
import { ComponentType, HTMLAttributes, useRef } from "react";
import { useListContext } from "./ListContext";
import { ListEntry, ListItemProps } from "./types";
import "./ListCore.css";

export interface ListVirtualCoreProps<E extends ListEntry>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect"> {
  itemHeight: number;
  children: ComponentType<ListItemProps<E>>;
}

const ListVirtualCore = <E extends ListEntry>({
  itemHeight,
  children: Children,
  ...props
}: ListVirtualCoreProps<E>) => {
  const {
    data,
    columnar: { columns },
    selected,
    onSelect,
  } = useListContext<E>();
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: Math.floor(data.length / 10),
  });
  return (
    <div ref={parentRef} className="pluto-list__container" {...props}>
      <div
        className="pluto-list__inner"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map(({ index, start }) => {
          const entry = data[index];
          return (
            <Children
              key={`${entry.key}`}
              index={index}
              onSelect={onSelect}
              entry={entry}
              columns={columns}
              selected={selected.includes(entry.key)}
              style={{
                transform: `translateY(${start}px)`,
                position: "absolute",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const ListCore = {
  Virtual: ListVirtualCore,
};