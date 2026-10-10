import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string;    // userId
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

/**
 * JwtStrategy — Estrategia de Passport para validar tokens JWT.
 * Se ejecuta en cada request que requiere autenticación.
 *
 * Valida:
 *  1. Que el token esté en el header Authorization: Bearer <token>
 *  2. Que el token sea válido y no esté expirado (firmado con JWT_SECRET)
 *  3. Que el usuario exista y esté activo en la BD
 *
 * El resultado (usuario) se pone en request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        estado: true,
        mfaHabilitado: true,
        sedeId: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException(`Cuenta ${usuario.estado.toLowerCase()}`);
    }

    return usuario; // Se pone en request.user
  }
}
