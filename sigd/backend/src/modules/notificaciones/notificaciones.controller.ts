import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notificaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener mis notificaciones' })
  getMis(
    @CurrentUser('id') userId: string,
    @Query('soloNoLeidas') soloNoLeidas = false,
  ) {
    return this.notificacionesService.getByUsuario(userId, Boolean(soloNoLeidas));
  }

  @Get('no-leidas/count')
  @ApiOperation({ summary: 'Contar notificaciones no leídas' })
  async countNoLeidas(@CurrentUser('id') userId: string) {
    const count = await this.notificacionesService.contarNoLeidas(userId);
    return { count };
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  marcarLeida(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificacionesService.marcarLeida(id, userId);
  }

  @Patch('leer-todas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  marcarTodasLeidas(@CurrentUser('id') userId: string) {
    return this.notificacionesService.marcarTodasLeidas(userId);
  }
}
