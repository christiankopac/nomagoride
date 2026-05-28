import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "~/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" };

export const Separator = forwardRef<HTMLDivElement, Props>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = "Separator";
