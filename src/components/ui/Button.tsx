import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-primary text-primary-fg hover:brightness-110",
          variant === "secondary" &&
            "border border-border bg-bg-elevated text-fg hover:bg-primary-soft",
          variant === "ghost" && "text-fg-muted hover:bg-primary-soft hover:text-fg",
          variant === "danger" && "bg-danger text-danger-fg hover:brightness-110",
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
