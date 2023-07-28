import { ReactElement } from "react";

export interface MyButtonProps {
  myOtherProp: string;
}

const MyButton = ({ myOtherProp }: MyButtonProps): ReactElement => {
  return <button> {myOtherProp} </button>;
};

const v = <MyButton myOtherProp="Click me" />;
