import { forwardRef, type HTMLAttributes } from "react";
import { AlertCircle, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const alertStyles = cva(
  "flex gap-3 rounded-2xl border px-5 py-4 items-start",
  {
    variants: {
      tone: {
        info: "bg-navy-900/[0.03] border-navy-900/10 text-navy-900",
        success: "bg-teal-50 border-teal-100 text-teal-900",
        attention: "bg-gold-50 border-gold-100 text-navy-900",
        urgent: "bg-red-50 border-red-100 text-alert-red",
      },
    },
    defaultVariants: { tone: "info" },
  }
);

const iconMap = {
  info: Info,
  success: CheckCircle2,
  attention: AlertCircle,
  urgent: ShieldAlert,
} as const;

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertStyles> {
  title?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tone = "info", title, children, ...props }, ref) => {
    const Icon = iconMap[tone ?? "info"];
    return (
      <div
        ref={ref}
        role="note"
        className={cn(alertStyles({ tone }), className)}
        {...props}
      >
        <Icon className="h-5 w-5 mt-0.5 shrink-0" aria-hidden />
        <div className="text-sm leading-relaxed">
          {title && <p className="font-medium mb-0.5">{title}</p>}
          {children}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";
