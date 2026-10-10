import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JwtAuthGuard — Guard global de autenticación con JWT.
 *
 * Extiende el guard de Passport para JWT y añade soporte
 * para endpoints marcados con @Public().
 *
 * Aplicar globalmente en AppModule o en cada controlador:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *
 * Para endpoints públicos, usar el decorador @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Si el endpoint tiene @Public(), saltear la validación JWT
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }
}
