import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyMfaDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

/**
 * AuthController — Endpoints de autenticación del sistema SIGD.
 *
 * Todos los endpoints de auth (excepto los protegidos) son @Public().
 * Rate limiting especial: 5 intentos de login por IP cada 15 minutos.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/login
  // ──────────────────────────────────────────────────────────
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 intentos en 15 min
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario y devuelve access token + refresh token',
  })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos de login' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const usuario = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    // Si MFA está habilitado y no se proporcionó código
    if (usuario.mfaHabilitado) {
      if (!loginDto.mfaCode) {
        return {
          requiresMfa: true,
          message: 'Se requiere código MFA',
        };
      }

      const mfaValido = await this.authService.verifyMfa(
        usuario.id,
        loginDto.mfaCode,
      );

      if (!mfaValido) {
        return { statusCode: 401, message: 'Código MFA inválido' };
      }
    }

    return this.authService.login(
      usuario,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/refresh
  // ──────────────────────────────────────────────────────────
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar access token',
    description: 'Genera un nuevo access token usando el refresh token',
  })
  @ApiResponse({ status: 200, description: 'Token refrescado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/logout
  // ──────────────────────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Invalida el refresh token' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@CurrentUser('id') userId: string, @Req() req: Request) {
    await this.authService.logout(userId, req.ip);
    return { message: 'Sesión cerrada exitosamente' };
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/auth/me
  // ──────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/mfa/setup
  // ──────────────────────────────────────────────────────────
  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Configurar MFA',
    description: 'Genera secreto TOTP y QR code para Google Authenticator',
  })
  async setupMfa(@CurrentUser('id') userId: string) {
    return this.authService.setupMfa(userId);
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/mfa/verify
  // ──────────────────────────────────────────────────────────
  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verificar código MFA (TOTP)' })
  async verifyMfa(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyMfaDto,
  ) {
    const valido = await this.authService.verifyMfa(userId, dto.codigo);
    return { valido, message: valido ? 'Código MFA válido' : 'Código MFA inválido' };
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/forgot-password
  // ──────────────────────────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 intentos por hora
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Siempre responder igual por seguridad
    return {
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
    };
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/reset-password
  // ──────────────────────────────────────────────────────────
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token del email' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Contraseña restablecida exitosamente' };
  }

  // ──────────────────────────────────────────────────────────
  // PATCH /api/v1/auth/change-password
  // ──────────────────────────────────────────────────────────
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cambiar contraseña (usuario autenticado)' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Contraseña actualizada exitosamente' };
  }
}
