import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [IaModule],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}
