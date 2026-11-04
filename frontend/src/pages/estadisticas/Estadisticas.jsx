import { useState } from 'react'
import ModoDemo from '../../components/ModoDemo'
import SelectorTorneo from '../../components/SelectorTorneo'
import useDatos from '../../hooks/useDatos'
import useTorneoElegido from '../../hooks/useTorneoElegido'
import { obtenerGoleadores, obtenerPosiciones, obtenerSuspensiones } from '../../database/servicios'

const MOTIVOS = { ROJA_DIRECTA: 'Tarjeta roja', ACUMULACION_AMARILLAS: 'Acumulación de amarillas', DISCIPLINARIA: 'Sanción disciplinaria' }

export default function Estadisticas() {
  const { torneos, torneoId, torneo, setTorneoId } = useTorneoElegido()
  const [tab, setTab] = useState('tabla')
  const { datos, cargando, error } = useDatos(async () => {
    if (!torneoId) return { posiciones: [], goleadores: [], suspensiones: [] }
    const [posiciones, goleadores, suspensiones] = await Promise.all([obtenerPosiciones(torneoId), obtenerGoleadores(torneoId), obtenerSuspensiones(torneoId)])
    return { posiciones, goleadores, suspensiones }
  }, [torneoId], { posiciones: [], goleadores: [], suspensiones: [] })
  const lider = datos.posiciones[0]
  const golesTotales = datos.posiciones.reduce((s, f) => s + f.gf, 0)

  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">COMPETENCIA · ESTADÍSTICAS</span><h1>Estadísticas</h1><p>Tabla general, goleo y sanciones. Se actualizan solas al cerrar cada cédula arbitral.</p></div><SelectorTorneo torneos={torneos} value={torneoId} onChange={setTorneoId} /></header>
    <ModoDemo />
    {error && <p className="mx-alert error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p>}
    <div className="mx-stats">
      <div className="mx-stat"><span><i className="pi pi-star" /> Líder</span><b style={{ fontSize: 19 }}>{lider && lider.pj ? lider.equipo : '—'}</b></div>
      <div className="mx-stat"><span><i className="pi pi-bullseye" /> Goles anotados</span><b>{golesTotales}</b></div>
      <div className="mx-stat"><span><i className="pi pi-user" /> Goleador</span><b style={{ fontSize: 19 }}>{datos.goleadores[0]?.jugador || '—'}</b></div>
      <div className="mx-stat"><span><i className="pi pi-ban" /> Suspendidos</span><b>{datos.suspensiones.length}</b></div>
    </div>
    <div className="mx-card" style={{ padding: 0 }}>
      <div className="mx-tabs" role="tablist">{[['tabla', 'pi-list', 'Tabla general'], ['goleo', 'pi-bullseye', 'Goleadores'], ['sanciones', 'pi-ban', 'Sanciones']].map(([id, icono, texto]) => <button key={id} role="tab" aria-selected={tab === id} className={`mx-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}><i className={`pi ${icono}`} />{texto}</button>)}</div>
      <div style={{ padding: 18 }}>
        {cargando && <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando…</p>}
        {!cargando && tab === 'tabla' && (datos.posiciones.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>#</th><th>EQUIPO</th><th className="num">PJ</th><th className="num">PG</th><th className="num">PE</th><th className="num">PP</th><th className="num">GF</th><th className="num">GC</th><th className="num">DG</th><th className="num">PTS</th></tr></thead><tbody>{datos.posiciones.map((f) => <tr key={f.equipoId}><td><span className={`mx-pos ${f.posicion === 1 && f.pj ? 'top' : ''}`}>{f.posicion}</span></td><td><b>{f.equipo}</b></td><td className="num">{f.pj}</td><td className="num">{f.pg}</td><td className="num">{f.pe}</td><td className="num">{f.pp}</td><td className="num">{f.gf}</td><td className="num">{f.gc}</td><td className="num">{f.dg > 0 ? `+${f.dg}` : f.dg}</td><td className="num strong">{f.pts}</td></tr>)}</tbody></table></div> : <div className="mx-empty"><i className="pi pi-list" />Aún no hay equipos inscritos y pagados en este torneo.</div>)}
        {!cargando && tab === 'goleo' && (datos.goleadores.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>#</th><th>JUGADOR</th><th>EQUIPO</th><th className="num">GOLES</th></tr></thead><tbody>{datos.goleadores.map((g, i) => <tr key={g.jugadorId}><td><span className={`mx-pos ${i === 0 ? 'top' : ''}`}>{g.posicion || i + 1}</span></td><td><b>{g.jugador}</b></td><td>{g.equipo}</td><td className="num strong">{g.goles}</td></tr>)}</tbody></table></div> : <div className="mx-empty"><i className="pi pi-bullseye" />Todavía no se registran goles.</div>)}
        {!cargando && tab === 'sanciones' && (datos.suspensiones.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>JUGADOR</th><th>EQUIPO</th><th>MOTIVO</th><th>PARTIDOS POR CUMPLIR</th></tr></thead><tbody>{datos.suspensiones.map((s) => <tr key={`${s.jugadorId}-${s.motivo}`}><td><b>{s.jugador}</b></td><td>{s.equipo}</td><td><span className="mx-chip bad">{MOTIVOS[s.motivo] || s.motivo}</span></td><td>{s.partidosRestantes}</td></tr>)}</tbody></table></div> : <div className="mx-empty"><i className="pi pi-check-circle" />No hay jugadores suspendidos{torneo ? ` en ${torneo.nombre}` : ''}.</div>)}
        <p className="mx-muted" style={{ margin: '14px 0 0' }}>{tab === 'tabla' && `Puntos: ${torneo?.puntosVictoria ?? 3} por victoria y ${torneo?.puntosEmpate ?? 1} por empate. Desempate: diferencia de goles y goles a favor.`}{tab === 'sanciones' && `Se suspende automáticamente por tarjeta roja o al acumular ${torneo?.limiteAmarillas ?? 3} amarillas.`}</p>
      </div>
    </div>
  </section>
}
