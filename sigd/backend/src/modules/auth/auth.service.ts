import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AccionAudit, EstadoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { randomBytes, createHash } from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    mfaHabilitado: boolean;
  };
}

/**
 * AuthService — Lógica de negocio de autenticación y autorización.
 *
 * Responsabilidades:
 *  - Validar credenciales (email + password)
 *  - Generar y refrescar tokens JWT
 *  - Gestionar MFA (TOTP/Google Authenticator)
 *  - Recuperación y reset de contraseña
 *  - Control de intentos fallidos y bloqueo de cuenta
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // VALIDAR USUARIO
  // ──────────────────────────────────────────────────────────────

  /**
   * Valida las credenciales del usuario.
   * Maneja bloqueo por intentos fallidos.
   * @returns Usuario si válido, lanza UnauthorizedException si no.
   */
  async validateUser(email: string, password: string): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario) {
      // No revelar si el email existe o no (seguridad)
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si la cuenta está bloqueada
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intenta en ${minutosRestantes} minutos`,
      );
    }

    // Verificar estado de la cuenta
    if (usuario.estado === EstadoUsuario.INACTIVO) {
      throw new UnauthorizedException('Cuenta inactiva');
    }

    if (usuario.estado === EstadoUsuario.BLOQUEADO) {
      throw new UnauthorizedException('Cuenta bloqueada permanentemente. Contacta al administrador');
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValida) {
      await this.registrarIntentoFallido(usuario.id);
      await this.registrarAuditLog(AccionAudit.LOGIN_FALLIDO, usuario.id, null, email);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Reset intentos fallidos al lograr login exitoso
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoAcceso: new Date(),
      },
    });

    return usuario;
  }

  // ──────────────────────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────────────────────

  /**
   * Genera los tokens de acceso y refresco para el usuario.
   */
  async login(usuario: any, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const tokens = await this.generarTokens(usuario.id, usuario.email, usuario.rol);

    // Guardar refresh token hasheado en BD
    const refreshTokenHash = this.hashToken(tokens.refreshToken);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { refreshTokenHash },
    });

    // Registrar login exitoso en trazabilidad
    await this.registrarAuditLog(
      AccionAudit.LOGIN,
      usuario.id,
      null,
      `Login exitoso`,
      ipAddress,
      userAgent,
    );

    this.logger.log(`Login exitoso: ${usuario.email} (${usuario.rol})`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        mfaHabilitado: usuario.mfaHabilitado,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────────────────────────────

  /**
   * Genera un nuevo access token usando el refresh token.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: any;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || !usuario.refreshTokenHash) {
      throw new UnauthorizedException('Sesión no válida');
    }

    // Verificar que el refresh token coincide con el almacenado
    const tokenHash = this.hashToken(refreshToken);
    if (tokenHash !== usuario.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token no reconocido');
    }

    // Generar nuevo access token
    const accessToken = this.jwtService.sign(
      { sub: usuario.id, email: usuario.email, rol: usuario.rol },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      },
    );

    return { accessToken };
  }

  // ──────────────────────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────────────────────

  async logout(usuarioId: string, ipAddress?: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refreshTokenHash: null },
    });

    await this.registrarAuditLog(AccionAudit.LOGOUT, usuarioId, null, 'Logout', ipAddress);
    this.logger.log(`Logout: userId=${usuarioId}`);
  }

  // ──────────────────────────────────────────────────────────────
  // MFA — Autenticación Multifactor (TOTP)
  // ──────────────────────────────────────────────────────────────

  /**
   * Configura MFA para el usuario.
   * Genera un secreto OTP y devuelve un QR code en base64.
   */
  async setupMfa(usuarioId: string): Promise<{ qrCode: string; secret: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true, nombre: true },
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const secret = authenticator.generateSecret();
    const appName = 'SIGD';
    const otpAuthUrl = authenticator.keyuri(usuario.email, appName, secret);

    // Guardar secreto (encriptado en producción)
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaSecret: secret },
    });

    // Generar QR code como data URL base64
    const qrCode = await qrcode.toDataURL(otpAuthUrl);

    await this.registrarAuditLog(AccionAudit.MFA_SETUP, usuarioId);

    return { qrCode, secret };
  }

  /**
   * Verifica un código OTP de 6 dígitos.
   */
  async verifyMfa(usuarioId: string, codigo: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { mfaSecret: true },
    });

    if (!usuario?.mfaSecret) {
      throw new BadRequestException('MFA no configurado para este usuario');
    }

    const esValido = authenticator.check(codigo, usuario.mfaSecret);

    if (esValido) {
      // Activar MFA si no estaba activado
      await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { mfaHabilitado: true },
      });
      await this.registrarAuditLog(AccionAudit.MFA_VERIFICAR, usuarioId);
    }

    return esValido;
  }

  // ──────────────────────────────────────────────────────────────
  // RECUPERACIÓN DE CONTRASEÑA
  // ──────────────────────────────────────────────────────────────

  /**
   * Genera un token de reset de contraseña y lo guarda en BD.
   * (El envío del email se delega a un EmailService externo)
   */
  async forgotPassword(email: string): Promise<{ token: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Por seguridad, no revelar si el email existe
    if (!usuario) {
      this.logger.warn(`Forgot password para email no existente: ${email}`);
      return { token: '' };
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hora

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetPasswordToken: this.hashToken(token),
        resetPasswordExpiry: expiry,
      },
    });

    this.logger.log(`Reset password token generado para: ${email}`);

    // En producción, aquí se envía el email vía EmailService
    return { token };
  }

  /**
   * Cambia la contraseña usando el token de reset.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiry: { gt: new Date() },
      },
    });

    if (!usuario) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        refreshTokenHash: null, // Invalidar todas las sesiones
      },
    });

    await this.registrarAuditLog(AccionAudit.RESET_PASSWORD, usuario.id);
    this.logger.log(`Contraseña reseteada para userId: ${usuario.id}`);
  }

  /**
   * Cambia contraseña verificando la actual.
   */
  async changePassword(
    usuarioId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    const passwordValida = await bcrypt.compare(currentPassword, usuario.passwordHash);
    if (!passwordValida) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { passwordHash, refreshTokenHash: null },
    });

    await this.registrarAuditLog(AccionAudit.CAMBIO_PASSWORD, usuarioId);
  }

  // ──────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ──────────────────────────────────────────────────────────────

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async generarTokens(
    userId: string,
    email: string,
    rol: string,
  ): Promise<TokenPair> {
    const payload = { sub: userId, email, rol };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async registrarIntentoFallido(usuarioId: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { intentosFallidos: true },
    });

    const intentos = (usuario?.intentosFallidos || 0) + 1;
    const data: any = { intentosFallidos: intentos };

    // Bloquear cuenta tras MAX_LOGIN_ATTEMPTS intentos fallidos
    if (intentos >= this.MAX_LOGIN_ATTEMPTS) {
      data.bloqueadoHasta = new Date(
        Date.now() + this.LOCK_DURATION_MINUTES * 60000,
      );
      this.logger.warn(`Cuenta bloqueada por intentos fallidos: userId=${usuarioId}`);
    }

    await this.prisma.usuario.update({ where: { id: usuarioId }, data });
  }

  private async registrarAuditLog(
    accion: AccionAudit,
    usuarioId: string,
    entidadId?: string,
    descripcion?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          accion,
          entidad: 'Usuario',
          entidadId: entidadId || usuarioId,
          descripcion: descripcion || accion,
          usuarioId,
          ipAddress,
          userAgent,
        },
      });
    } catch (err) {
      this.logger.warn('Error al registrar audit log de auth', err);
    }
  }
}
