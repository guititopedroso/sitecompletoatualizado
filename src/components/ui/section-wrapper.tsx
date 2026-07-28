import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import React from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const SectionWrapper = ({ children, className }: SectionWrapperProps) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={cn(
        "opacity-0 transform translate-y-8 transition-all duration-700 ease-out",
        { "opacity-100 translate-y-0": isVisible },
        className
      )}
    >
      {children}
    </div>
  );
};

export default SectionWrapper;
