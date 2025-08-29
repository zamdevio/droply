import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Export compression utilities
export * from './compression';

// Export UI utilities
export * from './ui';

// Tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
