export class AppError extends Error {
  public code: string;
  public statusCode?: number;
  public context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  sendToService?: boolean;
}

export const errorHandler = {
  /**
   * Handle errors with consistent logging and user feedback
   */
  handle(
    error: unknown,
    context?: string,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const {
      logToConsole = true,
      sendToService = false,
    } = options;

    let appError: AppError;

    // Convert to AppError if needed
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message || 'An unexpected error occurred',
        'UNKNOWN_ERROR',
        500
      );
    } else if (typeof error === 'string') {
      appError = new AppError(error, 'UNKNOWN_ERROR', 500);
    } else {
      appError = new AppError(
        'An unknown error occurred',
        'UNKNOWN_ERROR',
        500
      );
    }

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'Error'}]`, {
        message: appError.message,
        code: appError.code,
        statusCode: appError.statusCode,
        context: appError.context,
        stack: appError.stack,
      });
    }

    // Send to error tracking service
    if (sendToService && process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry, LogRocket, etc.
      // sendToSentry(appError, context);
    }

    return appError;
  },

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof ValidationError) {
      return error.message;
    }

    if (error instanceof AuthError) {
      return 'Please log in to continue';
    }

    if (error instanceof NotFoundError) {
      return error.message;
    }

    if (error instanceof NetworkError) {
      return 'Connection failed. Please check your internet connection.';
    }

    if (error instanceof AppError) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    if (error instanceof NetworkError) return true;
    if (error instanceof AppError) {
      return error.statusCode === 408 || error.statusCode === 503;
    }
    return false;
  },
};

/**
 * Wrap async functions with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw errorHandler.handle(error, context, {
        logToConsole: true,
        sendToService: true,
      });
    }
  }) as T;
};
