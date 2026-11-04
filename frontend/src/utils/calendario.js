// Lógica pura del calendario (HU-04). No depende de React ni del servidor.
import { sumarDias } from './fechas'
export { sumarDias }

export const aMinutos = (hora) => { const [h, m] = String(hora).slice(0, 5).split(':').map(Number); return h * 60 + m }
export const deMinutos = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

const seCruzan = (a, b) => aMinutos(a.horaInicio) < aMinutos(b.horaFin) && aMinutos(b.horaInicio) < aMinutos(a.horaFin)

/**
 * Devuelve el motivo del traslape (string) o null si el partido se puede guardar.
 * Revisa cancha ocupada y equipo jugando a la misma hora (HU-04 esc. 3).
 */
export function motivoTraslape(existentes, candidato, ignorarId = null) {
  for (const p of existentes) {
    if (p.id === ignorarId || p.estado === 'CANCELADO' || p.fecha !== candidato.fecha || !seCruzan(p, candidato)) continue
    if (String(p.canchaId) === String(candidato.canchaId)) return 'La cancha ya está ocupada en ese horario.'
    const equipos = [String(p.localId), String(p.visitanteId)]
    if (equipos.includes(String(candidato.localId)) || equipos.includes(String(candidato.visitanteId))) return 'Uno de los equipos ya juega en ese horario.'
  }
  return null
}

/** Método del círculo: devuelve jornadas = lista de parejas [local, visitante]. */
export function emparejamientos(equipoIds, dobleVuelta = false) {
  const lista = [...equipoIds]
  if (lista.length < 2) return []
  if (lista.length % 2) lista.push(null) // descanso
  const n = lista.length
  const jornadas = []
  for (let r = 0; r < n - 1; r++) {
    const parejas = []
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i]; const b = lista[n - 1 - i]
      if (a == null || b == null) continue
      parejas.push(r % 2 ? [b, a] : [a, b])
    }
    jornadas.push(parejas)
    lista.splice(1, 0, lista.pop())
  }
  return dobleVuelta ? [...jornadas, ...jornadas.map((j) => j.map(([a, b]) => [b, a]))] : jornadas
}

/**
 * Genera el rol de juegos repartiendo partidos por jornada en las canchas y horarios dados,
 * sin traslapes con lo ya existente. Devuelve { partidos, sinLugar }.
 */
export function generarRol({ equipoIds, fechaInicio, diasEntreJornadas = 7, horarios, duracionMin = 60, canchaIds, dobleVuelta = false, existentes = [], jornadaInicial = 1 }) {
  const partidos = []
  const sinLugar = []
  const ocupados = [...existentes]
  emparejamientos(equipoIds, dobleVuelta).forEach((parejas, idx) => {
    const jornada = jornadaInicial + idx
    const fechaBase = sumarDias(fechaInicio, idx * diasEntreJornadas)
    parejas.forEach(([localId, visitanteId]) => {
      let colocado = false
      for (let extra = 0; extra < 7 && !colocado; extra++) {
        const fecha = sumarDias(fechaBase, extra)
        for (const hora of horarios) {
          for (const canchaId of canchaIds) {
            const cand = { fecha, horaInicio: hora, horaFin: deMinutos(aMinutos(hora) + duracionMin), canchaId, localId, visitanteId }
            if (motivoTraslape(ocupados, cand)) continue
            const nuevo = { ...cand, jornada, estado: 'PROGRAMADO', golesLocal: 0, golesVisitante: 0 }
            partidos.push(nuevo); ocupados.push(nuevo); colocado = true
            break
          }
          if (colocado) break
        }
      }
      if (!colocado) sinLugar.push({ jornada, localId, visitanteId })
    })
  })
  return { partidos, sinLugar }
}
