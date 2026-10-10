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
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, GetClientesDto } from './dto/cliente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('clientes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // GET /api/v1/clientes
  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR, Rol.CONSULTA)
  @ApiOperation({
    summary: 'Listar clientes con búsqueda multi-campo',
    description:
      'Busca por nombre, cédula, código interno, contrato, teléfono, email, palabras clave. Resultados en menos de 2 segundos.',
  })
  findAll(@Query() query: GetClientesDto) {
    return this.clientesService.findAll(query);
  }

  // GET /api/v1/clientes/:id
  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Obtener cliente con toda su información de ubicación' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  // POST /api/v1/clientes
  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear cliente y su expediente',
    description: 'Crea el cliente y genera automáticamente su expediente (EXP-AÑO-XXXXX)',
  })
  @ApiResponse({ status: 201, description: 'Cliente y expediente creados' })
  @ApiResponse({ status: 409, description: 'Ya existe un cliente con esa identificación' })
  create(
    @Body() dto: CreateClienteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientesService.create(dto, userId);
  }

  // PATCH /api/v1/clientes/:id
  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
  @ApiOperation({ summary: 'Actualizar datos del cliente' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientesService.update(id, dto, userId);
  }

  // DELETE /api/v1/clientes/:id
  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar cliente (soft delete, solo ADMINISTRADOR)' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientesService.softDelete(id, userId);
  }

  // GET /api/v1/clientes/:id/documentos
  @Get(':id/documentos')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Obtener documentos digitales del expediente del cliente' })
  getDocumentos(@Param('id') id: string) {
    return this.clientesService.getDocumentos(id);
  }

  // GET /api/v1/clientes/:id/prestamos
  @Get(':id/prestamos')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR)
  @ApiOperation({ summary: 'Historial de préstamos del expediente físico' })
  getPrestamos(@Param('id') id: string) {
    return this.clientesService.getPrestamos(id);
  }

  // GET /api/v1/clientes/:id/trazabilidad
  @Get(':id/trazabilidad')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Historial completo de auditoría del cliente (solo ADMIN y AUDITOR)' })
  getTrazabilidad(@Param('id') id: string) {
    return this.clientesService.getTrazabilidad(id);
  }
}
