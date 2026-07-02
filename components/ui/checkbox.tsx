"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  onCheckedChange,
  id,
  ...props
}: {
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  id?: string
} & Omit<CheckboxPrimitive.Root.Props, "checked" | "onCheckedChange">) {
  return (
    <CheckboxPrimitive.Root
      id={id}
      data-slot="checkbox"
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded border border-input bg-transparent shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
