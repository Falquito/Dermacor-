// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pad(num: number, size: number) {
  return num.toString().padStart(size, "0");
}

async function main() {
  // Limpieza (orden importante por FKs)
  await prisma.pacienteXObra.deleteMany();
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

  const obras = await prisma.obraSocial.createMany({
    data: obrasSocialesData,
    skipDuplicates: true, // por si ya existían (nombreObraSocial es unique)
  });

  // Traigo las obras creadas para asignarlas
  const obrasSociales = await prisma.obraSocial.findMany({
    orderBy: { idObraSocial: "asc" },
  });

  // 2) Pacientes (15)
  const nombres = [
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

  // DNIs únicos (string) - 8 dígitos estilo AR
  const baseDni = 35000000;

  // Creo pacientes 1 por 1 para tener IDs
  const pacientes = [];
  for (let i = 0; i < 15; i++) {
    const [nombrePaciente, apellidoPaciente] = nombres[i];
    const dniPaciente = String(baseDni + i); // unique
    const telefonoPaciente = `351${pad(1000000 + i, 7)}`; // ejemplo
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

  // 3) Relación PacienteXObra (15) y 4) Consultas (15)
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

  for (let i = 0; i < pacientes.length; i++) {
    const paciente = pacientes[i];
    const obra = obrasSociales[i % obrasSociales.length]; // reparte entre 6 obras

    // PacienteXObra (1 por paciente)
    await prisma.pacienteXObra.create({
      data: {
        idPaciente: paciente.idPaciente,
        idObraSocial: obra.idObraSocial,
        nroAfiliado: `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`,
      },
    });

    // Consulta (1 por paciente y 1 obra social)
    await prisma.consultas.create({
      data: {
        idPaciente: paciente.idPaciente,
        idObraSocial: obra.idObraSocial,
        motivoConsulta: motivos[i],
        diagnosticoConsulta: diagnosticos[i],
        tratamientoConsulta: tratamientos[i],
      },
    });
  }

  const countOS = await prisma.obraSocial.count();
  const countPac = await prisma.paciente.count();
  const countPxO = await prisma.pacienteXObra.count();
  const countCons = await prisma.consultas.count();

  console.log("Seed OK ✅");
  console.log({ obrasSociales: countOS, pacientes: countPac, pacienteXObra: countPxO, consultas: countCons });
}

main()
  .catch((e) => {
    console.error("Seed error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
