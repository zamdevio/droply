'use client'

import Link from 'next/link'
import { CloudArrowUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SearchBar } from './SearchBar'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  isLargeScreen: boolean
}

export function Header({ sidebarOpen, onToggleSidebar, isLargeScreen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Left side - Sidebar toggle and Logo */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onToggleSidebar}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle sidebar</p>
                <p className="text-xs text-muted-foreground">Ctrl + B</p>
                <div className="mt-1 rounded bg-muted px-1 py-0.5 text-xs">B</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <CloudArrowUpIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Droply
            </span>
          </Link>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 flex justify-center max-w-sm mx-4">
          <SearchBar />
        </div>

        {/* Right side - Theme toggle and other actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
