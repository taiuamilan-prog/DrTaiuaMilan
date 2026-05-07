import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label htmlFor={inputId} className="block">
        {label && (
          <span className="block mb-2 text-sm font-medium text-navy-900">
            {label}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-11 px-4 rounded-xl bg-white border border-navy-900/15",
            "text-slate-700 placeholder:text-slate-700/40",
            "focus-ring focus-visible:border-teal-500 transition",
            className
          )}
          {...props}
        />
        {hint && (
          <span className="block mt-1.5 text-xs text-slate-700/70">{hint}</span>
        )}
      </label>
    );
  }
);
Input.displayName = "Input";
