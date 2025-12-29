import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-[hsl(var(--primary)/0.35)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-[hsl(var(--destructive)/0.45)]",
        outline:
          "border border-border/80 bg-transparent text-foreground hover:bg-secondary/60 hover:text-foreground/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/70",
        ghost: "hover:bg-secondary/80 hover:text-foreground/90",
        link: "text-primary underline-offset-4 hover:underline",
        call:
          "bg-[hsl(var(--call-surface-soft))] text-[hsl(var(--call-text-soft))] border border-border/70 shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--call-surface-soft)/1.1)]",
        "call-primary":
          "bg-[hsl(var(--call-accent-strong))] text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-[hsl(var(--call-accent-strong)/1.05)]",
        "call-danger":
          "bg-[hsl(var(--call-danger))] text-destructive-foreground shadow-[var(--shadow-soft)] hover:bg-[hsl(var(--call-danger)/1.05)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
