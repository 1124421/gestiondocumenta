-- CreateEnum
CREATE TYPE "TipoProceso" AS ENUM ('ORDINARIO', 'DEVOLUCION', 'LIQUIDACION', 'COBRO_JURIDICO', 'GARANTIA_SERVICIO', 'INSOLVENCIA_LEY_1116', 'INSOLVENCIA_PERSONA_LEY_1564', 'INSOLVENCIA_PERSONA_LEY_2445');

-- AlterTable
ALTER TABLE "cajas" ADD COLUMN     "etiquetaFrontal" TEXT,
ADD COLUMN     "etiquetaLateral" TEXT,
ADD COLUMN     "normativaAplicable" TEXT,
ADD COLUMN     "tipoProceso" "TipoProceso";

-- AlterTable
ALTER TABLE "expedientes" ADD COLUMN     "normativaAplicable" TEXT,
ADD COLUMN     "tipoProceso" "TipoProceso";

-- CreateIndex
CREATE INDEX "cajas_tipoProceso_idx" ON "cajas"("tipoProceso");
