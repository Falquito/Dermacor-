-- AlterTable
ALTER TABLE "Consultas" ADD COLUMN     "idCoseguro" INTEGER;

-- AlterTable
ALTER TABLE "ObraSocial" ADD COLUMN     "admiteCoseguro" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Coseguro" (
    "idCoseguro" SERIAL NOT NULL,
    "nombreCoseguro" TEXT NOT NULL,
    "estadoCoseguro" BOOLEAN NOT NULL DEFAULT true,
    "fechaHoraCoseguro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coseguro_pkey" PRIMARY KEY ("idCoseguro")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coseguro_nombreCoseguro_key" ON "Coseguro"("nombreCoseguro");

-- CreateIndex
CREATE INDEX "Consultas_idCoseguro_idx" ON "Consultas"("idCoseguro");

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_idCoseguro_fkey" FOREIGN KEY ("idCoseguro") REFERENCES "Coseguro"("idCoseguro") ON DELETE RESTRICT ON UPDATE CASCADE;
