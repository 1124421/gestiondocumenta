import { Module } from '@nestjs/common';
import { TrazabilidadController } from './trazabilidad.controller';
import { TrazabilidadService } from './trazabilidad.service';

@Module({
  controllers: [TrazabilidadController],
  providers: [TrazabilidadService],
  exports: [TrazabilidadService],
})
export class TrazabilidadModule {}
