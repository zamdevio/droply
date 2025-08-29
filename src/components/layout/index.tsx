'use client'

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from '../sidebar'
import { Footer } from './Footer'
import { CookieConsentBanner } from '../CookieConsentBanner'
import { useTheme } from '@/lib/theme'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Add Ctrl+B keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close sidebar on mobile when scrolling (but not on desktop)
  useEffect(() => {
    if (!isLargeScreen && sidebarOpen) {
      const handleScroll = () => {
        setSidebarOpen(false)
      }
      
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isLargeScreen, sidebarOpen])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Fixed position */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isLargeScreen={isLargeScreen}
      />

      {/* Main container - Only move on large screens when sidebar is open */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isLargeScreen && sidebarOpen 
            ? 'ml-64' // Move everything right when sidebar opens on large screens
            : 'ml-0'  // No movement on small screens or when sidebar closed
        }`}
      >
        {/* Header */}
        <Header 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar}
          isLargeScreen={isLargeScreen}
        />

        {/* Main Content */}
        <main className="pt-16">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile overlay - Only on small screens */}
      {sidebarOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
          onTouchMove={() => setSidebarOpen(false)}
        />
      )}

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  )
}
