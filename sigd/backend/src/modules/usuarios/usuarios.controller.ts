import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto, UpdateUsuarioDto, GetUsuariosDto } from './dto/usuario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // GET /api/v1/usuarios
  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.GERENCIA, Rol.AUDITOR)
  @ApiOperation({ summary: 'Listar usuarios del sistema (paginado)' })
  findAll(@Query() query: GetUsuariosDto) {
    return this.usuariosService.findAll(query);
  }

  // GET /api/v1/usuarios/me — Perfil del usuario autenticado
  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usuariosService.findOne(userId);
  }

  // GET /api/v1/usuarios/:id
  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  // POST /api/v1/usuarios
  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está en uso' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  // PATCH /api/v1/usuarios/:id
  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  // DELETE /api/v1/usuarios/:id
  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado' })
  remove(@Param('id') id: string) {
    return this.usuariosService.softDelete(id);
  }

  // GET /api/v1/usuarios/:id/actividad
  @Get(':id/actividad')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Historial de actividad del usuario' })
  getActividad(@Param('id') id: string) {
    return this.usuariosService.getActividad(id);
  }
}
