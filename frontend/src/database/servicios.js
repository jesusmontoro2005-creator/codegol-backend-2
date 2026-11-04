// Servicios del panel. Cada función llama a la API (ver docs/CONTRATO_API.md) y, si el
// backend no está disponible, usa la base de demostración del navegador.
import { apiDelete, apiGet, apiPost, apiPut } from './api'
import { demo } from './demo'
import { conRespaldo } from './respaldo'

const lista = (data) => (Array.isArray(data) ? data : data == null ? [] : [data])
const query = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString()
  return q ? `?${q}` : ''
}

// Jugadores
export const listarJugadores = (equipoId) => conRespaldo(async () => lista(await apiGet(`jugadores${query({ equipoId })}`)), () => demo.jugadores(equipoId))
export const crearJugador = (d) => conRespaldo(() => apiPost('jugadores', d), () => demo.crearJugador(d))
export const editarJugador = (id, d) => conRespaldo(() => apiPut(`jugadores/${id}`, d), () => demo.editarJugador(id, d))
export const eliminarJugador = (id) => conRespaldo(() => apiDelete(`jugadores/${id}`), () => demo.eliminarJugador(id))

// Calendario
export const listarCanchas = () => conRespaldo(async () => lista(await apiGet('canchas')), () => demo.canchas())
export const listarPartidos = (torneoId) => conRespaldo(async () => lista(await apiGet(`partidos${query({ torneoId })}`)), () => demo.partidos(torneoId))
export const crearPartido = (d) => conRespaldo(() => apiPost('partidos', d), () => demo.crearPartido(d))
export const actualizarPartido = (id, d) => conRespaldo(() => apiPut(`partidos/${id}`, d), () => demo.actualizarPartido(id, d))
export const eliminarPartido = (id) => conRespaldo(() => apiDelete(`partidos/${id}`), () => demo.eliminarPartido(id))
export const generarCalendario = (torneoId, opciones) => conRespaldo(() => apiPost(`torneos/${torneoId}/calendario`, opciones), () => demo.generarCalendario(torneoId, opciones))
export const borrarCalendario = (torneoId) => conRespaldo(() => apiDelete(`torneos/${torneoId}/calendario`), () => demo.borrarCalendario(torneoId))
export const listarArbitros = () => conRespaldo(async () => lista(await apiGet('usuarios/arbitros')), () => demo.arbitros())

// Cédula arbitral de un partido: marcador, pase de lista biométrico y eventos (HU-01, HU-02)
export const obtenerCedula = (partidoId) => conRespaldo(() => apiGet(`partidos/${partidoId}/cedula`), () => demo.cedula(partidoId))

// Estadísticas (también las usa el portal público, sin login)
export const obtenerPosiciones = (torneoId) => conRespaldo(async () => lista(await apiGet(`torneos/${torneoId}/posiciones`)), () => demo.posiciones(torneoId))
export const obtenerGoleadores = (torneoId) => conRespaldo(async () => lista(await apiGet(`torneos/${torneoId}/goleadores`)), () => demo.goleadores(torneoId))
export const obtenerSuspensiones = (torneoId) => conRespaldo(async () => lista(await apiGet(`torneos/${torneoId}/suspensiones`)), () => demo.suspensiones(torneoId))

// Finanzas
export const listarPagos = (filtros) => conRespaldo(async () => lista(await apiGet(`pagos${query(filtros)}`)), () => demo.pagos(filtros))
export const registrarPago = (d) => conRespaldo(() => apiPost('pagos', d), () => demo.registrarPago(d))
export const obtenerRecibo = (id) => conRespaldo(() => apiGet(`pagos/${id}`), () => demo.recibo(id))

// Usuarios y permisos (solo Administrador). El rol decide si la persona entra al panel web o usa la APK.
export const listarUsuarios = () => conRespaldo(async () => lista(await apiGet('usuarios')), () => demo.usuarios())
export const cambiarRolUsuario = (id, rol) => conRespaldo(() => apiPut(`usuarios/${id}/rol`, { rol }), () => demo.cambiarRol(id, rol))

// Utilidades de formato compartidas
export const moneda = (n) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
export const fechaLarga = (f) => (f ? new Date(`${String(f).slice(0, 10)}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Por definir')
export { hoyISO } from '../utils/fechas'
