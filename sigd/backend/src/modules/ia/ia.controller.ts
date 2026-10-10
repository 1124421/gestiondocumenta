import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IaService } from './ia.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ClasificarDto { @ApiProperty() @IsString() texto: string; }

@ApiTags('ia')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('clasificar')
  @ApiOperation({ summary: 'Clasificar tipo documental a partir de texto OCR' })
  clasificar(@Body() dto: ClasificarDto) {
    return this.iaService.clasificarDocumento(dto.texto);
  }

  @Get('expediente/:id/resumen')
  @ApiOperation({ summary: 'Generar resumen ejecutivo del expediente con IA' })
  resumen(@Param('id') id: string) {
    return this.iaService.resumirExpediente(id);
  }
}
