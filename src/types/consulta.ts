export type Consulta = {
  idConsulta: number;
  motivoConsulta: string;
  diagnosticoConsulta: string | null;
  tratamientoConsulta: string | null;
  fechaHoraConsulta: string;
  nroAfiliado: string | null;
  tipoConsulta: string;
  montoConsulta: number | null;
  obraSocial: {
    idObraSocial: number;
    nombreObraSocial: string;
  } | null;
};
