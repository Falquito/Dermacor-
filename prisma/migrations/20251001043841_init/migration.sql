-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('PROFESIONAL', 'MESA_ENTRADA', 'GERENTE');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PROGRAMADO', 'CONFIRMADO', 'EN_SALA_DE_ESPERA', 'COMPLETADO', 'CANCELADO', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "public"."TipoConsulta" AS ENUM ('OBRA_SOCIAL', 'PARTICULAR');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "apellido" TEXT,
    "dni" TEXT,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "especialidadId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."obras_sociales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "telefono" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "codigoPostal" TEXT,
    "contactoEmergenciaNombre" TEXT,
    "contactoEmergenciaTelefono" TEXT,
    "contactoEmergenciaRelacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL DEFAULT 30,
    "motivo" TEXT,
    "observaciones" TEXT,
    "estado" "public"."AppointmentStatus" NOT NULL DEFAULT 'PROGRAMADO',
    "obraSocialId" TEXT,
    "numeroAfiliado" TEXT,
    "tipoConsulta" "public"."TipoConsulta" NOT NULL DEFAULT 'OBRA_SOCIAL',
    "copago" DECIMAL(65,30),
    "autorizacion" TEXT,
    "pacienteId" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointment_cancellations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "cancelledById" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."especialidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deactivatedById" TEXT,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professional_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."diagnoses" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "principal" TEXT NOT NULL,
    "secundarios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescriptions" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "indicaciones" TEXT,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescription_diagnoses" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,

    CONSTRAINT "prescription_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_orders" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "estudio" TEXT NOT NULL,
    "indicaciones" TEXT,

    CONSTRAINT "study_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_medications" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dosis" TEXT,
    "frecuencia" TEXT,
    "viaAdministracion" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "indicaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_dni_key" ON "public"."users"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "public"."user_roles"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "obras_sociales_nombre_key" ON "public"."obras_sociales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "obras_sociales_codigo_key" ON "public"."obras_sociales"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "patients_dni_key" ON "public"."patients"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_cancellations_appointmentId_key" ON "public"."appointment_cancellations"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_nombre_key" ON "public"."especialidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "professional_schedules_userId_dayOfWeek_key" ON "public"."professional_schedules"("userId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_diagnoses_prescriptionId_diagnosisId_key" ON "public"."prescription_diagnoses"("prescriptionId", "diagnosisId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "public"."especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_obraSocialId_fkey" FOREIGN KEY ("obraSocialId") REFERENCES "public"."obras_sociales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."especialidades" ADD CONSTRAINT "especialidades_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."especialidades" ADD CONSTRAINT "especialidades_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."especialidades" ADD CONSTRAINT "especialidades_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professional_schedules" ADD CONSTRAINT "professional_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."diagnoses" ADD CONSTRAINT "diagnoses_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."diagnoses" ADD CONSTRAINT "diagnoses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."diagnoses" ADD CONSTRAINT "diagnoses_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescription_diagnoses" ADD CONSTRAINT "prescription_diagnoses_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescription_diagnoses" ADD CONSTRAINT "prescription_diagnoses_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "public"."diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_orders" ADD CONSTRAINT "study_orders_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_orders" ADD CONSTRAINT "study_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_orders" ADD CONSTRAINT "study_orders_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_order_items" ADD CONSTRAINT "study_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."study_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_medications" ADD CONSTRAINT "patient_medications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_medications" ADD CONSTRAINT "patient_medications_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
