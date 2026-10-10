import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(), // Buffer en memoria: se procesa y se sube a MinIO
      limits: { fileSize: 52428800 }, // 50MB
    }),
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
