'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  CloudArrowUpIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  FolderIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  open: boolean
  onClose: () => void
  isLargeScreen: boolean
}

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

const navigation: NavSection[] = [
  {
    title: 'Main',
    items: [
      { name: 'Upload Files', href: '/', icon: CloudArrowUpIcon },
      { name: 'Search Files', href: '/search', icon: MagnifyingGlassIcon },
      { name: 'My Files', href: '/files', icon: FolderIcon },
    ]
  },
  {
    title: 'Tools',
    items: [
      { name: 'Upload File', href: '/upload', icon: CloudArrowUpIcon },
      { name: 'API Documentation', href: '/docs', icon: CodeBracketIcon },
      { name: 'Demo File', href: '/demo-file', icon: ShieldCheckIcon },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
      { name: 'Help Center', href: '/help', icon: QuestionMarkCircleIcon },
    ]
  },
  {
    title: 'About',
    items: [
      { name: 'About Droply', href: '/about', icon: InformationCircleIcon },
      { name: 'Privacy Policy', href: '/privacy', icon: DocumentTextIcon },
      { name: 'Terms of Service', href: '/terms', icon: DocumentTextIcon },
    ]
  }
]

export function Sidebar({ open, onClose, isLargeScreen }: SidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const toggleSection = (title: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(title)) {
      newCollapsed.delete(title)
    } else {
      newCollapsed.add(title)
    }
    setCollapsedSections(newCollapsed)
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href) ?? false
  }

  // Prevent scroll propagation to main page
  useEffect(() => {
    const sidebar = sidebarRef.current
    const nav = navRef.current
    
    if (!sidebar || !nav) return

    const preventScrollPropagation = (e: WheelEvent | TouchEvent) => {
      e.stopPropagation()
    }

    const preventScrollBubble = (e: Event) => {
      e.stopPropagation()
    }

    // Prevent scroll events from bubbling up
    sidebar.addEventListener('wheel', preventScrollPropagation, { passive: false })
    sidebar.addEventListener('touchmove', preventScrollPropagation, { passive: false })
    nav.addEventListener('wheel', preventScrollPropagation, { passive: false })
    nav.addEventListener('touchmove', preventScrollPropagation, { passive: false })

    // Prevent other events from bubbling
    sidebar.addEventListener('scroll', preventScrollBubble)
    nav.addEventListener('scroll', preventScrollBubble)

    return () => {
      sidebar.removeEventListener('wheel', preventScrollPropagation)
      sidebar.removeEventListener('touchmove', preventScrollPropagation)
      sidebar.removeEventListener('scroll', preventScrollBubble)
      nav.removeEventListener('wheel', preventScrollPropagation)
      nav.removeEventListener('touchmove', preventScrollPropagation)
      nav.removeEventListener('scroll', preventScrollBubble)
    }
  }, [open])

  // Prevent body scroll on mobile when sidebar is open
  useEffect(() => {
    if (!isLargeScreen && open) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }

    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [open, isLargeScreen])

  return (
    <>
      {/* Mobile Sidebar - Overlay style (shows on top of header) */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden sidebar-mobile ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent 
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
          isActive={isActive}
          onClose={onClose}
          navRef={navRef}
        />
      </div>

      {/* Desktop Sidebar - Fixed position (works normally) */}
      {isLargeScreen && (
        <div 
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out sidebar-desktop ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent 
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            isActive={isActive}
            onClose={() => {}} // No-op for desktop
            navRef={navRef}
          />
        </div>
      )}
    </>
  )
}

function SidebarContent({ 
  collapsedSections, 
  toggleSection, 
  isActive, 
  onClose,
  navRef
}: {
  collapsedSections: Set<string>
  toggleSection: (title: string) => void
  isActive: (href: string) => boolean
  onClose: () => void
  navRef: React.RefObject<HTMLElement | null>
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <CloudArrowUpIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Droply</h2>
            <p className="text-xs text-muted-foreground">File Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        ref={navRef}
        className="flex-1 p-4 space-y-6 overflow-y-auto sidebar-scroll"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--muted-foreground) transparent'
        }}
      >
        {navigation.map((section) => (
          <div key={section.title}>
            <button
              onClick={() => toggleSection(section.title)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <span>{section.title}</span>
              {collapsedSections.has(section.title) ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>

            {!collapsedSections.has(section.title) && (
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for developers
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
