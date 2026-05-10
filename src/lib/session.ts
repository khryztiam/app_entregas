/**
 * Utilidades de sesión segura
 * 
 * Proporciona funciones para:
 * - Comparación timing-safe de tokens
 * - Validación de sesión
 * - Manejo seguro de datos de usuario
 */

import { createHash } from 'crypto';

/**
 * Comparación timing-safe entre dos strings
 * Previene ataques de timing contra tokens
 * 
 * @param a - Primer string
 * @param b - Segundo string
 * @returns true si son iguales
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  // Convertir a Buffer para comparación timing-safe
  const bufferA = Buffer.from(a, 'utf-8');
  const bufferB = Buffer.from(b, 'utf-8');

  // Si tienen diferente longitud, no pueden ser iguales
  if (bufferA.length !== bufferB.length) {
    return false;
  }

  // crypto.timingSafeEqual lanza error si lengths no coinciden
  // Por eso ya verificamos arriba
  try {
    return require('crypto').timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

/**
 * Hashear un string para almacenamiento seguro
 * NO es para hashing de contraseñas (usar bcrypt para eso)
 * Es para generar hashes determinísticos de tokens/sesiones
 * 
 * @param input - String a hashear
 * @returns Hash SHA256
 */
export function hashForSession(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Validar estructura básica de JWT
 * 
 * @param token - Token a validar
 * @returns true si el token tiene estructura válida
 */
export function isValidJWTStructure(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT tiene 3 partes separadas por puntos
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Cada parte debe ser válido base64
  try {
    for (const part of parts) {
      // Agregar padding si falta
      const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
      Buffer.from(padded, 'base64');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Información segura de sesión (sin exponer datos sensibles)
 */
export interface SafeSessionInfo {
  isAuthenticated: boolean;
  userId?: string;
  role?: string;
  email?: string;
  timestamp: number;
}

/**
 * Crear objeto de sesión seguro para respuesta
 */
export function createSafeSessionInfo(
  isAuthenticated: boolean,
  userId?: string,
  role?: string,
  email?: string
): SafeSessionInfo {
  return {
    isAuthenticated,
    ...(isAuthenticated && { userId, role, email }),
    timestamp: Date.now(),
  };
}

/**
 * Crear un JWT token para la sesión
 */
function createSessionToken(userId: string): string {
  const secret = process.env.AUTH_SECRET || '';
  if (!secret) throw new Error('AUTH_SECRET no está configurado');

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + 7 * 24 * 60 * 60, // 7 días
    })
  ).toString('base64url');

  const { createHmac } = require('crypto');
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Leer el token de sesión desde las cookies del request
 */
export function readSessionToken(req: any): string | null {
  if (!req || !req.headers || !req.headers.cookie) return null;
  const cookies = req.headers.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name.trim() === 'session') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Verificar y decodificar un JWT token
 */
export function verifySessionToken(token: string | null): { sub: string; iat: number; exp: number } | null {
  if (!token) return null;

  try {
    const secret = process.env.AUTH_SECRET || '';
    if (!secret) throw new Error('AUTH_SECRET no está configurado');

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verificar firma
    const { createHmac } = require('crypto');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (!timingSafeEqual(signatureB64, expectedSignature)) {
      return null;
    }

    // Decodificar payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

    // Verificar expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

/**
 * Establecer cookie de sesión en la respuesta
 */
export function setSessionCookie(res: any, user: any): void {
  const token = createSessionToken(user.id);
  
  // Configurar cookie para desarrollo y producción
  // En desarrollo: SameSite=None es muy restrictivo. Lax permite más casos
  // HttpOnly previene acceso desde JavaScript (importante para seguridad)
  const isDev = process.env.NODE_ENV !== 'production';
  const sameSite = isDev ? 'Lax' : 'Strict'; // Más permisivo en desarrollo
  const secure = isDev ? '' : '; Secure'; // Secure solo en HTTPS (producción)
  
  const cookieValue = `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}${secure}; Max-Age=${7 * 24 * 60 * 60}`;
  res.setHeader('Set-Cookie', cookieValue);
}
