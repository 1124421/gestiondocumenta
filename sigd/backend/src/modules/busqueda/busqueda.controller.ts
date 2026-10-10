import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusquedaService } from './busqueda.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('busqueda')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('busqueda')
export class BusquedaController {
  constructor(private readonly busquedaService: BusquedaService) {}

  @Get()
  @ApiOperation({
    summary: 'Búsqueda global inteligente',
    description:
      'Busca en clientes, expedientes y documentos. Soporta: "Contrato Juan", "1234567890", "EXP-2024-00001"',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  buscarGlobal(
    @Query('q') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.busquedaService.buscarGlobal(query, +page, +limit);
  }

  @Get('clientes')
  @ApiOperation({ summary: 'Autocompletado de clientes (typeahead)' })
  @ApiQuery({ name: 'q', required: true })
  buscarClientes(@Query('q') query: string, @Query('limit') limit = 10) {
    return this.busquedaService.buscarClientes(query, +limit);
  }

  @Get('expediente/:numero')
  @ApiOperation({ summary: 'Buscar expediente por número exacto (EXP-2024-00001)' })
  buscarPorExpediente(@Param('numero') numero: string) {
    return this.busquedaService.buscarPorExpediente(numero);
  }
}
