// Validaciones para perfiles de usuario

export interface ProfileValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Validar DNI argentino (formato correcto argentino)
export function validateDNI(dni: string): boolean {
  if (!dni) return false
  const cleanDNI = dni.replace(/\D/g, '') // Solo números
  
  // DNI argentino: exactamente 7 u 8 dígitos
  // Históricos: 7 dígitos (hasta ~1990)
  // Actuales: 8 dígitos
  return cleanDNI.length >= 7 && cleanDNI.length <= 8 && /^\d+$/.test(cleanDNI)
}

// Validar teléfono argentino (formatos reales argentinos)
export function validatePhone(phone: string): boolean {
  if (!phone) return false
  const cleanPhone = phone.replace(/\D/g, '') // Solo números
  
  // Formatos argentinos válidos:
  
  // 1. Celular AMBA: 11-XXXX-XXXX (10 dígitos total)
  if (/^11\d{8}$/.test(cleanPhone)) return true
  
  // 2. Fijo AMBA: 11-XXXX-XXXX (10 dígitos total, mismo formato que celular)
  // Ya cubierto arriba
  
  // 3. Fijo Interior: código área + número
  // - Córdoba (351): 351-XXX-XXXX (10 dígitos)
  // - Rosario (341): 341-XXX-XXXX (10 dígitos)  
  // - La Plata (221): 221-XXX-XXXX (10 dígitos)
  // - Mar del Plata (223): 223-XXX-XXXX (10 dígitos)
  if (/^(2|3)\d{2}\d{6,7}$/.test(cleanPhone) && cleanPhone.length >= 10 && cleanPhone.length <= 11) {
    return true
  }
  
  // 4. Con código país Argentina (54):
  if (cleanPhone.startsWith('54')) {
    const withoutCountryCode = cleanPhone.slice(2)
    // Recursión para validar sin el código de país
    return validatePhone(withoutCountryCode)
  }
  
  return false
}

// Validar email
export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar formato de hora (HH:mm)
export function validateTimeFormat(time: string): boolean {
  if (!time) return false
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return timeRegex.test(time)
}

// Validar que la hora de inicio sea menor que la de fin
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  return startMinutes < endMinutes
}

// Validación completa de perfil
export function validateProfile(data: {
  name?: string
  apellido?: string
  dni?: string
  telefono?: string
  email?: string
  role?: string
}): ProfileValidationResult {
  const errors: Record<string, string> = {}
  
  // Campos obligatorios
  if (!data.name?.trim()) {
    errors.name = 'El nombre es obligatorio'
  }
  
  if (!data.apellido?.trim()) {
    errors.apellido = 'El apellido es obligatorio'
  }
  
  if (!data.dni?.trim()) {
    errors.dni = 'El DNI es obligatorio'
  } else if (!validateDNI(data.dni)) {
    errors.dni = 'DNI inválido. Debe contener entre 7 y 8 dígitos (ej: 12.345.678)'
  }
  
  if (!data.telefono?.trim()) {
    errors.telefono = 'El teléfono es obligatorio'
  } else if (!validatePhone(data.telefono)) {
    errors.telefono = 'Teléfono inválido. Formatos válidos: 11-1234-5678 (AMBA) o 351-123-4567 (interior)'
  }
  
  // Email es opcional pero si se proporciona debe ser válido
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Formato inválido en el campo email'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validar horarios profesionales
export function validateProfessionalSchedule(schedule: {
  dayOfWeek: string
  startTime: string
  endTime: string
}): ProfileValidationResult {
  const errors: Record<string, string> = {}
  
  if (!schedule.dayOfWeek) {
    errors.dayOfWeek = 'Debe seleccionar un día'
  }
  
  if (!schedule.startTime) {
    errors.startTime = 'La hora de inicio es obligatoria'
  } else if (!validateTimeFormat(schedule.startTime)) {
    errors.startTime = 'Formato inválido en la hora de inicio (HH:mm)'
  }
  
  if (!schedule.endTime) {
    errors.endTime = 'La hora de fin es obligatoria'
  } else if (!validateTimeFormat(schedule.endTime)) {
    errors.endTime = 'Formato inválido en la hora de fin (HH:mm)'
  }
  
  if (schedule.startTime && schedule.endTime && 
      validateTimeFormat(schedule.startTime) && validateTimeFormat(schedule.endTime)) {
    if (!validateTimeRange(schedule.startTime, schedule.endTime)) {
      errors.timeRange = 'La hora de inicio debe ser menor que la hora de fin'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Formatear DNI con puntos (formato argentino estándar)
export function formatDNI(dni: string): string {
  const cleanDNI = dni.replace(/\D/g, '')
  
  if (cleanDNI.length === 7) {
    // DNI histórico: X.XXX.XXX
    return cleanDNI.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3')
  } else if (cleanDNI.length === 8) {
    // DNI actual: XX.XXX.XXX
    return cleanDNI.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
  } else if (cleanDNI.length > 8) {
    // Si es muy largo, solo mostrar los primeros 8
    const truncated = cleanDNI.slice(0, 8)
    return truncated.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
  }
  
  // Si es muy corto, devolver sin formato
  return cleanDNI
}

// Formatear teléfono argentino
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Quitar código país si está presente
  const phoneWithoutCountry = cleanPhone.startsWith('54') ? cleanPhone.slice(2) : cleanPhone
  
  // AMBA (Buenos Aires): 11-XXXX-XXXX
  if (/^11\d{8}$/.test(phoneWithoutCountry)) {
    return phoneWithoutCountry.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  
  // Interior con código de área de 3 dígitos: XXX-XXX-XXXX
  if (/^[23]\d{2}\d{7}$/.test(phoneWithoutCountry)) {
    return phoneWithoutCountry.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  
  // Interior con código de área de 4 dígitos: XXXX-XX-XXXX
  if (/^[23]\d{3}\d{6}$/.test(phoneWithoutCountry)) {
    return phoneWithoutCountry.replace(/(\d{4})(\d{2})(\d{4})/, '$1-$2-$3')
  }
  
  // Si no coincide con ningún formato, devolver los números limpios
  return phoneWithoutCountry
}