import { toast } from "@/components/ui/use-toast";

// Error types for different scenarios
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  PAYMENT = 'PAYMENT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  SECURITY = 'SECURITY'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  field?: string;
  details?: any;
  timestamp: string;
  userId?: string;
  requestId?: string;
  stack?: string;
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];
  private maxErrors = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle different types of errors
  handleError(error: any, context?: string, userId?: string): AppError {
    const appError = this.createAppError(error, context, userId);
    this.logError(appError);
    this.displayError(appError);
    this.storeError(appError);
    
    // Report critical errors
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(appError);
    }

    return appError;
  }

  // Create standardized error object
  private createAppError(error: any, context?: string, userId?: string): AppError {
    const timestamp = new Date().toISOString();
    const requestId = this.generateRequestId();

    // Handle different error sources
    if (error.name === 'ValidationError') {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: error.message,
        field: error.field,
        code: error.code,
        timestamp,
        userId,
        requestId
      };
    }

    if (error.name === 'SecurityError') {
      return {
        type: ErrorType.SECURITY,
        severity: error.severity === 'high' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
        message: error.message,
        code: error.code,
        timestamp,
        userId,
        requestId
      };
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        timestamp,
        userId,
        requestId
      };
    }

    // HTTP errors
    if (error.status) {
      return this.createHttpError(error, timestamp, userId, requestId);
    }

    // Payment errors
    if (context === 'payment' || error.message?.includes('payment')) {
      return {
        type: ErrorType.PAYMENT,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Payment processing failed',
        code: error.code || 'PAYMENT_ERROR',
        timestamp,
        userId,
        requestId
      };
    }

    // File upload errors
    if (context === 'file_upload' || error.message?.includes('file')) {
      return {
        type: ErrorType.FILE_UPLOAD,
        severity: ErrorSeverity.LOW,
        message: error.message || 'File upload failed',
        code: error.code || 'FILE_ERROR',
        timestamp,
        userId,
        requestId
      };
    }

    // Generic client error
    return {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp,
      userId,
      requestId,
      stack: error.stack
    };
  }

  // Handle HTTP-specific errors
  private createHttpError(error: any, timestamp: string, userId?: string, requestId?: string): AppError {
    const status = error.status || error.response?.status;
    const message = error.message || error.response?.data?.message || 'Request failed';

    switch (status) {
      case 400:
        return {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          message: 'Invalid request data',
          code: 'BAD_REQUEST',
          timestamp,
          userId,
          requestId
        };

      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.MEDIUM,
          message: 'Authentication required. Please log in.',
          code: 'UNAUTHORIZED',
          timestamp,
          userId,
          requestId
        };

      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          severity: ErrorSeverity.MEDIUM,
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          timestamp,
          userId,
          requestId
        };

      case 404:
        return {
          type: ErrorType.CLIENT,
          severity: ErrorSeverity.LOW,
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          timestamp,
          userId,
          requestId
        };

      case 429:
        return {
          type: ErrorType.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: 'Too many requests. Please wait before trying again.',
          code: 'RATE_LIMITED',
          timestamp,
          userId,
          requestId
        };

      case 500:
        return {
          type: ErrorType.SERVER,
          severity: ErrorSeverity.HIGH,
          message: 'Internal server error. Please try again later.',
          code: 'INTERNAL_ERROR',
          timestamp,
          userId,
          requestId
        };

      case 503:
        return {
          type: ErrorType.SERVER,
          severity: ErrorSeverity.HIGH,
          message: 'Service temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          timestamp,
          userId,
          requestId
        };

      default:
        return {
          type: ErrorType.SERVER,
          severity: ErrorSeverity.MEDIUM,
          message: message,
          code: `HTTP_${status}`,
          timestamp,
          userId,
          requestId
        };
    }
  }

  // Display error to user
  private displayError(error: AppError): void {
    // Don't show validation errors as toasts (they're handled in forms)
    if (error.type === ErrorType.VALIDATION) {
      return;
    }

    // Don't show auth errors as toasts (they redirect)
    if (error.type === ErrorType.AUTHENTICATION) {
      return;
    }

    const title = this.getErrorTitle(error.type);
    const description = this.getUserFriendlyMessage(error);

    toast({
      title,
      description,
      variant: error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH 
        ? "destructive" 
        : "default",
      duration: this.getToastDuration(error.severity)
    });
  }

  // Get user-friendly error titles
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return "Connection Error";
      case ErrorType.PAYMENT:
        return "Payment Error";
      case ErrorType.FILE_UPLOAD:
        return "Upload Error";
      case ErrorType.AUTHORIZATION:
        return "Access Denied";
      case ErrorType.RATE_LIMIT:
        return "Rate Limited";
      case ErrorType.SERVER:
        return "Server Error";
      case ErrorType.SECURITY:
        return "Security Alert";
      default:
        return "Error";
    }
  }

  // Get user-friendly error messages
  private getUserFriendlyMessage(error: AppError): string {
    // Return the original message for most cases
    // but sanitize potentially sensitive information
    let message = error.message;

    // Remove technical details from user-facing messages
    message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[server]');
    message = message.replace(/localhost:\d+/g, '[server]');
    message = message.replace(/stacktrace|stack trace/gi, 'error details');

    return message;
  }

  // Get toast duration based on severity
  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000;
      case ErrorSeverity.MEDIUM:
        return 5000;
      case ErrorSeverity.HIGH:
        return 8000;
      case ErrorSeverity.CRITICAL:
        return 10000;
      default:
        return 5000;
    }
  }

  // Log error for debugging
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;

    switch (logLevel) {
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warn':
        console.warn(logMessage, error);
        break;
      case 'info':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
  }

  // Get appropriate log level
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  // Store error for analytics
  private storeError(error: AppError): void {
    this.errors.push(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Store in localStorage for debugging
    try {
      const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      storedErrors.push(error);
      
      // Keep only last 50 errors in localStorage
      const recentErrors = storedErrors.slice(-50);
      localStorage.setItem('app_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  }

  // Report critical errors (in production, this would send to monitoring service)
  private reportCriticalError(error: AppError): void {
    console.error('CRITICAL ERROR REPORTED:', error);
    
    // In production, send to error reporting service
    // try {
    //   fetch('/api/errors/report', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(error)
    //   });
    // } catch (e) {
    //   console.error('Failed to report critical error:', e);
    // }
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType: Record<ErrorType, number> = {} as any;
    const bySeverity: Record<ErrorSeverity, number> = {} as any;

    // Initialize counters
    Object.values(ErrorType).forEach(type => byType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => bySeverity[severity] = 0);

    // Count errors
    this.errors.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      recent: this.errors.slice(-10)
    };
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem('app_errors');
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: any, context?: string, userId?: string): AppError => {
  return errorHandler.handleError(error, context, userId);
};

export const handleValidationError = (message: string, field?: string): AppError => {
  const error = { name: 'ValidationError', message, field };
  return errorHandler.handleError(error);
};

export const handleNetworkError = (error: any): AppError => {
  return errorHandler.handleError(error, 'network');
};

export const handlePaymentError = (error: any): AppError => {
  return errorHandler.handleError(error, 'payment');
};

export const handleFileUploadError = (error: any): AppError => {
  return errorHandler.handleError(error, 'file_upload');
};

// API call wrapper with error handling
export const apiCall = async <T>(
  apiFunction: () => Promise<T>,
  context?: string,
  userId?: string
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await apiFunction();
    return { data };
  } catch (error) {
    const appError = errorHandler.handleError(error, context, userId);
    return { error: appError };
  }
};

export default errorHandler;
