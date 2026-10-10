import {
  Controller, Get, Post, Delete, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SubirDocumentoDto {
  @ApiProperty() @IsUUID() expedienteId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoDocumental?: string;

  // Resultado del OCR mostrado al usuario (lo que se ve es lo que se guarda)
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2_000_000) textoOcr?: string;
  /** JSON string: string[] */
  @ApiPropertyOptional() @IsOptional() @IsString() palabrasClave?: string;
  /** JSON string: objeto con entidades y clasificación */
  @ApiPropertyOptional() @IsOptional() @IsString() metadatosIA?: string;
  /** Fecha del documento (ISO yyyy-mm-dd) */
  @ApiPropertyOptional() @IsOptional() @IsString() fechaDocumento?: string;
}

@ApiTags('documentos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('expediente/:expedienteId')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Listar documentos de un expediente' })
  findByExpediente(
    @Param('expedienteId') expedienteId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.documentosService.findByExpediente(expedienteId, +page, +limit);
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Obtener metadatos de un documento' })
  findOne(@Param('id') id: string) {
    return this.documentosService.findOne(id);
  }

  @Get(':id/descarga')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Obtener URL de descarga del documento (15 min de vigencia)' })
  getUrlDescarga(@Param('id') id: string) {
    return this.documentosService.generarUrlDescarga(id);
  }

  @Post('subir')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo a subir con metadatos y resultado del OCR',
    schema: {
      type: 'object',
      properties: {
        archivo: { type: 'string', format: 'binary' },
        expedienteId: { type: 'string' },
        nombre: { type: 'string' },
        tipoDocumental: { type: 'string' },
        textoOcr: { type: 'string' },
        palabrasClave: { type: 'string', description: 'JSON: string[]' },
        metadatosIA: { type: 'string', description: 'JSON: objeto' },
        fechaDocumento: { type: 'string', description: 'yyyy-mm-dd' },
      },
    },
  })
  @ApiOperation({ summary: 'Subir documento al expediente (guarda el archivo en MinIO y sus metadatos en BD)' })
  async subir(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SubirDocumentoDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo (campo "archivo").');

    // Multer decodifica el nombre como latin1: lo convertimos a UTF-8 (tildes, ñ)
    const nombreOriginal = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const palabrasClave = this.parseJson<string[]>(dto.palabrasClave, 'palabrasClave');
    const metadatosIA = this.parseJson<Record<string, any>>(dto.metadatosIA, 'metadatosIA');

    let fechaDocumento: Date | undefined;
    if (dto.fechaDocumento) {
      const f = new Date(dto.fechaDocumento);
      if (Number.isNaN(f.getTime())) throw new BadRequestException('fechaDocumento no es una fecha válida (yyyy-mm-dd).');
      fechaDocumento = f;
    }

    return this.documentosService.registrarDocumento({
      nombre: dto.nombre || nombreOriginal,
      nombreOriginal,
      expedienteId: dto.expedienteId,
      subidoPorId: userId,
      tamanioBytes: file.size,
      mimeType: file.mimetype,
      fileBuffer: file.buffer,
      textoOcr: dto.textoOcr,
      palabrasClave: Array.isArray(palabrasClave) ? palabrasClave.map(String).slice(0, 100) : undefined,
      metadatosIA: metadatosIA && typeof metadatosIA === 'object' ? metadatosIA : undefined,
      tipoDocumental: dto.tipoDocumental,
      fechaDocumento,
    });
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar documento (soft delete, solo ADMINISTRADOR)' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documentosService.softDelete(id, userId);
  }

  private parseJson<T>(valor: string | undefined, campo: string): T | undefined {
    if (!valor) return undefined;
    try {
      return JSON.parse(valor) as T;
    } catch {
      throw new BadRequestException(`El campo "${campo}" debe ser un JSON válido.`);
    }
  }
}
