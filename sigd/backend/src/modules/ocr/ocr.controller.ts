import {
  Controller, Post, UseGuards, UseInterceptors, UploadedFile,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { memoryStorage } from 'multer';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ocr')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('procesar')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 52428800 }, // 50MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Procesar documento con OCR: texto real, entidades y clasificación TRD' })
  async procesarOcr(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo (campo "archivo").');
    return this.ocrService.procesar(file.buffer, file.mimetype);
  }
}
