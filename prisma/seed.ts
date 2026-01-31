// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/* ---------------- Helpers ---------------- */
function pad(num: number, size: number) {
  return num.toString().padStart(size, "0");
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

// random estable (reproducible)
let SEED = 1234567;
function rand() {
  SEED = (SEED * 48271) % 0x7fffffff;
  return SEED / 0x7fffffff;
}
function randomInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]) {
  return arr[randomInt(0, arr.length - 1)];
}
function randomTimeWithinDay(day: Date) {
  const d = new Date(day);
  d.setHours(randomInt(8, 19), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}
function chance(p: number) {
  return rand() < p;
}

/* ---------------- Seed ---------------- */
async function main() {
  // Limpieza (orden importante por FKs y Restrict)
  await prisma.consultas.deleteMany();

  // NextAuth
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();

  await prisma.paciente.deleteMany();
  await prisma.coseguro.deleteMany();
  await prisma.obraSocial.deleteMany();
  await prisma.user.deleteMany();

  // 0) Usuario Admin
  const hashedPassword = await bcrypt.hash("Hola1234!", 12);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@derm.local",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✓ Usuario admin creado: admin@derm.local / Hola1234!");

  // 1) Obras Sociales (algunas admiten coseguro)
  const obrasSocialesData = [
    { nombreObraSocial: "OSDE", admiteCoseguro: true },
    { nombreObraSocial: "Swiss Medical", admiteCoseguro: true },
    { nombreObraSocial: "Galeno", admiteCoseguro: true },
    { nombreObraSocial: "Sancor Salud", admiteCoseguro: false },
    { nombreObraSocial: "IOMA", admiteCoseguro: true },
    { nombreObraSocial: "PAMI", admiteCoseguro: false },
  ];

  await prisma.obraSocial.createMany({
    data: obrasSocialesData,
    skipDuplicates: true,
  });

  const obrasSociales = await prisma.obraSocial.findMany({
    orderBy: { idObraSocial: "asc" },
  });

  // 2) Coseguros
  const cosegurosData = [
    { nombreCoseguro: "Mapfre Seguros" },
    { nombreCoseguro: "Zurich Seguros" },
    { nombreCoseguro: "La Segunda Seguros" },
    { nombreCoseguro: "Seguros Monterrey New York Life" },
    { nombreCoseguro: "AXA Seguros" },
    { nombreCoseguro: "Bupa Salud" },
    { nombreCoseguro: "Consolidar Seguros" },
    { nombreCoseguro: "Galeno Seguros" },
  ];

  await prisma.coseguro.createMany({
    data: cosegurosData,
    skipDuplicates: true,
  });

  const coseguros = await prisma.coseguro.findMany({
    orderBy: { idCoseguro: "asc" },
  });

  // Fechas base (dinámicas)
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);

  const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = startOfMonth(prevMonthRef);
  const prevNextMonthStart = startOfNextMonth(prevMonthRef);

  const last30Start = startOfDay(addDays(now, -29));

  // 3) Pacientes (30)
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
    ["Alejandro", "Silva"],
    ["Guadalupe", "Núñez"],
    ["Cristóbal", "Rojas"],
    ["Florencia", "Medina"],
    ["Javier", "Flores"],
    ["Daniela", "Córdoba"],
    ["Ricardo", "Acuña"],
    ["Paloma", "Salazar"],
    ["Tomás", "Bravo"],
    ["Natalia", "Vargas"],
    ["Felipe", "Cortés"],
    ["Isabel", "Miranda"],
    ["Andrés", "Parra"],
    ["Romina", "Campos"],
    ["Carlos", "Mendoza"],
  ];

  const baseDni = 35000000;

  const nuevos30d = randomInt(12, 18);
  const inactivosCount = randomInt(5, 9);

  const pacientes: Array<{ idPaciente: number; estadoPaciente: boolean }> = [];

  for (let i = 0; i < 30; i++) {
    const [nombrePaciente, apellidoPaciente] = nombres[i];
    const dniPaciente = String(baseDni + i);
    const telefonoPaciente = `351${pad(1000000 + i, 7)}`;
    const domicilioPaciente = `Calle ${i + 1} #${100 + i}`;

    let fechaHoraPaciente: Date;
    if (i < nuevos30d) {
      const day = addDays(last30Start, randomInt(0, 29));
      fechaHoraPaciente = randomTimeWithinDay(day);
    } else {
      const day = startOfDay(addDays(now, -randomInt(31, 240)));
      fechaHoraPaciente = randomTimeWithinDay(day);
    }

    const estadoPaciente = i < 30 - inactivosCount;

    const p = await prisma.paciente.create({
      data: {
        nombrePaciente,
        apellidoPaciente,
        dniPaciente,
        telefonoPaciente,
        domicilioPaciente,
        estadoPaciente,
        fechaHoraPaciente,
      },
      select: { idPaciente: true, estadoPaciente: true },
    });

    pacientes.push(p);
  }

  function pickPacienteConSesgo() {
    const activos = pacientes.filter((p) => p.estadoPaciente);
    if (activos.length === 0) return pick(pacientes);
    return rand() < 0.75 ? pick(activos) : pick(pacientes);
  }

  // 4) Consultas
  const motivos = [
    "Control general",
    "Dermatitis",
    "Acné",
    "Alergia cutánea",
    "Chequeo anual",
    "Lesión sospechosa",
    "Seguimiento de tratamiento",
    "Manchas en piel",
    "Picazón",
    "Caída de cabello",
  ];

  const diagnosticos = [
    "Sin hallazgos relevantes",
    "Dermatitis atópica",
    "Acné moderado",
    "Reacción alérgica",
    "Apto control",
    "Lesión benigna probable",
    "Evolución favorable",
    "Hiperpigmentación",
    "Dermatitis de contacto",
    "Efluvio telógeno",
  ];

  const tratamientos = [
    "Hidratación y cuidado",
    "Corticoide tópico",
    "Retinoide tópico",
    "Antihistamínico",
    "Hábitos saludables",
    "Biopsia si persiste",
    "Continuar esquema",
    "Protector solar diario",
    "Evitar irritantes",
    "Vitaminas y control",
  ];

  const estudios = [
    "Dermatoscopía",
    "Biopsia",
    "Laboratorio básico",
    "Cultivo micológico",
    "Test de parche",
    "Fotografía clínica",
  ];

  // ✅ ÚNICOS valores permitidos
  const tiposConsulta = ["Obra social", "Particular"] as const;
  type TipoConsulta = (typeof tiposConsulta)[number];

  async function createConsulta(day: Date) {
    const paciente = pickPacienteConSesgo();
    const tipo: TipoConsulta = pick([...tiposConsulta]);

    const usaObra = tipo === "Obra social";
    const obra = pick(obrasSociales);
    const cos = pick(coseguros);

    const puedeCoseguro = usaObra && obra.admiteCoseguro;
    const idCoseguro = puedeCoseguro && chance(0.25) ? cos.idCoseguro : null;

    await prisma.consultas.create({
      data: {
        idPaciente: paciente.idPaciente,

        // coherencia con tipoConsulta
        idObraSocial: usaObra ? obra.idObraSocial : null,
        nroAfiliado: usaObra
          ? `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`
          : null,

        idCoseguro,
        tieneCoseguro: idCoseguro ? true : false,

        tipoConsulta: tipo,
        montoConsulta: tipo === "Particular" ? 6500 + randomInt(0, 14) * 350 : null,

        motivoConsulta: pick(motivos),
        diagnosticoConsulta: chance(0.12) ? null : pick(diagnosticos),
        tratamientoConsulta: chance(0.15) ? null : pick(tratamientos),
        estudiosComplementarios: chance(0.65) ? null : pick(estudios),

        fechaHoraConsulta: randomTimeWithinDay(day),
      },
    });
  }

  // 4.1) últimos 30 días
  for (let d = 0; d < 30; d++) {
    const day = addDays(last30Start, d);
    const weekday = day.getDay();

    let n = 0;
    if (weekday === 0) n = randomInt(0, 1);
    else if (weekday === 6) n = randomInt(0, 2);
    else {
      const roll = rand();
      if (roll < 0.18) n = 0;
      else if (roll < 0.48) n = 1;
      else if (roll < 0.76) n = 2;
      else if (roll < 0.92) n = 3;
      else n = 4;
    }

    for (let k = 0; k < n; k++) {
      await createConsulta(day);
    }
  }

  // 4.2) KPI mes actual (más alto)
  const targetMesActual = randomInt(42, 68);

  const actualesYaCreadas = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: monthStart, lt: nextMonthStart } },
  });

  let faltanMesActual = Math.max(0, targetMesActual - actualesYaCreadas);

  while (faltanMesActual > 0) {
    const maxDayOffset = Math.max(
      0,
      Math.floor(
        (startOfDay(now).getTime() - monthStart.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const day = addDays(monthStart, randomInt(0, maxDayOffset));

    const isWeekend = [0, 6].includes(day.getDay());
    if (isWeekend && chance(0.6)) continue;

    await createConsulta(startOfDay(day));
    faltanMesActual--;
  }

  // 4.3) mes anterior (más bajo)
  const targetMesAnterior = randomInt(14, 26);

  const anterioresYaCreadas = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: prevMonthStart, lt: prevNextMonthStart } },
  });

  const faltanMesAnterior = Math.max(0, targetMesAnterior - anterioresYaCreadas);

  const daysPrevMonth = Math.floor(
    (prevNextMonthStart.getTime() - prevMonthStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  for (let i = 0; i < faltanMesAnterior; i++) {
    const day = addDays(prevMonthStart, randomInt(0, Math.max(0, daysPrevMonth - 1)));
    await createConsulta(startOfDay(day));
  }

  // Resumen
  const mesActual = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: monthStart, lt: nextMonthStart } },
  });
  const mesAnterior = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: prevMonthStart, lt: prevNextMonthStart } },
  });

  console.log("Seed OK ✅");
  console.log({
    obrasSociales: await prisma.obraSocial.count(),
    coseguros: await prisma.coseguro.count(),
    pacientes: await prisma.paciente.count(),
    consultas: await prisma.consultas.count(),
    consultasMesActual: mesActual,
    consultasMesAnterior: mesAnterior,
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
