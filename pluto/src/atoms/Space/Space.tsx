import { ForwardedRef, HTMLAttributes, PropsWithChildren, forwardRef } from "react";

import clsx from "clsx";

import { ComponentSize } from "../../util/component";
import { Direction } from "../../util/spatial";
import "./Space.css";

export type SpaceAlignment = "start" | "center" | "end" | "stretch";

export const SpaceAlignments = ["start", "center", "end", "stretch"] as const;

export type SpaceJustification =
  | "start"
  | "center"
  | "end"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly";

type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

export const SpaceJustifications = [
  "start",
  "center",
  "end",
  "spaceBetween",
  "spaceAround",
  "spaceEvenly",
] as const;

export interface SpaceExtensionProps {
  empty?: boolean;
  size?: ComponentSize | number | null;
  direction?: Direction;
  reverse?: boolean;
  justify?: SpaceJustification;
  align?: SpaceAlignment;
  grow?: boolean | number;
}

export interface SpaceProps
  extends PropsWithChildren<HTMLAttributes<HTMLDivElement>>,
    SpaceExtensionProps {}

export const Space = forwardRef(
  (
    {
      empty = false,
      size = "medium",
      justify = "start",
      reverse = false,
      direction = "vertical",
      grow,
      align,
      className,
      style,
      children,
      ...props
    }: SpaceProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    let gap;
    if (empty) [size, gap] = [0, 0];
    else if (typeof size === "string") gap = `pluto-space--${size}`;
    else gap = `${size ?? 0}rem`;

    style = {
      gap,
      flexDirection: flexDirection(direction, reverse),
      justifyContent: justifications[justify],
      alignItems: align,
      ...style,
    };

    if (grow !== undefined) style.flexGrow = Number(grow);

    return (
      <div
        className={clsx(
          "pluto-space",
          typeof size === "string" ? "pluto-space--" + size : undefined,
          `pluto-space--${direction}`,
          className
        )}
        ref={ref}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Space.displayName = "Space";

const flexDirection = (direction: Direction, reverse: boolean): FlexDirection => {
  const base = direction === "horizontal" ? "row" : "column";
  return reverse ? ((base + "-reverse") as FlexDirection) : base;
};

const justifications = {
  start: "flex-sart",
  center: "center",
  end: "flex-end",
  spaceBetween: "space-between",
  spaceAround: "space-around",
  spaceEvenly: "space-evenly",
};
