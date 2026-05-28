import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "~/lib/cn";

type Variant = "default" | "secondary" | "outline" | "ghost" | "accent" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-input bg-background hover:bg-secondary hover:text-foreground",
  ghost:
    "hover:bg-secondary hover:text-foreground",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 py-2",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
