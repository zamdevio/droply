'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UsePasswordProtectionProps {
  onPasswordSubmit: (password: string) => Promise<boolean>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePasswordProtection({
  onPasswordSubmit,
  onSuccess,
  onError
}: UsePasswordProtectionProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');

  const openPasswordDialog = useCallback((action: string = 'access this file') => {
    setCurrentAction(action);
    setIsPasswordDialogOpen(true);
  }, []);

  const closePasswordDialog = useCallback(() => {
    setIsPasswordDialogOpen(false);
    setIsVerifying(false);
    setCurrentAction('');
  }, []);

  const handlePasswordSubmit = useCallback(async (password: string) => {
    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    setIsVerifying(true);
    
    try {
      const success = await onPasswordSubmit(password);
      
      if (success) {
        toast.success('Password verified successfully');
        closePasswordDialog();
        onSuccess?.();
      } else {
        toast.error('Invalid password');
        onError?.('Invalid password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify password';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }, [onPasswordSubmit, onSuccess, onError, closePasswordDialog]);

  return {
    isPasswordDialogOpen,
    isVerifying,
    currentAction,
    openPasswordDialog,
    closePasswordDialog,
    handlePasswordSubmit
  };
}
