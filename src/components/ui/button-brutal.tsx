import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base brutalist button styles
  "inline-flex items-center justify-center whitespace-nowrap font-mono font-bold text-lg uppercase tracking-wider transition-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border-4 border-pure-black",
  {
    variants: {
      variant: {
        primary: "bg-neon-pink text-pure-white hover:bg-pure-black hover:text-neon-pink focus:ring-4 focus:ring-neon-pink",
        secondary: "bg-toxic-green text-pure-black hover:bg-pure-black hover:text-toxic-green focus:ring-4 focus:ring-toxic-green",
        accent: "bg-electric-blue text-pure-white hover:bg-pure-black hover:text-electric-blue focus:ring-4 focus:ring-electric-blue",
        destructive: "bg-neon-pink text-pure-white hover:bg-pure-black hover:text-neon-pink focus:ring-4 focus:ring-neon-pink",
        outline: "bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white focus:ring-4 focus:ring-pure-black",
        ghost: "border-transparent bg-transparent hover:bg-pure-black hover:text-pure-white hover:border-pure-black focus:ring-4 focus:ring-pure-black",
        link: "border-transparent bg-transparent text-neon-pink underline-offset-4 hover:underline hover:bg-transparent focus:ring-4 focus:ring-neon-pink",
      },
      size: {
        default: "px-8 py-4 text-lg",
        sm: "px-6 py-3 text-base",
        lg: "px-12 py-6 text-xl",
        xl: "px-16 py-8 text-2xl",
        icon: "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }