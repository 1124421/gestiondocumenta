import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorador @Roles — Define qué roles pueden acceder a un endpoint.
 *
 * Uso:
 *   @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
 *   @Get()
 *   findAll() {}
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
