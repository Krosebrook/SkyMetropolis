
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_PARSING_ERROR = 'AI_PARSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  GAME_LOGIC_ERROR = 'GAME_LOGIC_ERROR',
}

export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.isOperational = true; // Trusted error
    
    // Error.captureStackTrace is V8 specific (Node/Chrome) and not in standard Error type
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context);
    this.name = 'ValidationError';
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.AI_SERVICE_ERROR, 503, context);
    this.name = 'AIServiceError';
  }
}
