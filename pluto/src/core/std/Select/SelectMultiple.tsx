// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  ReactElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  convertRenderV,
  Key,
  KeyedRenderableRecord,
  AsyncTermSearcher,
  Compare,
} from "@synnaxlabs/x";

import { ColorT } from "@/core/color";
import { CSS } from "@/core/css";
import { useAsyncEffect } from "@/core/hooks";
import { Dropdown, DropdownProps } from "@/core/std/Dropdown";
import { Input, InputControl, InputProps } from "@/core/std/Input";
import { ListColumn, List, ListProps } from "@/core/std/List";
import { Pack } from "@/core/std/Pack";
import { SelectClearButton } from "@/core/std/Select/SelectClearButton";
import { SelectList } from "@/core/std/Select/SelectList";
import { Space } from "@/core/std/Space";
import { Tag } from "@/core/std/Tag";
import { Theming } from "@/core/theming";
import { RenderProp, componentRenderProp } from "@/util/renderProp";

import "@/core/std/Select/SelectMultiple.css";

export interface SelectMultipleProps<
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>
> extends Omit<DropdownProps, "visible" | "onChange" | "children">,
    InputControl<readonly K[]>,
    Omit<ListProps<K, E>, "children">,
    Pick<InputProps, "placeholder"> {
  columns?: Array<ListColumn<K, E>>;
  searcher?: AsyncTermSearcher<string, K, E>;
  tagKey?: keyof E;
  renderTag?: RenderProp<SelectMultipleTagProps<K, E>>;
}

const { Filter, Search } = List;

export const SelectMultiple = <
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>
>({
  onChange,
  value,
  location,
  data,
  columns = [],
  tagKey = "key",
  emptyContent,
  searcher,
  renderTag,
  placeholder,
  ...props
}: SelectMultipleProps<K, E>): ReactElement => {
  const { ref, visible, open } = Dropdown.use();
  const [selected, setSelected] = useState<readonly E[]>([]);
  const searchMode = searcher != null;

  useAsyncEffect(async () => {
    const selectedKeys = selected.map((v) => v.key);
    if (Compare.primitiveArrays(selectedKeys, value) === Compare.equal) return;
    const e = searchMode
      ? await searcher.retrieve(value as K[])
      : data?.filter((v) => value.includes(v.key)) ?? [];
    setSelected(e);
  }, [searcher, searchMode, value, data]);

  const handleChange = useCallback(
    (v: readonly K[], entries: E[]) => {
      setSelected(entries);
      onChange(v);
    },
    [onChange]
  );

  const InputWrapper = useMemo(() => (searchMode ? Search : Filter), [searchMode]);

  return (
    <List data={data} emptyContent={emptyContent}>
      <Dropdown
        ref={ref}
        visible={visible}
        location={location}
        {...props}
        matchTriggerWidth
      >
        {/* @ts-expect-error - searcher is undefined when List is List.Filter  */}
        <InputWrapper searcher={searcher}>
          {({ onChange }) => (
            <SelectMultipleInput<K, E>
              onChange={onChange}
              selected={selected}
              onFocus={open}
              tagKey={tagKey}
              visible={visible}
              renderTag={renderTag}
              placeholder={placeholder}
            />
          )}
        </InputWrapper>
        <SelectList
          visible={visible}
          value={value}
          onChange={handleChange}
          columns={columns}
          allowMultiple
        />
      </Dropdown>
    </List>
  );
};

interface SelectMultipleInputProps<K extends Key, E extends KeyedRenderableRecord<K, E>>
  extends Pick<InputProps, "onChange" | "onFocus" | "placeholder"> {
  selected: readonly E[];
  tagKey: keyof E;
  visible: boolean;
  renderTag?: RenderProp<SelectMultipleTagProps<K, E>>;
}

const SelectMultipleInput = <K extends Key, E extends KeyedRenderableRecord<K, E>>({
  selected,
  onChange,
  onFocus,
  visible,
  tagKey,
  renderTag = componentRenderProp(SelectMultipleTag),
  placeholder = "Search...",
  ...props
}: SelectMultipleInputProps<K, E>): ReactElement => {
  const {
    select: { onSelect, clear },
  } = List.useContext<K, E>();
  const [value, setValue] = useState("");
  const { theme } = Theming.useContext();
  const ref = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (visible) ref.current?.focus();
    // Notice how we don't call onChange with an empty value here. This is so
    // we preserve the previous search result in the list even after we clear
    // the box when a value is selected.
    else setValue("");
  }, [visible, selected]);

  const handleChange = (v: string): void => {
    setValue(v);
    onChange(v);
  };

  const palette = theme.colors.visualization.palettes.default;

  return (
    <Pack align="stretch" {...props} grow className={CSS.B("pluto-select-multiple")}>
      <Input
        ref={ref}
        className={CSS(CSS.BE("select-multiple", "input"), CSS.visible(visible))}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
      />
      <Space
        direction="x"
        className={CSS.BE("select-multiple", "tags")}
        align="center"
        grow
      >
        {selected.map((e, i) =>
          renderTag({
            key: e.key,
            tagKey,
            entry: e,
            color: palette[i % palette.length],
            onClose: () => onSelect?.(e.key),
          })
        )}
      </Space>
      <SelectClearButton onClick={clear} />
    </Pack>
  );
};

interface SelectMultipleTagProps<K extends Key, E extends KeyedRenderableRecord<K, E>> {
  key: K;
  tagKey: keyof E;
  entry: E;
  color: ColorT;
  onClose?: () => void;
}

const SelectMultipleTag = <K extends Key, E extends KeyedRenderableRecord<K, E>>({
  tagKey,
  entry,
  ...props
}: SelectMultipleTagProps<K, E>): ReactElement => (
  <Tag size="small" variant="outlined" draggable {...props}>
    {convertRenderV(entry[tagKey])}
  </Tag>
);