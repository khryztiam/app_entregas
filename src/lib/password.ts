/**
 * Utilidades para hash de contraseñas
 * Usa bcrypt para seguridad criptográfica
 */

import crypto from 'crypto';

/**
 * Hash una contraseña con bcrypt simple (solo para demo/desarrollo)
 * En producción, usar: npm install bcrypt
 * 
 * Para producción:
 * import bcrypt from 'bcrypt';
 * export async function hashPassword(password: string): Promise<string> {
 *   return bcrypt.hash(password, 10);
 * }
 */
export async function hashPassword(password: string): Promise<string> {
  // Nota: Esta es una implementación simplificada.
  // Para PRODUCCIÓN, usar bcrypt real:
  // return await import('bcrypt').then(m => m.hash(password, 10));

  // Por ahora, usamos PBKDF2 como alternativa
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha256')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verificar una contraseña contra su hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const [salt, storedHash] = hash.split(':');
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha256')
      .toString('hex');
    return passwordHash === storedHash;
  } catch (error) {
    console.error('[Password] Error verificando contraseña:', error);
    return false;
  }
}
