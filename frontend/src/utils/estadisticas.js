// Cálculo de posiciones, goleo y sanciones (HU-03). Se usa en modo demostración;
// con backend real estos datos llegan ya calculados desde la API.

export function calcularPosiciones(equipos, partidos, reglas = { puntosVictoria: 3, puntosEmpate: 1 }) {
  const filas = new Map(equipos.map((e) => [e.id, { equipoId: e.id, equipo: e.nombre, logoUrl: e.logoUrl, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 }]))
  partidos.filter((p) => p.estado === 'FINALIZADO').forEach((p) => {
    const l = filas.get(p.localId); const v = filas.get(p.visitanteId)
    if (!l || !v) return
    ;[[l, p.golesLocal, p.golesVisitante], [v, p.golesVisitante, p.golesLocal]].forEach(([f, gf, gc]) => {
      f.pj++; f.gf += gf; f.gc += gc
      if (gf > gc) { f.pg++; f.pts += reglas.puntosVictoria } else if (gf === gc) { f.pe++; f.pts += reglas.puntosEmpate } else f.pp++
    })
  })
  return [...filas.values()].map((f) => ({ ...f, dg: f.gf - f.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.equipo.localeCompare(b.equipo))
    .map((f, i) => ({ ...f, posicion: i + 1 }))
}

export function calcularGoleadores(eventos, jugadores, equipos) {
  const conteo = new Map()
  eventos.filter((e) => e.tipo === 'GOL').forEach((e) => conteo.set(e.jugadorId, (conteo.get(e.jugadorId) || 0) + 1))
  return [...conteo.entries()].map(([jugadorId, goles]) => {
    const j = jugadores.find((x) => x.id === jugadorId)
    return { jugadorId, jugador: j ? `${j.nombre} ${j.apellidos}`.trim() : 'Jugador', equipo: equipos.find((e) => e.id === j?.equipoId)?.nombre || '', goles }
  }).sort((a, b) => b.goles - a.goles || a.jugador.localeCompare(b.jugador)).map((g, i) => ({ ...g, posicion: i + 1 }))
}

/** Suspensión por roja directa (1 partido) o por acumular `limiteAmarillas` amarillas. */
export function calcularSuspensiones(partidos, eventos, jugadores, equipos, limiteAmarillas = 3) {
  const finalizados = partidos.filter((p) => p.estado === 'FINALIZADO').sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha))
  const jugoDespues = (equipoId, partido) => finalizados.some((p) => p.id !== partido.id && p.jornada > partido.jornada && (p.localId === equipoId || p.visitanteId === equipoId))
  const resultado = []
  jugadores.forEach((j) => {
    const mios = eventos.filter((e) => e.jugadorId === j.id)
    const roja = finalizados.filter((p) => mios.some((e) => e.partidoId === p.id && e.tipo === 'ROJA')).pop()
    const amarillas = mios.filter((e) => e.tipo === 'AMARILLA').length
    const nombre = `${j.nombre} ${j.apellidos}`.trim(); const equipo = equipos.find((e) => e.id === j.equipoId)?.nombre || ''
    if (roja && !jugoDespues(j.equipoId, roja)) resultado.push({ jugadorId: j.id, jugador: nombre, equipo, motivo: 'ROJA_DIRECTA', amarillas, partidosRestantes: 1 })
    else if (amarillas && amarillas % limiteAmarillas === 0) {
      const ultima = finalizados.filter((p) => mios.some((e) => e.partidoId === p.id && e.tipo === 'AMARILLA')).pop()
      if (ultima && !jugoDespues(j.equipoId, ultima)) resultado.push({ jugadorId: j.id, jugador: nombre, equipo, motivo: 'ACUMULACION_AMARILLAS', amarillas, partidosRestantes: 1 })
    }
  })
  return resultado
}
