import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-none border border-eve-border bg-zinc-950 px-3 py-2 text-sm text-status-cyan outline-none transition-colors focus:border-status-cyan focus:shadow-glow-cyan focus:ring-1 focus:ring-status-cyan disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
