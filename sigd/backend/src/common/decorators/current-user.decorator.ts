import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '@prisma/client';

/**
 * Decorador @CurrentUser — Extrae el usuario autenticado del request.
 * El usuario es inyectado por JwtStrategy luego de validar el token.
 *
 * Uso:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: Usuario) {
 *     return user;
 *   }
 *
 *   // Solo el ID:
 *   @Get('me')
 *   getProfile(@CurrentUser('id') userId: string) {
 *     return userId;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof Usuario | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as Usuario;

    return data ? user?.[data] : user;
  },
);
