import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador @Public — Marca un endpoint como público (sin JWT requerido).
 *
 * Uso:
 *   @Public()
 *   @Post('login')
 *   login(@Body() dto: LoginDto) {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
