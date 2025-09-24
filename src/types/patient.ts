// Tipos para los datos del formulario de paciente
export interface PatientFormData {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  genero: string
  telefono: string
  celular: string
  email: string
  direccion: string
  ciudad: string
  provincia: string
  codigoPostal: string
  obraSocialId: string
  numeroAfiliado: string
  contactoEmergenciaNombre: string
  contactoEmergenciaTelefono: string
  contactoEmergenciaRelacion: string
}

// Tipo para la respuesta de la API
export interface ApiResponse<T = unknown> {
  success?: boolean
  error?: string
  message?: string
  data?: T
}