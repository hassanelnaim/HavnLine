import * as React from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-paper text-text-muted",
  brand: "bg-brand-soft text-brand-dark",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-border-soft text-text-muted",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantClasses;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
