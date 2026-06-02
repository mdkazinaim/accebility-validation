import { ReactNode } from "react";

interface CommonWrapperProps {
  children: ReactNode;
  className?: string;
}

const CommonWrapper = ({ children, className = "" }: CommonWrapperProps) => {
  return (
    <div className={`max-w-[1400px] mx-auto my-auto ${className}`}>
      {children}
    </div>
  );
};

export default CommonWrapper;
