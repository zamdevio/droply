import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { apiClient, ApiResponse, PasswordRequiredResponse } from '@/lib/client/api'

export function usePasswordProtectedAPI<T>() {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [pendingApiCall, setPendingApiCall] = useState<((password: string) => Promise<void>) | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)

  const handleApiCall = useCallback(async (
    apiFunction: (password?: string) => Promise<ApiResponse<T>>,
    onSuccess: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    try {
      // First try without password
      const result = await apiFunction()
      
      if (result.success && result.data) {
        onSuccess(result.data)
        return
      }
      
      // Check if password is required
      if (apiClient.isPasswordRequired(result)) {
        setFileId(result.data.fileId)
        setPendingApiCall(() => async (password: string) => {
          try {
            const retryResult = await apiFunction(password)
            if (retryResult.success && retryResult.data) {
              onSuccess(retryResult.data)
              setIsPasswordDialogOpen(false)
              setPendingApiCall(null)
              setFileId(null)
            } else {
              // Handle retry error
              const errorMessage = retryResult.error || retryResult.message || 'Failed to access file'
              if (retryResult.error === 'Invalid password') {
                toast.error('Incorrect password. Please try again.')
              } else {
                toast.error(errorMessage)
                onError?.(errorMessage)
              }
            }
          } catch (error) {
            console.error('API retry error:', error)
            toast.error('Failed to access file. Please try again.')
          }
        })
        setIsPasswordDialogOpen(true)
        return
      }
      
      // Handle other errors
      const errorMessage = result.error || result.message || 'Failed to access file'
      toast.error(errorMessage)
      onError?.(errorMessage)
      
    } catch (error) {
      console.error('API call error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to access file'
      toast.error(errorMessage)
      onError?.(errorMessage)
    }
  }, [])

  const handlePasswordSubmit = useCallback(async (password: string) => {
    if (pendingApiCall) {
      await pendingApiCall(password)
    }
  }, [pendingApiCall])

  const closePasswordDialog = useCallback(() => {
    setIsPasswordDialogOpen(false)
    setPendingApiCall(null)
    setFileId(null)
  }, [])

  return {
    isPasswordDialogOpen,
    fileId,
    handleApiCall,
    handlePasswordSubmit,
    closePasswordDialog
  }
}
