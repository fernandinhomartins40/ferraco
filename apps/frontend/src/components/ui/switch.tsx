import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * Switch Component - Material Design 3 Style
 *
 * Especificações baseadas no Material Design 3:
 * - Track: 52px width × 32px height (13rem × 8rem)
 * - Thumb: 24px diameter (6rem) quando unchecked, 28px (7rem) quando checked
 * - Padding interno: 4px
 * - Translação: 20px quando checked
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Track (container)
      "peer inline-flex h-8 w-[3.25rem] shrink-0 cursor-pointer items-center rounded-full",
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
        // Thumb base
        "pointer-events-none block rounded-full bg-background shadow-md",
        // Tamanho dinâmico: menor quando off, maior quando on
        "h-6 w-6 data-[state=checked]:h-7 data-[state=checked]:w-7",
        // Posicionamento e transição
        "transition-all duration-200 ease-in-out",
        "data-[state=unchecked]:translate-x-0.5",
        "data-[state=checked]:translate-x-[1.35rem]",
        // Sombra mais pronunciada quando ativo
        "data-[state=checked]:shadow-lg",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
