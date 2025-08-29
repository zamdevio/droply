'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, DocumentIcon, FolderIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    
    try {
      // Use the info API to search by file ID
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const handleFileClick = (fileId: string) => {
    router.push(`/info/${fileId}`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Search Files</h1>
        <p className="text-muted-foreground text-lg">
          Find your files quickly by entering the file ID
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search by File ID</CardTitle>
          <CardDescription>
            Enter the unique file ID to find and view file information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter file ID (e.g., abc123def456)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={!query.trim() || isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            {isSearching ? 'Searching...' : `Results (${searchResults.length})`}
          </h2>

          {isSearching ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching for files...</p>
              </CardContent>
            </Card>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((file) => (
                <Card key={file.fileId} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleFileClick(file.fileId)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        {file.meta ? (
                          <FolderIcon className="w-6 h-6 text-white" />
                        ) : (
                          <DocumentIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">{file.originalName}</h3>
                          {file.meta && (
                            <Badge variant="secondary">ZIP Archive</Badge>
                          )}
                          {file.passwordHash && (
                            <Badge variant="outline">Password Protected</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p><strong>File ID:</strong> {file.fileId}</p>
                            <p><strong>Size:</strong> {formatFileSize(file.size)}</p>
                            <p><strong>Type:</strong> {file.contentType || 'Unknown'}</p>
                          </div>
                          <div>
                            <p><strong>Uploaded:</strong> {formatDate(file.createdAt)}</p>
                            <p><strong>Expires:</strong> {file.expiresAt ? formatDate(file.expiresAt) : 'Never'}</p>
                            <p><strong>Downloads:</strong> {file.downloadCount || 0}/{file.maxDownloads || '∞'}</p>
                          </div>
                        </div>

                        {file.meta && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Archive Contents:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {file.meta.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between">
                                  <span className="truncate">{item.name}</span>
                                  <span className="text-muted-foreground">{formatFileSize(item.size)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-muted-foreground">
                  No files were found with the ID "{query}". Please check the ID and try again.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to use search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
            <p>Get the file ID from the person who shared the file with you</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
            <p>Enter the file ID in the search box above</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
            <p>Click "Search" or press Enter to find the file</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
            <p>Click on the file result to view details and download</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
