// Task API - Authentication utilities
// API key validation for task endpoints

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from './task-types';

/**
 * Validate API key from request headers
 * Returns null if valid, or an error response if invalid
 */
export function validateApiKey(request: NextRequest): NextResponse<ApiError> | null {
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' as const },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Get user ID from request (for activity logging)
 * Currently returns a system user ID; will be updated for auth integration
 */
export function getCurrentUserId(_request: NextRequest): string | null {
  // TODO: Extract from JWT when auth is added
  // For now, use a system user ID
  return null;
}
