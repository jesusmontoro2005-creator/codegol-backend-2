// Validaciones compartidas por los formularios. Cada función devuelve '' si todo está bien
// o el mensaje de error en español. No modifican lo que el usuario escribió.
const LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]*$/

export const sinEspaciosExtra = (t) => String(t ?? '').trim().replace(/\s+/g, ' ')

/** Usuario: se respeta EXACTAMENTE lo escrito (mayúsculas y minúsculas distintas son usuarios distintos). */
export function validarUsuario(u) {
  if (!u) return 'Escribe un nombre de usuario.'
  if (u !== u.trim()) return 'El usuario no puede empezar ni terminar con espacios.'
  if (u.length < 4 || u.length > 50) return 'El usuario debe tener entre 4 y 50 caracteres.'
  if (!/^[A-Za-z0-9._-]+$/.test(u)) return 'El usuario solo puede llevar letras, números, punto, guion y guion bajo (sin espacios ni acentos).'
  return ''
}

export function validarNombrePersona(n, etiqueta = 'El nombre') {
  const t = sinEspaciosExtra(n)
  if (!t) return `${etiqueta} es obligatorio.`
  if (t.length < 2 || t.length > 100) return `${etiqueta} debe tener entre 2 y 100 caracteres.`
  if (!LETRAS.test(t)) return `${etiqueta} solo puede llevar letras y espacios.`
  return ''
}

export function validarCorreo(c) {
  const t = String(c ?? '').trim()
  if (!t) return 'Escribe un correo electrónico.'
  if (t.length > 100 || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(t)) return 'Escribe un correo válido, por ejemplo nombre@dominio.com.'
  return ''
}

export function validarPassword(p) {
  if (!p) return 'Escribe una contraseña.'
  if (p.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (p.length > 72) return 'La contraseña no puede pasar de 72 caracteres.'
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'La contraseña debe combinar letras y números.'
  return ''
}

export function validarTelefono(t, obligatorio = false) {
  const v = String(t ?? '').trim()
  if (!v) return obligatorio ? 'Escribe un teléfono de contacto.' : ''
  if (!/^[\d\s()+-]+$/.test(v) || v.replace(/\D/g, '').length !== 10) return 'El teléfono debe tener 10 dígitos (ej. 5512345678).'
  return ''
}

export function validarUrl(u) {
  const v = String(u ?? '').trim()
  if (!v) return ''
  try { const x = new URL(v); return ['http:', 'https:'].includes(x.protocol) ? '' : 'La dirección debe empezar con http:// o https://.' } catch { return 'Escribe una dirección web válida (https://…).' }
}

export function validarNombreCatalogo(nombre, existentes = [], etiqueta = 'El nombre', idActual = null) {
  const t = sinEspaciosExtra(nombre)
  if (t.length < 3) return `${etiqueta} debe tener al menos 3 caracteres.`
  if (t.length > 100) return `${etiqueta} es demasiado largo (máximo 100).`
  if (existentes.some((x) => x.id !== idActual && sinEspaciosExtra(x.nombre).toLowerCase() === t.toLowerCase())) return `Ya existe "${t}". Usa otro nombre.`
  return ''
}

export function validarTorneo(d, torneos = []) {
  const e = validarNombreCatalogo(d.nombre, torneos, 'El nombre del torneo'); if (e) return e
  if (!d.categoriaId) return 'Elige una categoría.'
  if (!d.fechaInicio) return 'Indica la fecha de inicio.'
  if (d.fechaFin && d.fechaFin < d.fechaInicio) return 'La fecha de cierre no puede ser anterior a la de inicio.'
  for (const [campo, etiqueta] of [['cuotaInscripcion', 'La cuota de inscripción'], ['cuotaArbitraje', 'La cuota de arbitraje']]) {
    const n = Number(d[campo] || 0)
    if (!Number.isFinite(n) || n < 0 || n > 100000) return `${etiqueta} debe ser un monto entre 0 y 100,000.`
  }
  const a = Number(d.limiteAmarillas)
  if (!Number.isInteger(a) || a < 1 || a > 10) return 'Las amarillas para suspensión deben ser un número entero entre 1 y 10.'
  if (String(d.descripcion || '').length > 500) return 'La descripción no puede pasar de 500 caracteres.'
  return ''
}

/** Nombre de equipo: puede llevar letras, números, espacios y . , & ' - ; debe contener al menos una letra. */
export function validarNombreEquipo(n) {
  const t = sinEspaciosExtra(n)
  if (!t) return 'El nombre del equipo es obligatorio.'
  if (t.length < 2 || t.length > 100) return 'El nombre del equipo debe tener entre 2 y 100 caracteres.'
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .,&'-]*$/u.test(t)) return 'El nombre del equipo solo puede llevar letras, números, espacios y . , & \' - (sin otros símbolos).'
  if (!/\p{L}/u.test(t)) return 'El nombre del equipo debe incluir al menos una letra (no puede ser solo números).'
  return ''
}

export function validarEquipo(d, existentes = [], idActual = null) {
  const nombre = sinEspaciosExtra(d.nombre)
  const problemaNombre = validarNombreEquipo(nombre); if (problemaNombre) return problemaNombre
  if (existentes.some((x) => x.id !== idActual && sinEspaciosExtra(x.nombre).toLowerCase() === nombre.toLowerCase())) return `Ya existe un equipo llamado "${nombre}".`
  if (d.delegado && validarNombrePersona(d.delegado, 'El nombre del delegado')) return validarNombrePersona(d.delegado, 'El nombre del delegado')
  return validarTelefono(d.telefono) || validarUrl(d.logoUrl)
}

/** Alta de equipo en un torneo: aquí el delegado y su teléfono son obligatorios (se necesita a quién contactar). */
export function validarInscripcionEquipo(d) {
  if (!sinEspaciosExtra(d.delegado)) return 'El nombre del delegado es obligatorio.'
  if (!String(d.telefono ?? '').trim()) return 'El teléfono del delegado es obligatorio (10 dígitos).'
  return validarEquipo(d)
}
