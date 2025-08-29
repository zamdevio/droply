'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setSearchResults([])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search function
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      // For now, we'll use the info API to search by file ID
      // In the future, you can create a dedicated search API
      const response = await fetch(`/api/v1/info/${query.trim()}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults([data.data])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  // Navigate to file info page
  const handleFileClick = (fileId: string) => {
    router.push(`/info/${fileId}`)
    setIsOpen(false)
    setQuery('')
    setSearchResults([])
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    setSearchResults([])
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Search Button (visible in header) */}
      <Button
        variant="outline"
        className="w-full max-w-xs justify-start text-sm text-muted-foreground h-9 relative"
        onClick={() => setIsOpen(true)}
      >
        <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Search files...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search Files</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Enter file ID to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-6 w-6 p-0"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={!query.trim() || isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Results</h3>
                {searchResults.map((file) => (
                  <div
                    key={file.fileId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleFileClick(file.fileId)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{file.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {file.fileId} • Size: {Math.round(file.size / 1024)}KB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No files found with that ID</p>
                <p className="text-sm">Try entering a different file ID</p>
              </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-muted-foreground text-center">
              <p>Search by file ID • Press ⌘K to open search • Press Esc to close</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
