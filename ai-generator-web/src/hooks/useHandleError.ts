import { useCallback } from 'react';
import { errorHandler } from '../lib/errorHandler';
import { useToast } from '../context/ToastContext';

/**
 * Hook that combines errorHandler.handle() + toast into a single call.
 * Returns a function: handleError(error, context) that logs, wraps, and toasts.
 */
export function useHandleError() {
  const { error: showError } = useToast();

  return useCallback(
    (error: unknown, context: string) => {
      const appError = errorHandler.handle(error, context, { logToConsole: true });
      showError(errorHandler.getUserMessage(appError));
      return appError;
    },
    [showError],
  );
}
