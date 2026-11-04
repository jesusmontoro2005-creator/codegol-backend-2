import { useMemo, useState } from 'react'
import ModoDemo from '../../components/ModoDemo'
import { hoyISO } from '../../utils/fechas'
import useConsultaPublica from './hook/useConsultaPublica'
import './ConsultaPublica.css'
import './ConsultaPublicaExtra.css'

function mostrarFecha(fecha) {
  if (!fecha) return 'Por definir'
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}


function TablaGeneral({ filas }) {
  if (!filas.length) return <div className="public-no-teams"><i className="pi pi-info-circle" /> La tabla se mostrará cuando haya equipos inscritos.</div>
  return <div className="pub-table-wrap"><table className="pub-table"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>{filas.map((f) => <tr key={f.equipoId} className={f.posicion === 1 && f.pj ? 'lider' : ''}><td><span className="pub-pos">{f.posicion}</span></td><td className="pub-team">{f.equipo}</td><td>{f.pj}</td><td>{f.pg}</td><td>{f.pe}</td><td>{f.pp}</td><td>{f.gf}</td><td>{f.gc}</td><td>{f.dg > 0 ? `+${f.dg}` : f.dg}</td><td><b>{f.pts}</b></td></tr>)}</tbody></table></div>
}

function Calendario({ partidos }) {
  const jornadas = useMemo(() => [...new Set(partidos.map((p) => p.jornada))].sort((a, b) => a - b), [partidos])
  const sugerida = (partidos.filter((p) => p.estado === 'PROGRAMADO' && p.fecha >= hoyISO()).sort((a, b) => a.jornada - b.jornada)[0]?.jornada) ?? jornadas[0]
  const [elegida, setElegida] = useState(null)
  const actual = elegida ?? sugerida
  if (!jornadas.length) return <div className="public-no-teams"><i className="pi pi-calendar" /> El calendario aún no ha sido publicado.</div>
  const lista = partidos.filter((p) => p.jornada === actual).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
  return <div><div className="pub-jornadas" role="tablist" aria-label="Jornadas">{jornadas.map((j) => <button key={j} role="tab" aria-selected={j === actual} className={j === actual ? 'active' : ''} onClick={() => setElegida(j)}>J{j}</button>)}</div>
    <div className="pub-matches">{lista.map((p) => <article key={p.id} className="pub-match"><div className="pub-when"><b>{String(p.horaInicio).slice(0, 5)}</b><span>{new Date(`${p.fecha}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div><div className="pub-vs"><span>{p.local}</span>{p.estado === 'FINALIZADO' ? <b className="pub-score">{p.golesLocal} - {p.golesVisitante}</b> : <i>VS</i>}<span>{p.visitante}</span></div><span className="pub-field"><i className="pi pi-map-marker" /> {p.cancha}</span></article>)}</div></div>
}

function Goleadores({ lista }) {
  if (!lista.length) return <div className="public-no-teams"><i className="pi pi-info-circle" /> Todavía no se registran goles en este torneo.</div>
  return <div className="pub-table-wrap"><table className="pub-table"><thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead><tbody>{lista.map((g, i) => <tr key={g.jugadorId} className={i === 0 ? 'lider' : ''}><td><span className="pub-pos">{g.posicion || i + 1}</span></td><td className="pub-team">{g.jugador}</td><td>{g.equipo}</td><td><b>{g.goles}</b></td></tr>)}</tbody></table></div>
}

export default function ConsultaPublica({ theme = 'light' }) {
  const consulta = useConsultaPublica()
  const [tab, setTab] = useState('tabla')
  return <section className="public-page public-consultation-embedded" id="consulta-publica" data-theme={theme} aria-labelledby="public-consultation-title">
    <div className="public-content">
      <div className="public-selector-row"><div><span className="public-section-eyebrow">PORTAL PÚBLICO</span><h2 id="public-consultation-title">Consulta los torneos</h2><p className="public-consultation-intro">Elige un torneo para ver la tabla de posiciones, el calendario por jornada y a los goleadores.</p></div>{consulta.categorias.length > 1 && <label className="public-select-wrap"><i className="pi pi-tags" /><select aria-label="Categoría" value={consulta.categoria} onChange={(event) => consulta.seleccionarCategoria(event.target.value)}><option value="">Todas las categorías</option>{consulta.categorias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select><i className="pi pi-chevron-down" /></label>}<label className="public-select-wrap"><i className="pi pi-star-fill" /><select aria-label="Torneo" value={consulta.torneoId} onChange={(event) => consulta.seleccionarTorneo(event.target.value)} disabled={consulta.cargandoTorneos || !consulta.torneos.length}><option value="">Selecciona un torneo</option>{consulta.torneosVisibles.map((torneo) => <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>)}</select><i className="pi pi-chevron-down" /></label></div>
      <ModoDemo />
      {consulta.error && <p className="public-error" role="alert"><i className="pi pi-exclamation-circle" />{consulta.error}</p>}
      {(consulta.cargandoTorneos || consulta.cargandoDetalle) && <div className="public-loading"><i className="pi pi-spin pi-spinner" /> Cargando información…</div>}
      {!consulta.cargandoTorneos && !consulta.torneos.length && !consulta.error && <div className="public-empty"><span><i className="pi pi-calendar-times" /></span><h3>Aún no hay torneos disponibles</h3><p>Cuando se publiquen torneos podrás consultarlos desde aquí.</p></div>}
      {!consulta.cargandoDetalle && consulta.torneo && <><article className="public-tournament-card"><div className="public-tournament-top"><span className="public-trophy-icon"><i className="pi pi-star-fill" /></span><span className="public-status">{consulta.torneo.estado?.replaceAll('_', ' ') || 'ESTADO POR DEFINIR'}</span></div><div className="public-category">{consulta.torneo.categoria?.nombre || 'Categoría'}</div><h3>{consulta.torneo.nombre}</h3><p className="public-description">{consulta.torneo.descripcion || 'Sin descripción disponible.'}</p><div className="public-tournament-meta"><span><i className="pi pi-calendar" /><b>Inicio</b>{mostrarFecha(consulta.torneo.fechaInicio)}</span><span><i className="pi pi-calendar-plus" /><b>Cierre</b>{mostrarFecha(consulta.torneo.fechaFin)}</span><span><i className="pi pi-users" /><b>Equipos inscritos</b>{consulta.equipos.length}</span></div></article>
        <section className="public-teams-section"><div className="pub-tabs" role="tablist">{[['tabla', 'pi-list', 'Tabla general'], ['calendario', 'pi-calendar', 'Calendario'], ['goleo', 'pi-bullseye', 'Goleadores'], ['equipos', 'pi-shield', 'Equipos']].map(([id, icono, texto]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><i className={`pi ${icono}`} /> {texto}</button>)}</div>
          {consulta.actualizadoEn && <p className="public-updated" role="status"><i className="pi pi-sync" /> Actualizado a las {consulta.actualizadoEn.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} · se refresca solo cada 30 s</p>}
          {tab === 'tabla' && <TablaGeneral filas={consulta.posiciones} />}
          {tab === 'calendario' && <Calendario key={consulta.torneoId} partidos={consulta.partidos} />}
          {tab === 'goleo' && <Goleadores lista={consulta.goleadores} />}
          {tab === 'equipos' && <><div className="public-teams-heading"><div><span className="public-section-eyebrow">PARTICIPANTES</span><h2>Equipos inscritos</h2></div><span className="public-team-count">{consulta.equipos.length} equipos</span></div>{consulta.equipos.length ? <div className="public-teams-grid">{consulta.equipos.map((equipo) => <article key={equipo.id} className="public-team-card">{equipo.logoUrl ? <img src={equipo.logoUrl} alt={`Escudo de ${equipo.nombre}`} /> : <span className="public-team-avatar"><i className="pi pi-shield" /></span>}<div><h3>{equipo.nombre}</h3><p>{equipo.torneoNombre || consulta.torneo.nombre}</p></div></article>)}</div> : <div className="public-no-teams"><i className="pi pi-info-circle" /> Aún no se han inscrito equipos en este torneo.</div>}</>}
        </section></>}
    </div>
  </section>
}
