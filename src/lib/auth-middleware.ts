import { NextRequest } from 'next/server';
import { verifyAccessToken, JWTPayload } from './jwt';

/**
 * Extract JWT token from request headers
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Verify JWT token and return user payload
 */
export function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const token = extractToken(request);
    if (!token) {
      return null;
    }
    return verifyAccessToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: JWTPayload, requiredRole: string | string[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  return user.role === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: JWTPayload): boolean {
  return user.role === 'super_admin' || user.role === 'admin';
}

/**
 * Check if user is professor
 */
export function isProfessor(user: JWTPayload): boolean {
  return user.role === 'professor';
}

/**
 * Check if user is student
 */
export function isStudent(user: JWTPayload): boolean {
  return user.role === 'student';
}

/**
 * Create authentication error response
 */
export function createAuthError(message: string = 'Unauthorized', status: number = 401) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message,
      status: status 
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create role-based access error response
 */
export function createRoleError(requiredRole: string | string[]) {
  const roles = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
  return createAuthError(`Access denied. Required role: ${roles}`, 403);
}
