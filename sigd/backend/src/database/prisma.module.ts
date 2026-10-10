import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — Módulo global para la conexión a la base de datos.
 * Al ser @Global(), PrismaService está disponible en todos los módulos
 * sin necesidad de importarlo en cada uno.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
