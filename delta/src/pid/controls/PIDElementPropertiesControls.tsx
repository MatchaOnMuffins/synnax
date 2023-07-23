// Copyright 2023 synnax labs, inc.
//
// use of this software is governed by the business source license included in the file
// licenses/bsl.txt.
//
// as of the change date specified in that file, in accordance with the business source
// license, use of this software will be governed by the apache license, version 2.0,
// included in the file licenses/apl.txt.

import { ReactElement } from "react";

import { Status, Space } from "@synnaxlabs/pluto";
import { useDispatch } from "react-redux";

import { useSelectSelectedPIDElementsProps } from "../store/selectors";
import { setPIDElementProps } from "../store/slice";

import { CSS } from "@/css";
import { ELEMENTS } from "@/pid/elements";

import "@/pid/controls/PIDElementPropertiesControls.css";

export interface PIDPropertiesProps {
  layoutKey: string;
}

export const PIDElementPropertiesControls = ({
  layoutKey,
}: PIDPropertiesProps): ReactElement => {
  const elements = useSelectSelectedPIDElementsProps(layoutKey);

  const dispatch = useDispatch();

  const handleChange = (props: any): void => {
    dispatch(setPIDElementProps({ layoutKey, key: elements[0].key, props }));
  };

  if (elements.length === 0) {
    return (
      <Status.Text.Centered variant="disabled" hideIcon>
        Select a PID element to configure its properties.
      </Status.Text.Centered>
    );
  }

  const C = ELEMENTS[elements[0].props.type];

  return (
    <Space className={CSS.B("pid-properties")} size="small">
      <C.Form value={elements[0].props} onChange={handleChange} />
    </Space>
  );
};
