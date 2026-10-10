import { PrismaClient, Rol, EstadoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed — Datos iniciales del sistema SIGD.
 *
 * Crea:
 *  - 1 Sede principal
 *  - 1 Pasillo, 1 Estante, 1 Caja
 *  - 6 Usuarios (uno por cada rol)
 *  - 1 Serie y 1 Subserie de ejemplo
 *
 * Ejecutar: npx ts-node prisma/seed.ts
 * O via npm: npm run prisma:seed
 */
async function main() {
  console.log('🌱 Iniciando seed del SIGD...');

  // ── Sede ──────────────────────────────────────────────────
  const sede = await prisma.sede.upsert({
    where: { codigo: 'SEDE-PRINCIPAL' },
    update: {},
    create: {
      nombre: 'Sede Principal',
      codigo: 'SEDE-PRINCIPAL',
      direccion: 'Carrera 7 # 32-16',
      ciudad: 'Bogotá',
      telefono: '+57 1 234 5678',
      email: 'archivo@empresa.com',
    },
  });
  console.log(`✅ Sede: ${sede.nombre}`);

  // ── Estructura física ─────────────────────────────────────
  const pasillo = await prisma.pasillo.upsert({
    where: { codigo_sedeId: { codigo: 'PASILLO-A', sedeId: sede.id } },
    update: {},
    create: {
      nombre: 'Pasillo A',
      codigo: 'PASILLO-A',
      sedeId: sede.id,
    },
  });

  const estante = await prisma.estante.upsert({
    where: { id: 'estante-seed-1' },
    update: {},
    create: {
      id: 'estante-seed-1',
      nombre: 'Estante A-1',
      codigo: 'EST-A-1',
      fila: 1,
      columna: 1,
      pasilloId: pasillo.id,
    },
  });

  const caja = await prisma.caja.upsert({
    where: { id: 'caja-seed-1' },
    update: {},
    create: {
      id: 'caja-seed-1',
      numero: 'CAJA-001',
      capacidadMaxima: 10,
      estanteId: estante.id,
    },
  });
  console.log(`✅ Infraestructura: ${pasillo.nombre} → ${estante.nombre} → ${caja.numero}`);

  // ── Usuarios (uno por cada rol) ───────────────────────────
  const SALT_ROUNDS = 12;
  const defaultPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);

  const usuarios = [
    { nombre: 'Super', apellido: 'Admin', email: 'admin@sigd.com', rol: Rol.ADMINISTRADOR },
    { nombre: 'María', apellido: 'García', email: 'auxiliar@sigd.com', rol: Rol.AUXILIAR_ARCHIVO },
    { nombre: 'Carlos', apellido: 'Ramírez', email: 'gerencia@sigd.com', rol: Rol.GERENCIA },
    { nombre: 'Ana', apellido: 'Martínez', email: 'auditor@sigd.com', rol: Rol.AUDITOR },
    { nombre: 'Luis', apellido: 'Pérez', email: 'consulta@sigd.com', rol: Rol.CONSULTA },
    { nombre: 'Invitado', apellido: 'Test', email: 'invitado@sigd.com', rol: Rol.INVITADO },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        passwordHash: defaultPassword,
        estado: EstadoUsuario.ACTIVO,
        sedeId: sede.id,
      },
    });
    console.log(`✅ Usuario: ${u.email} (${u.rol})`);
  }

  // ── Series documentales ───────────────────────────────────
  const serie = await prisma.serie.upsert({
    where: { codigo: '100' },
    update: {},
    create: {
      codigo: '100',
      nombre: 'Gestión Documental',
    },
  });

  await prisma.subserie.upsert({
    where: { codigo_serieId: { codigo: '100.01', serieId: serie.id } },
    update: {},
    create: {
      codigo: '100.01',
      nombre: 'Expedientes de Clientes',
      serieId: serie.id,
    },
  });
  console.log(`✅ TRD: ${serie.nombre}`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('═══════════════════════════════════════════════');
  console.log('Credenciales de acceso (contraseña: Admin123!):');
  console.log('  👑 admin@sigd.com      → ADMINISTRADOR');
  console.log('  📁 auxiliar@sigd.com   → AUXILIAR_ARCHIVO');
  console.log('  📊 gerencia@sigd.com   → GERENCIA');
  console.log('  🔍 auditor@sigd.com    → AUDITOR');
  console.log('  👁️  consulta@sigd.com   → CONSULTA');
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
