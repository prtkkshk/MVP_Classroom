// Comprehensive error handling system for InLearn MVP

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
}

export interface ErrorResponse {
  success: false;
  error: AppError;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Error codes for different types of errors
export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',

  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_LENGTH = 'VALIDATION_INVALID_LENGTH',
  VALIDATION_INVALID_VALUE = 'VALIDATION_INVALID_VALUE',
  VALIDATION_DUPLICATE_ENTRY = 'VALIDATION_DUPLICATE_ENTRY',

  // Database errors
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  DB_RECORD_NOT_FOUND = 'DB_RECORD_NOT_FOUND',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  DB_TRANSACTION_FAILED = 'DB_TRANSACTION_FAILED',

  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',

  // Business logic errors
  COURSE_ALREADY_ENROLLED = 'COURSE_ALREADY_ENROLLED',
  COURSE_FULL = 'COURSE_FULL',
  SESSION_ALREADY_STARTED = 'SESSION_ALREADY_STARTED',
  ASSIGNMENT_SUBMISSION_CLOSED = 'ASSIGNMENT_SUBMISSION_CLOSED',

  // System errors
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_OVERLOAD = 'SYSTEM_OVERLOAD',
  SYSTEM_CONFIGURATION_ERROR = 'SYSTEM_CONFIGURATION_ERROR',

  // Unknown error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error context for better debugging
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  timestamp: Date;
  url?: string;
  method?: string;
  params?: Record<string, any>;
  body?: any;
}

// Error logger interface
export interface ErrorLogger {
  log(error: AppError, context?: ErrorContext): void;
  logWarning(message: string, context?: ErrorContext): void;
  logInfo(message: string, context?: ErrorContext): void;
  logDebug(message: string, context?: ErrorContext): void;
}

// Console-based error logger (can be replaced with external service)
export class ConsoleErrorLogger implements ErrorLogger {
  log(error: AppError, context?: ErrorContext): void {
    const logData = {
      timestamp: error.timestamp.toISOString(),
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      },
      context
    };

    if (error.code === ErrorCode.CRITICAL || error.code === ErrorCode.HIGH) {
      console.error('🚨 CRITICAL/HIGH ERROR:', logData);
    } else if (error.code === ErrorCode.MEDIUM) {
      console.warn('⚠️ MEDIUM ERROR:', logData);
    } else {
      console.log('ℹ️ LOW ERROR:', logData);
    }
  }

  logWarning(message: string, context?: ErrorContext): void {
    console.warn('⚠️ WARNING:', { message, context });
  }

  logInfo(message: string, context?: ErrorContext): void {
    console.log('ℹ️ INFO:', { message, context });
  }

  logDebug(message: string, context?: ErrorContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 DEBUG:', { message, context });
    }
  }
}

// Error factory for creating consistent errors
export class ErrorFactory {
  private static logger: ErrorLogger = new ConsoleErrorLogger();

  static setLogger(logger: ErrorLogger): void {
    ErrorFactory.logger = logger;
  }

  static create(
    code: ErrorCode,
    message: string,
    details?: string,
    context?: ErrorContext
  ): AppError {
    const error: AppError = {
      code,
      message,
      details,
      timestamp: new Date(),
      context: context as Record<string, any>
    };

    // Log the error
    this.logger.log(error, context);

    return error;
  }

  static createValidationError(
    field: string,
    message: string,
    context?: ErrorContext
  ): AppError {
    return this.create(
      ErrorCode.VALIDATION_REQUIRED_FIELD,
      `Validation error for field '${field}': ${message}`,
      `Field: ${field}`,
      context
    );
  }

  static createAuthError(
    code: ErrorCode,
    message: string,
    context?: ErrorContext
  ): AppError {
    return this.create(code, message, 'Authentication error', context);
  }

  static createDatabaseError(
    code: ErrorCode,
    message: string,
    details?: string,
    context?: ErrorContext
  ): AppError {
    return this.create(code, message, details, context);
  }

  static createFileError(
    code: ErrorCode,
    message: string,
    details?: string,
    context?: ErrorContext
  ): AppError {
    return this.create(code, message, details, context);
  }

  static createNetworkError(
    code: ErrorCode,
    message: string,
    context?: ErrorContext
  ): AppError {
    return this.create(code, message, 'Network error', context);
  }

  static createBusinessError(
    code: ErrorCode,
    message: string,
    context?: ErrorContext
  ): AppError {
    return this.create(code, message, 'Business logic error', context);
  }
}

// Error handler for API responses
export class ApiErrorHandler {
  static handleError(error: any, context?: ErrorContext): ErrorResponse {
    let appError: AppError;

    if (error instanceof Error) {
      // Handle standard JavaScript errors
      appError = ErrorFactory.create(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        error.stack,
        context
      );
    } else if (error && typeof error === 'object' && 'code' in error) {
      // Handle custom app errors
      appError = error as AppError;
    } else {
      // Handle unknown error types
      appError = ErrorFactory.create(
        ErrorCode.UNKNOWN_ERROR,
        'An unexpected error occurred',
        JSON.stringify(error),
        context
      );
    }

    return {
      success: false,
      error: appError
    };
  }

  static handleSuccess<T>(data: T, message?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      message
    };
  }
}

// Error boundary error handler
export class ErrorBoundaryHandler {
  static handleError(error: Error, errorInfo: React.ErrorInfo): AppError {
    const context: ErrorContext = {
      component: errorInfo.componentStack,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    return ErrorFactory.create(
      ErrorCode.SYSTEM_CONFIGURATION_ERROR,
      'React component error',
      error.stack,
      context
    );
  }
}

// User-friendly error messages
export const getUserFriendlyMessage = (error: AppError): string => {
  const messages: Record<string, string> = {
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action.',
    [ErrorCode.AUTH_USER_NOT_FOUND]: 'User account not found.',
    [ErrorCode.AUTH_ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support.',
    
    [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Please fill in all required fields.',
    [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Please check the format of your input.',
    [ErrorCode.VALIDATION_INVALID_LENGTH]: 'Input is too long or too short.',
    [ErrorCode.VALIDATION_INVALID_VALUE]: 'Please enter a valid value.',
    [ErrorCode.VALIDATION_DUPLICATE_ENTRY]: 'This item already exists.',
    
    [ErrorCode.DB_CONNECTION_FAILED]: 'Unable to connect to the database. Please try again later.',
    [ErrorCode.DB_QUERY_FAILED]: 'Database operation failed. Please try again.',
    [ErrorCode.DB_RECORD_NOT_FOUND]: 'The requested item was not found.',
    [ErrorCode.DB_CONSTRAINT_VIOLATION]: 'Operation violates database constraints.',
    
    [ErrorCode.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
    [ErrorCode.FILE_INVALID_TYPE]: 'File type not supported. Please choose a different file.',
    [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed. Please try again.',
    
    [ErrorCode.NETWORK_TIMEOUT]: 'Request timed out. Please check your connection and try again.',
    [ErrorCode.NETWORK_CONNECTION_FAILED]: 'Network connection failed. Please check your internet connection.',
    [ErrorCode.NETWORK_SERVER_ERROR]: 'Server error occurred. Please try again later.',
    
    [ErrorCode.COURSE_ALREADY_ENROLLED]: 'You are already enrolled in this course.',
    [ErrorCode.COURSE_FULL]: 'This course is full. Please try another course.',
    [ErrorCode.SESSION_ALREADY_STARTED]: 'This session has already started.',
    [ErrorCode.ASSIGNMENT_SUBMISSION_CLOSED]: 'Assignment submission is closed.',
    
    [ErrorCode.SYSTEM_MAINTENANCE]: 'System is under maintenance. Please try again later.',
    [ErrorCode.SYSTEM_OVERLOAD]: 'System is currently overloaded. Please try again later.',
    [ErrorCode.SYSTEM_CONFIGURATION_ERROR]: 'System configuration error. Please contact support.',
    
    [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.'
  };

  return messages[error.code] || messages[ErrorCode.UNKNOWN_ERROR];
};

// Error recovery strategies
export const getErrorRecoveryStrategy = (error: AppError): string => {
  const strategies: Record<string, string> = {
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Please check your credentials and try again.',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Please log in again to continue.',
    [ErrorCode.NETWORK_TIMEOUT]: 'Please check your internet connection and try again.',
    [ErrorCode.FILE_TOO_LARGE]: 'Please compress your file or choose a smaller one.',
    [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Please complete all required fields and try again.',
    [ErrorCode.DB_CONNECTION_FAILED]: 'Please wait a moment and try again.',
    [ErrorCode.SYSTEM_MAINTENANCE]: 'Please check back later when maintenance is complete.'
  };

  return strategies[error.code] || 'Please try again or contact support if the problem persists.';
};

// Global error handler for unhandled errors
export const setupGlobalErrorHandling = (): void => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const context: ErrorContext = {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    const error = ErrorFactory.create(
      ErrorCode.UNKNOWN_ERROR,
      'Unhandled promise rejection',
      event.reason?.toString(),
      context
    );

    console.error('Unhandled Promise Rejection:', error);
    event.preventDefault();
  });

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    const context: ErrorContext = {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      params: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    };

    const error = ErrorFactory.create(
      ErrorCode.SYSTEM_CONFIGURATION_ERROR,
      'Unhandled error',
      event.message,
      context
    );

    console.error('Unhandled Error:', error);
  });
};

// Export default error handler
export const errorHandler = {
  create: ErrorFactory.create,
  handleApiError: ApiErrorHandler.handleError,
  handleApiSuccess: ApiErrorHandler.handleSuccess,
  handleBoundaryError: ErrorBoundaryHandler.handleError,
  getUserFriendlyMessage,
  getErrorRecoveryStrategy,
  setupGlobalErrorHandling
};

export default errorHandler;
