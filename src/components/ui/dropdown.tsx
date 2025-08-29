"use client"

import * as React from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DropdownProps {
  trigger: React.ReactNode
  items: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    disabled?: boolean
  }[]
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function Dropdown({ 
  trigger, 
  items, 
  align = "end", 
  side = "bottom" 
}: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className="flex items-center gap-2"
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
