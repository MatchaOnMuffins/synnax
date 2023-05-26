// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { render, fireEvent } from "@testing-library/react";
import { AiFillCloseCircle } from "react-icons/ai";
import { describe, expect, it, vitest } from "vitest";

import { Text } from "@/core/Typography";

describe("Text", () => {
  describe("Basic", () => {
    it("should render text with the correct HTML tag", () => {
      const c = render(<Text level="h2">Hello</Text>);
      expect(c.getByText("Hello").tagName).toBe("H2");
    });
  });
  describe("WithIcon", () => {
    it("should render text with a starting icon", () => {
      const c = render(
        <Text.WithIcon startIcon={<AiFillCloseCircle aria-label="close" />} level="h2">
          Hello
        </Text.WithIcon>
      );
      expect(c.getByLabelText("close")).toBeTruthy();
    });
    it("should render text with an ending icon", () => {
      const c = render(
        <Text.WithIcon endIcon={<AiFillCloseCircle aria-label="close" />} level="h2">
          Hello
        </Text.WithIcon>
      );
      expect(c.getByLabelText("close")).toBeTruthy();
    });
  });
  describe("Editable", () => {
    it("should focus and select the text when double clicked", () => {
      const c = render(
        <Text.Editable level="h1" value="Hello" onChange={vitest.fn()} />
      );
      const text = c.getByText("Hello");
      fireEvent.dblClick(text);
      expect(document.activeElement).toBe(text);
      expect(window.getSelection()?.toString()).toBe("Hello");
    });
  });
});
