import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-ring disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-teal-500 text-ivory-50 hover:bg-teal-700 shadow-soft hover:shadow-soft-lg",
        gold:
          "bg-gold-500 text-navy-900 hover:bg-gold-700 hover:text-ivory-50 shadow-soft",
        ghost:
          "bg-transparent text-navy-900 hover:bg-navy-900/5",
        outline:
          "bg-transparent border border-navy-900/15 text-navy-900 hover:bg-navy-900/5",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-full",
        md: "h-11 px-6 text-[0.95rem] rounded-full",
        lg: "h-13 px-8 text-base rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
