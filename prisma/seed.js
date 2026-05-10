import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Configuración para simular __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Hash una contraseña con PBKDF2
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha256')
    .toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // Limpiar usuarios existentes
  await prisma.user.deleteMany({});
  console.log('✓ Tabla users limpiada');

  const defaultPassword = 'Test123456!';

  // Crear usuarios demo
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashPassword(defaultPassword),
      role: 'admin',
      estado: true,
    },
  });
  console.log('✓ Usuario admin creado:', adminUser.username);

  const regularUser = await prisma.user.create({
    data: {
      username: 'user01',
      passwordHash: hashPassword(defaultPassword),
      role: 'user',
      estado: true,
    },
  });
  console.log('✓ Usuario regular creado:', regularUser.username);

  console.log('\n✅ Seed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });