// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pad(num: number, size: number) {
  return num.toString().padStart(size, "0");
}

async function main() {
  // Limpieza (orden importante por FKs)
  await prisma.consultas.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.obraSocial.deleteMany();

  // 1) Obras Sociales (6)
  const obrasSocialesData = [
    { nombreObraSocial: "OSDE" },
    { nombreObraSocial: "Swiss Medical" },
    { nombreObraSocial: "Galeno" },
    { nombreObraSocial: "Sancor Salud" },
    { nombreObraSocial: "IOMA" },
    { nombreObraSocial: "PAMI" },
  ];

  await prisma.obraSocial.createMany({
    data: obrasSocialesData,
    skipDuplicates: true,
  });

  const obrasSociales = await prisma.obraSocial.findMany({
    orderBy: { idObraSocial: "asc" },
  });

  // 2) Pacientes (15)
  const nombres: Array<[string, string]> = [
    ["Juan", "Pérez"],
    ["María", "Gómez"],
    ["Lucas", "Fernández"],
    ["Sofía", "López"],
    ["Mateo", "Rodríguez"],
    ["Valentina", "Martínez"],
    ["Benjamín", "Sánchez"],
    ["Camila", "Romero"],
    ["Thiago", "Díaz"],
    ["Martina", "Álvarez"],
    ["Joaquín", "Torres"],
    ["Lucía", "Ruiz"],
    ["Franco", "Herrera"],
    ["Agustina", "Castro"],
    ["Nicolás", "Vega"],
  ];

  const baseDni = 35000000;

  const pacientes = [];
  for (let i = 0; i < 15; i++) {
    const [nombrePaciente, apellidoPaciente] = nombres[i];
    const dniPaciente = String(baseDni + i); // unique
    const telefonoPaciente = `351${pad(1000000 + i, 7)}`;
    const domicilioPaciente = `Calle ${i + 1} #${100 + i}`;

    const p = await prisma.paciente.create({
      data: {
        nombrePaciente,
        apellidoPaciente,
        dniPaciente,
        telefonoPaciente,
        domicilioPaciente,
        estadoPaciente: true,
      },
    });

    pacientes.push(p);
  }

  // 3) Consultas (15): 1 por paciente y 1 obra social
  const motivos = [
    "Control general",
    "Dolor de cabeza",
    "Dolor abdominal",
    "Chequeo anual",
    "Fiebre y malestar",
    "Dolor lumbar",
    "Consulta por alergia",
    "Gastritis",
    "Ansiedad / estrés",
    "Hipertensión",
    "Dolor de garganta",
    "Lesión deportiva",
    "Seguimiento de tratamiento",
    "Insomnio",
    "Revisión de estudios",
  ];

  const diagnosticos = [
    "Sin hallazgos relevantes",
    "Cefalea tensional",
    "Gastroenteritis leve",
    "Apto control",
    "Infección viral probable",
    "Lumbalgia mecánica",
    "Rinitis alérgica",
    "Dispepsia",
    "Estrés",
    "HTA en control",
    "Faringitis",
    "Esguince leve",
    "Evolución favorable",
    "Trastorno del sueño",
    "Se solicitan estudios",
  ];

  const tratamientos = [
    "Hidratación y descanso",
    "Analgésico si dolor",
    "Dieta liviana 48hs",
    "Hábitos saludables",
    "Antitérmico si fiebre",
    "Ejercicios y calor local",
    "Antihistamínico",
    "IBP por 14 días",
    "Técnicas de respiración",
    "Control y medicación habitual",
    "Gárgaras y antiinflamatorio",
    "Hielo, reposo y venda",
    "Continuar esquema",
    "Higiene del sueño",
    "Derivar según resultado",
  ];

  const tiposConsulta = ["Primera vez", "Control", "Urgencia", "Seguimiento"];

  for (let i = 0; i < pacientes.length; i++) {
    const paciente = pacientes[i];
    const obra = obrasSociales[i % obrasSociales.length];

    await prisma.consultas.create({
      data: {
        idPaciente: paciente.idPaciente,
        idObraSocial: obra.idObraSocial,

        motivoConsulta: motivos[i],
        diagnosticoConsulta: diagnosticos[i],
        tratamientoConsulta: tratamientos[i],

        // Campos extra del schema actual
        nroAfiliado: `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`,
        tipoConsulta: tiposConsulta[i % tiposConsulta.length],
        montoConsulta: 5000 + i * 750, // ejemplo
      },
    });
  }

  // Agregar múltiples consultas para el paciente con id 14 (índice 13) con fechas variadas
  const paciente14 = pacientes[13]; // Agustina Castro, índice 13

  const fechasAnteriores = [
    new Date("2025-12-15T10:30:00Z"), // 15 diciembre 2025
    new Date("2025-12-01T14:00:00Z"), // 1 diciembre 2025
    new Date("2025-11-20T09:15:00Z"), // 20 noviembre 2025
    new Date("2025-11-05T16:45:00Z"), // 5 noviembre 2025
    new Date("2025-10-25T11:20:00Z"), // 25 octubre 2025
    new Date("2025-10-10T13:30:00Z"), // 10 octubre 2025
    new Date("2025-09-30T10:00:00Z"), // 30 septiembre 2025
    new Date("2025-09-15T15:10:00Z"), // 15 septiembre 2025
  ];

  const motivosExtras = [
    "Control de presión arterial",
    "Revisión de laboratorio",
    "Dolor en la zona lumbar",
    "Consulta por alergia estacional",
    "Seguimiento de medicación",
    "Dolor de cabeza recurrente",
    "Chequeo preventivo",
    "Control de colesterol",
  ];

  const diagnosticosExtras = [
    "Hipertensión controlada",
    "Resultados normales",
    "Lumbalgia mecánica",
    "Alergia estacional confirmada",
    "Situación estable",
    "Cefalea tensional",
    "Sin hallazgos",
    "Dislipidemia leve",
  ];

  const tratamientosExtras = [
    "Continuar medicación",
    "Próximo control en 3 meses",
    "Ejercicios y reposo",
    "Antihistamínico según síntomas",
    "Monitoreo de presión",
    "Analgésico si es necesario",
    "Revisión anual",
    "Dieta balanceada y ejercicio",
  ];

  // Crear consultas adicionales para el paciente 14
  for (let i = 0; i < fechasAnteriores.length; i++) {
    const obra = obrasSociales[i % obrasSociales.length];
    const fecha = fechasAnteriores[i];

    await prisma.consultas.create({
      data: {
        idPaciente: paciente14.idPaciente,
        idObraSocial: obra.idObraSocial,
        fechaHoraConsulta: fecha,

        motivoConsulta: motivosExtras[i],
        diagnosticoConsulta: diagnosticosExtras[i],
        tratamientoConsulta: tratamientosExtras[i],

        nroAfiliado: `AF-${obra.idObraSocial}-${pad(paciente14.idPaciente, 4)}`,
        tipoConsulta: tiposConsulta[i % tiposConsulta.length],
        montoConsulta: 6000 + i * 500,
      },
    });
  }

  const countOS = await prisma.obraSocial.count();
  const countPac = await prisma.paciente.count();
  const countCons = await prisma.consultas.count();

  console.log("Seed OK ✅");
  console.log({
    obrasSociales: countOS,
    pacientes: countPac,
    consultas: countCons,
  });
}

main()
  .catch((e) => {
    console.error("Seed error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
