'use client'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded mb-2 last:mb-0"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.5s',
          }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-muted rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>
    </div>
  )
}

export function SkeletonUpload() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg animate-pulse">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
        </div>

        {/* Upload Area */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-muted rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
                <div className="h-10 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonFileInfo() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg animate-pulse">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded w-80 mx-auto"></div>
        </div>

        {/* File Details */}
        <div className="space-y-6">
          <div className="bg-muted rounded-lg p-6">
            <div className="h-6 bg-muted-foreground/20 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <div className="h-12 bg-muted rounded-lg w-32"></div>
            <div className="h-12 bg-muted rounded-lg w-32"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="h-6 bg-muted rounded w-48"></div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-muted rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonButton() {
  return (
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
  )
}

export function SkeletonInput() {
  return (
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
  )
}
