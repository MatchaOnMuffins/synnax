// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Fragment, isValidElement, ReactElement } from "react";

import { toArray } from "@synnaxlabs/x";

import { CSS } from "@/core/css";
import { Button, ButtonIconProps } from "@/core/std/Button";
import { Divider } from "@/core/std/Divider";
import { useHeaderContext } from "@/core/std/Header/Header";
import { Space } from "@/core/std/Space";
import { Typography, TypographyLevel } from "@/core/std/Typography";

export type HeaderAction = ButtonIconProps | ReactElement;

export interface HeaderActionsProps {
  children?: HeaderAction | HeaderAction[];
}

export const HeaderActions = ({ children = [] }: HeaderActionsProps): ReactElement => {
  const { level, divided } = useHeaderContext();
  return (
    <Space
      direction="x"
      size="small"
      align="center"
      className={CSS.BE("header", "actions")}
    >
      {toArray(children).map((action, i) => (
        <HeaderActionC key={i} index={i} level={level} divided={divided}>
          {action}
        </HeaderActionC>
      ))}
    </Space>
  );
};

interface HeaderActionCProps {
  index: number;
  level: TypographyLevel;
  children: ReactElement | ButtonIconProps;
  divided: boolean;
}

const HeaderActionC = ({
  index,
  level,
  children,
  divided,
}: HeaderActionCProps): ReactElement => {
  let content: ReactElement = children as ReactElement;
  if (!isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const props: ButtonIconProps = children as ButtonIconProps;
    content = (
      <Button.Icon
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          props.onClick?.(e);
        }}
        key={index}
        size={Typography.LevelComponentSizes[level]}
        {...props}
      />
    );
  }
  return (
    <Fragment key={index}>
      {divided && <Divider />}
      {content}
    </Fragment>
  );
};
