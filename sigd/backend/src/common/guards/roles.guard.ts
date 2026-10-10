import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * RolesGuard — Verifica que el usuario tiene el rol necesario para acceder al endpoint.
 *
 * Flujo:
 *  1. Si el endpoint es @Public() → permite el acceso
 *  2. Si no tiene @Roles() → permite acceso (solo requiere JWT válido)
 *  3. Si el usuario es ADMINISTRADOR → siempre tiene acceso
 *  4. Si el rol del usuario está en la lista → permite acceso
 *  5. Si no → lanza ForbiddenException
 *
 * IMPORTANTE: Debe ejecutarse DESPUÉS de JwtAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Si el endpoint es público, no aplica restricción de roles
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Leer los roles requeridos del decorador @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles definidos, solo se requiere estar autenticado
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // El ADMINISTRADOR siempre tiene acceso completo
    if (user.rol === Rol.ADMINISTRADOR) return true;

    // Verificar si el rol del usuario está en los roles requeridos
    const hasRole = requiredRoles.includes(user.rol);
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
