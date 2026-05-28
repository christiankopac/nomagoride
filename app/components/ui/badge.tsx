import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "~/lib/cn";

type Variant = "default" | "secondary" | "outline" | "success" | "warning" | "accent";

const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  success: "bg-success-muted text-success border border-success/20",
  warning: "bg-warning-muted text-warning border border-warning/20",
  accent: "bg-accent-muted text-accent border border-accent/20",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
