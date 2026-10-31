import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ServiceConfigurationError } from '@/lib/firebase/admin';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Invalid request payload', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Insufficient permissions for this action') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Requested resource was not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class QuotaExceededError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(402, 'QUOTA_EXCEEDED', message, details);
  }
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...((data && typeof data === 'object' ? data : { data }) as object) }, { status });
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ServiceConfigurationError) {
    return NextResponse.json(
      {
        ok: false,
        code: err.code,
        missingService: err.missingService,
        error: err.message,
      },
      { status: 503 }
    );
  }

  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        code: err.code,
        error: err.message,
        details: err.details,
      },
      { status: err.statusCode }
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: err.issues[0]?.message || 'Invalid request payload',
        details: err.issues,
      },
      { status: 422 }
    );
  }

  console.error('[XPO API Error]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return NextResponse.json(
    {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: message,
    },
    { status: 500 }
  );
}
