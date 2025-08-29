'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface PasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
  title?: string
  description?: string
  fileId?: string
  isLoading?: boolean
}

export default function PasswordDialog({
  isOpen,
  onClose,
  onSubmit,
  title = "Password Required",
  description = "This file is password protected. Please enter the password to continue.",
  fileId,
  isLoading = false
}: PasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset password when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast.error('Please enter a password')
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(password)
      // Don't close dialog here - let the parent component handle it
    } catch (error) {
      console.error('Password submission error:', error)
      // Keep dialog open for retry
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setPassword('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
            {fileId && (
              <div className="mt-2 text-xs bg-muted/50 p-2 rounded font-mono">
                File ID: {fileId}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">File Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter file password"
              required
              disabled={isSubmitting || isLoading}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span>
              Only the person who knows the password can access this file.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !password.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Verifying...' : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
