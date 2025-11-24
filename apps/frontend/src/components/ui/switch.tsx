import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * Switch Component - iOS/Modern Style
 *
 * Design limpo e profissional inspirado em iOS e switches modernos:
 * - Track: 44px width × 24px height (proporção 1.83:1)
 * - Thumb: 20px diameter (círculo perfeito, sempre)
 * - Padding interno: 2px
 * - Animação suave e natural
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Track (container) - proporções perfeitas
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
      "transition-colors duration-200 ease-in-out",
      // Estados de cor
      "data-[state=unchecked]:bg-input",
      "data-[state=checked]:bg-primary",
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Thumb - SEMPRE círculo perfeito (5 = 20px)
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg",
        // Movimento suave
        "transition-transform duration-200 ease-in-out",
        "data-[state=unchecked]:translate-x-0",
        "data-[state=checked]:translate-x-5",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
