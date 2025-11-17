/**
 * API Utilities for B2B Business Accounts
 * Provides reusable helpers for API routes, authentication, and responses
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Authenticated business user context
 */
export interface BusinessUserContext {
  userId: string;
  businessId: string;
  businessAccountId: string;
  role: 'owner' | 'staff';
  businessName: string;
  businessEmail: string;
}

/**
 * Get authenticated business user from session
 * @returns Business user context or null if not authenticated
 * @example
 * const user = await getAuthenticatedBusinessUser();
 * if (!user) return apiError('Unauthorized', 401);
 */
export async function getAuthenticatedBusinessUser(): Promise<BusinessUserContext | null> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Get business user details
  const { data: businessUser, error: businessError } = await supabase
    .from('business_users')
    .select(
      `
      id,
      business_account_id,
      role,
      business_accounts (
        id,
        business_name,
        business_email
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (businessError || !businessUser) {
    return null;
  }

  return {
    userId: user.id,
    businessId: businessUser.id,
    businessAccountId: businessUser.business_account_id,
    role: businessUser.role,
    businessName: businessUser.business_accounts.business_name,
    businessEmail: businessUser.business_accounts.business_email,
  };
}

/**
 * Get business account by subdomain
 * @param subdomain - Business subdomain
 * @returns Business account or null if not found
 */
export async function getBusinessBySubdomain(subdomain: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get business account by custom domain
 * @param customDomain - Custom domain
 * @returns Business account or null if not found
 */
export async function getBusinessByCustomDomain(customDomain: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('custom_domain', customDomain)
    .eq('custom_domain_verified', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create success API response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Create error API response
 * @param error - Error message
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error
 */
export function apiError(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ error }, { status });
}

/**
 * Wrap async API handler with error handling
 * @param handler - Async handler function
 * @returns Wrapped handler with try-catch
 * @example
 * export const POST = withErrorHandling(async (request) => {
 *   // Your logic here
 *   return apiSuccess(result);
 * });
 */
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        return apiError(error.message, 500);
      }

      return apiError('Internal server error', 500);
    }
  };
}

/**
 * Require authenticated business user in API route
 * @param handler - Handler function that requires authentication
 * @returns Wrapped handler with authentication check
 * @example
 * export const GET = requireBusinessAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated business user
 *   return apiSuccess({ businessId: user.businessAccountId });
 * });
 */
export function requireBusinessAuth(
  handler: (request: Request, user: BusinessUserContext, context?: any) => Promise<NextResponse>
) {
  return withErrorHandling(async (request: Request, context?: any) => {
    const user = await getAuthenticatedBusinessUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    return handler(request, user, context);
  });
}

/**
 * Check if user has owner role
 * @param user - Business user context
 * @returns true if user is owner
 */
export function isBusinessOwner(user: BusinessUserContext): boolean {
  return user.role === 'owner';
}

/**
 * Require owner role in API route
 * @param handler - Handler function that requires owner role
 * @returns Wrapped handler with owner check
 */
export function requireBusinessOwner(
  handler: (request: Request, user: BusinessUserContext, context?: any) => Promise<NextResponse>
) {
  return requireBusinessAuth(async (request, user, context) => {
    if (!isBusinessOwner(user)) {
      return apiError('Forbidden: Owner role required', 403);
    }

    return handler(request, user, context);
  });
}

/**
 * Parse and validate request JSON body
 * @param request - Request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data or null if invalid
 * @example
 * const body = await parseRequestBody(request, bookingCreationSchema);
 * if (!body) return apiError('Invalid request body', 400);
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: { parse: (data: any) => T }
): Promise<T | null> {
  try {
    const json = await request.json();
    return schema.parse(json);
  } catch (error) {
    return null;
  }
}

/**
 * Get pagination parameters from URL
 * @param url - URL object
 * @returns Pagination params { page, limit }
 */
export function getPaginationParams(url: URL): { page: number; limit: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

  return { page, limit };
}

/**
 * Get pagination offset for database query
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Offset for database query
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Check if business account is active
 * @param businessId - Business account ID
 * @returns true if active
 */
export async function isBusinessActive(businessId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_accounts')
    .select('status')
    .eq('id', businessId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.status === 'active';
}
