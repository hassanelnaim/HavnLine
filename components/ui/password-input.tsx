"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={cn(
            "flex h-9 w-full rounded-lg border border-border bg-card px-3 pr-10 text-[13.5px] text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-text-faint hover:text-text"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
