import React from "react";
import clsx from "clsx";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

const Container = ({ children, className }: Props) => {
  return (
    <div className={clsx("mx-auto px-5", className)}>
      {children}
    </div>
  );
};

export default Container;
