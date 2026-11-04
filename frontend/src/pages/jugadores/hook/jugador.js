// Reglas de validación y búsqueda de jugadores. No dependen de React.
export const POSICIONES = ['Portero', 'Defensa', 'Medio', 'Delantero']

import { sinEspaciosExtra, validarNombrePersona } from '../../../utils/validaciones'

const CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/

export function validarJugador(datos, existentes = [], idActual = null) {
  const errorNombre = validarNombrePersona(datos.nombre, 'El nombre del jugador'); if (errorNombre) throw new Error(errorNombre)
  const errorApellidos = validarNombrePersona(datos.apellidos, 'Los apellidos'); if (errorApellidos) throw new Error(errorApellidos)
  if (!datos.equipoId) throw new Error('Elige el equipo del jugador.')
  const dorsal = String(datos.dorsal ?? '').trim()
  if (dorsal && !/^\d{1,2}$/.test(dorsal)) throw new Error('El dorsal debe ser un número de 1 o 2 dígitos.')
  const curp = (datos.curp || '').trim().toUpperCase()
  if (curp && curp.length !== 18) throw new Error('La CURP debe tener 18 caracteres.')
  if (curp && !CURP.test(curp)) throw new Error('La CURP no tiene un formato válido (ej. GOMC900101HDFRRL09).')
  if (dorsal && existentes.some((j) => j.id !== idActual && String(j.equipoId) === String(datos.equipoId) && String(j.dorsal) === dorsal)) throw new Error(`El dorsal ${dorsal} ya lo usa otro jugador de ese equipo.`)
  if (curp && existentes.some((j) => j.id !== idActual && (j.curp || '').toUpperCase() === curp)) throw new Error('Esa CURP ya está registrada: posible jugador duplicado.')
  const fotoUrl = (datos.fotoUrl || '').trim()
  if (fotoUrl && !/^https?:\/\//i.test(fotoUrl)) throw new Error('La foto debe ser una URL que empiece con http:// o https://.')
  return { nombre: sinEspaciosExtra(datos.nombre), apellidos: sinEspaciosExtra(datos.apellidos), equipoId: Number(datos.equipoId), posicion: datos.posicion, dorsal, curp, fotoUrl }
}

export function buscarJugadores(jugadores, texto, equipoId = '') {
  const busqueda = texto.trim().toLocaleLowerCase('es')
  return jugadores.filter((j) => (!equipoId || String(j.equipoId) === String(equipoId))
    && (!busqueda || [j.nombre, j.apellidos, j.equipo, j.posicion, j.dorsal].join(' ').toLocaleLowerCase('es').includes(busqueda)))
}
