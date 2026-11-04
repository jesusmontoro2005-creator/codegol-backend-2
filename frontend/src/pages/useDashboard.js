import useDatos from '../hooks/useDatos'
import { listarCanchas, listarJugadores, listarPagos, listarPartidos, moneda, hoyISO } from '../database/servicios'
import { obtenerTorneos } from './torneos/hook/torneos'

import { sumarDias as sumar } from '../utils/fechas'
const corta = (f) => new Date(`${f}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')
const colores = ['teal', 'blue', 'orange']

export default function useDashboard() {
  const { datos, cargando, error } = useDatos(async () => {
    const hoy = hoyISO()
    const [torneos, partidos, jugadores, canchas, pagosMes, pagosRecientes] = await Promise.all([obtenerTorneos(), listarPartidos(), listarJugadores(), listarCanchas(), listarPagos({ desde: `${hoy.slice(0, 8)}01`, hasta: hoy }), listarPagos({ desde: sumar(hoy, -30), hasta: hoy })])
    return { torneos, partidos, jugadores, canchas, pagosMes, pagosRecientes }
  }, [], null)
  if (!datos) return { cargando, error, listo: false }

  const hoy = hoyISO(); const finSemana = sumar(hoy, 6)
  const colorDe = (p) => colores[(datos.torneos.findIndex((t) => t.id === p.torneoId) + colores.length) % colores.length]
  const semana = datos.partidos.filter((p) => p.fecha >= hoy && p.fecha <= finSemana)
  const proximos = datos.partidos.filter((p) => p.estado === 'PROGRAMADO' && p.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
  const finalizados = datos.partidos.filter((p) => p.estado === 'FINALIZADO').sort((a, b) => b.fecha.localeCompare(a.fecha))
  const hoyPartidos = datos.partidos.filter((p) => p.fecha === hoy)
  const canchasHoy = new Set(hoyPartidos.map((p) => p.canchaId)).size

  // partidos finalizados por semana (últimas 12)
  const serie = Array.from({ length: 12 }, (_, i) => { const ini = sumar(hoy, -7 * (11 - i)); const fin = sumar(ini, 6); return finalizados.filter((p) => p.fecha >= ini && p.fecha <= fin).length })
  const etiquetas = Array.from({ length: 12 }, (_, i) => corta(sumar(hoy, -7 * (11 - i))))

  const actividad = [
    ...datos.pagosRecientes.slice(0, 4).map((p) => ({ icon: 'pi-wallet', tone: 'orange', text: `Pago de ${p.concepto.toLowerCase()} recibido`, detail: `${p.equipo} · ${moneda(p.monto)}`, cuando: String(p.fechaPago) })),
    ...finalizados.slice(0, 3).map((p) => ({ icon: 'pi-verified', tone: 'blue', text: 'Cédula arbitral cerrada', detail: `${p.local} ${p.golesLocal}-${p.golesVisitante} ${p.visitante}`, cuando: `${p.fecha}T${p.horaFin}` })),
  ].sort((a, b) => b.cuando.localeCompare(a.cuando)).slice(0, 5).map((a) => ({ ...a, time: corta(a.cuando.slice(0, 10)) }))

  return {
    listo: true, cargando, error,
    metricas: [
      { label: 'Torneos activos', value: String(datos.torneos.filter((t) => ['EN_PROGRESO', 'EN_INSCRIPCION'].includes(t.estado)).length).padStart(2, '0'), change: `${datos.torneos.length} en total`, icon: 'pi-star-fill', tone: 'teal' },
      { label: 'Partidos esta semana', value: String(semana.length), change: `${semana.filter((p) => p.estado === 'PROGRAMADO').length} por jugar`, icon: 'pi-calendar', tone: 'blue' },
      { label: 'Jugadores registrados', value: String(datos.jugadores.length), change: `${datos.jugadores.filter((j) => !j.huella).length} sin huella`, icon: 'pi-users', tone: 'green' },
      { label: 'Ingresos del mes', value: moneda(datos.pagosMes.reduce((s, p) => s + Number(p.monto), 0)), change: `${datos.pagosMes.length} pagos`, icon: 'pi-wallet', tone: 'orange' },
    ],
    proximos: proximos.slice(0, 5).map((p) => ({ time: String(p.horaInicio).slice(0, 5), date: p.fecha === hoy ? `HOY, ${corta(p.fecha).toUpperCase()}` : corta(p.fecha).toUpperCase(), home: p.local, away: p.visitante, field: p.cancha, league: p.torneo, color: colorDe(p) })),
    resultados: finalizados.slice(0, 8).map((p) => ({ home: p.local, away: p.visitante, score: `${p.golesLocal} - ${p.golesVisitante}`, league: p.torneo, date: corta(p.fecha), status: 'Finalizado' })),
    torneosNombres: [...new Set(finalizados.map((p) => p.torneo))],
    canchas: { ocupadas: canchasHoy, total: datos.canchas.length, partidosHoy: hoyPartidos.length },
    semana: { total: semana.length, completados: semana.filter((p) => p.estado === 'FINALIZADO').length, porJugar: semana.filter((p) => p.estado === 'PROGRAMADO').length },
    serie, etiquetas, actividad,
  }
}
