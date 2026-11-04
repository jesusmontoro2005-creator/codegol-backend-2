import { apiGet, apiPost, apiPut } from '../../../database/api'
import { demo } from '../../../database/demo'
import { conRespaldo } from '../../../database/respaldo'

function comoLista(data) {
  if (Array.isArray(data)) return data
  if (data == null) return []
  return [data]
}

export async function obtenerCategorias() {
  return conRespaldo(async () => comoLista(await apiGet('torneos/categorias')), () => demo.categorias())
}

export function crearCategoria(datos) {
  return conRespaldo(() => apiPost('torneos/categorias', datos), () => demo.crearCategoria(datos))
}

export async function obtenerTorneos() {
  return conRespaldo(async () => comoLista(await apiGet('torneos')), () => demo.torneos())
}

export function obtenerTorneo(id) {
  return conRespaldo(() => apiGet(`torneos/${id}`), () => demo.torneo(id))
}

export function crearTorneo(datos) {
  return conRespaldo(() => apiPost('torneos', datos), () => demo.crearTorneo(datos))
}

export async function obtenerEquipos() {
  return conRespaldo(async () => comoLista(await apiGet('equipos')), () => demo.equipos())
}

export async function obtenerEquiposDeTorneo(torneoId) {
  return conRespaldo(async () => comoLista(await apiGet(`equipos/torneo/${torneoId}`)), () => demo.equiposDeTorneo(torneoId))
}

export function inscribirEquipo(datos) {
  return conRespaldo(() => apiPost('equipos', datos), () => demo.inscribirEquipo(datos))
}

export function actualizarTorneo(id, datos) {
  return conRespaldo(() => apiPut(`torneos/${id}`, datos), () => demo.actualizarTorneo(id, datos))
}

export function editarEquipo(id, datos) {
  return conRespaldo(() => apiPut(`equipos/${id}`, datos), () => demo.editarEquipo(id, datos))
}
