import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ModoDemo from '../../components/ModoDemo'
import useDatos from '../../hooks/useDatos'
import { fechaLarga, obtenerCedula } from '../../database/servicios'

const ESTADOS = { PROGRAMADO: ['Programado', 'info'], EN_CURSO: ['En juego', 'warn'], FINALIZADO: ['Finalizado', 'ok'], SUSPENDIDO: ['Suspendido', 'bad'], CANCELADO: ['Cancelado', 'bad'] }
const PASE = {
  AUTORIZADO: ['Autorizado', 'ok', 'pi-check'],
  HUELLA_NO_COINCIDE: ['Huella no coincide', 'bad', 'pi-times'],
  SUSPENDIDO: ['Suspendido: no puede alinear', 'bad', 'pi-ban'],
}
const EVENTO = {
  GOL: ['Gol', 'pi-bullseye', 'ok'], GOL_PROPIO: ['Autogol', 'pi-bullseye', 'warn'], AMARILLA: ['Tarjeta amarilla', 'pi-bookmark-fill', 'warn'],
  ROJA: ['Tarjeta roja', 'pi-bookmark-fill', 'bad'], FALTA: ['Falta', 'pi-flag', ''], CAMBIO: ['Cambio', 'pi-sync', 'info'],
}

function PaseDeLista({ equipo, plantilla, pases }) {
  const porJugador = new Map(pases.map((p) => [p.jugadorId, p]))
  const autorizados = pases.filter((p) => p.resultado === 'AUTORIZADO').length
  return <div className="mx-card">
    <div className="mx-card-head"><div><h2>{equipo}</h2><p className="mx-card-sub" style={{ margin: 0 }}>{autorizados} de {plantilla.length} jugadores autorizados para alinear</p></div></div>
    <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>#</th><th>JUGADOR</th><th>PASE DE LISTA</th><th className="num">TIEMPO</th></tr></thead><tbody>
      {plantilla.map((j) => {
        const pase = porJugador.get(j.jugadorId)
        const [texto, tono, icono] = pase ? PASE[pase.resultado] || [pase.resultado, '', 'pi-info-circle'] : j.suspendido ? PASE.SUSPENDIDO : ['Sin pasar lista', '', 'pi-clock']
        return <tr key={j.jugadorId}><td>{j.dorsal || '—'}</td><td><b>{j.jugador}</b>{!j.huella && <small className="mx-muted"> · sin huella registrada</small>}</td>
          <td><span className={`mx-chip ${tono}`}><i className={`pi ${icono}`} /> {texto}</span>{pase?.metodo === 'MANUAL' && <small className="mx-muted"> · validación manual</small>}</td>
          <td className="num">{pase?.tiempoMs != null ? <span className={pase.tiempoMs > 3000 ? 'mx-slow' : ''} title="Meta: menos de 3 segundos">{(pase.tiempoMs / 1000).toFixed(1)} s</span> : '—'}</td></tr>
      })}
    </tbody></table></div></div>
}

export default function Cedula() {
  const { id } = useParams()
  const { datos, error, recargar } = useDatos(() => obtenerCedula(id), [id], null)
  const p = datos?.partido
  const enVivo = p?.estado === 'EN_CURSO'

  // Mientras el partido está en juego la cédula se refresca sola cada 15 s (la APK va sincronizando).
  useEffect(() => {
    if (!enVivo) return undefined
    const timer = window.setInterval(recargar, 15000)
    return () => window.clearInterval(timer)
  }, [enVivo, recargar])

  if (error && !datos) return <section className="mx-page"><p className="mx-alert error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p><Link className="mx-btn ghost" to="/admin/calendario"><i className="pi pi-arrow-left" /> Volver al calendario</Link></section>
  if (!datos) return <section className="mx-page"><p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando cédula…</p></section>

  const [etiqueta, tono] = ESTADOS[p.estado] || [p.estado, '']
  const tarjetas = { amarillas: datos.eventos.filter((e) => e.tipo === 'AMARILLA').length, rojas: datos.eventos.filter((e) => e.tipo === 'ROJA').length }
  const bloqueados = datos.pases.filter((x) => x.resultado !== 'AUTORIZADO').length

  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">COMPETENCIA · CÉDULA ARBITRAL</span><h1>{p.local} vs {p.visitante}</h1><p>{p.torneo} · Jornada {p.jornada} · {fechaLarga(p.fecha)} {String(p.horaInicio).slice(0, 5)} · {p.cancha}</p></div>
      <div className="mx-actions"><button className="mx-btn ghost" onClick={recargar}><i className="pi pi-refresh" /> Actualizar</button><Link className="mx-btn ghost" to="/admin/calendario"><i className="pi pi-arrow-left" /> Calendario</Link></div></header>
    <ModoDemo />
    {error && <p className="mx-alert error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p>}

    <div className="mx-card mx-scoreboard"><div className="mx-sb-team"><b>{p.local}</b></div>
      <div className="mx-sb-score"><span>{p.golesLocal}</span><i>-</i><span>{p.golesVisitante}</span></div>
      <div className="mx-sb-team"><b>{p.visitante}</b></div>
      <div className="mx-match-meta" style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>
        <span className={`mx-chip ${tono}`}>{enVivo && <i className="pi pi-circle-fill" style={{ fontSize: 8 }} />} {etiqueta}</span>
        <span className="mx-chip"><i className="pi pi-stopwatch" /> {p.arbitro ? `Árbitro: ${p.arbitro}` : 'Sin árbitro asignado'}</span>
        <span className={`mx-chip ${p.arbitrajeCubierto ? 'ok' : 'warn'}`}><i className="pi pi-wallet" /> {p.arbitrajeCubierto ? 'Arbitraje cubierto' : `Arbitraje pendiente (${p.equiposPagados ?? 0}/2)`}</span></div></div>

    {p.estado === 'PROGRAMADO' && !p.arbitrajeCubierto && <p className="mx-alert warn"><i className="pi pi-lock" /> La cédula no se podrá abrir en la APK hasta que ambos equipos paguen el arbitraje. <Link to="/admin/finanzas">Ir a Finanzas</Link></p>}
    {p.estado === 'FINALIZADO' && <p className="mx-alert ok"><i className="pi pi-verified" /> Cédula cerrada y sincronizada: la tabla de posiciones, el goleo y las suspensiones ya se actualizaron.</p>}

    <div className="mx-stats">
      <div className="mx-stat"><span><i className="pi pi-bullseye" /> Goles</span><b>{p.golesLocal + p.golesVisitante}</b></div>
      <div className="mx-stat"><span><i className="pi pi-bookmark-fill" /> Amarillas</span><b>{tarjetas.amarillas}</b></div>
      <div className="mx-stat"><span><i className="pi pi-bookmark-fill" /> Rojas</span><b>{tarjetas.rojas}</b></div>
      <div className="mx-stat"><span><i className="pi pi-ban" /> Alineaciones bloqueadas</span><b>{bloqueados}</b></div>
    </div>

    <div className="mx-card"><div className="mx-card-head"><h2>Eventos del partido</h2></div>
      {datos.eventos.length ? <ol className="mx-timeline">{datos.eventos.map((e, i) => { const [texto, icono, color] = EVENTO[e.tipo] || [e.tipo, 'pi-info-circle', '']; return <li key={e.id ?? i}><span className="mx-tl-min">{e.minuto != null ? `${e.minuto}'` : '—'}</span><span className={`mx-chip ${color}`}><i className={`pi ${icono}`} /> {texto}</span><span><b>{e.jugador}</b>{e.dorsal ? ` #${e.dorsal}` : ''} <small className="mx-muted">· {e.equipo}</small></span></li> })}</ol>
        : <div className="mx-empty"><i className="pi pi-clock" />{p.estado === 'PROGRAMADO' ? 'El partido aún no inicia.' : 'Todavía no se registran eventos.'}</div>}</div>

    <h2 style={{ font: '700 17px Manrope, sans-serif', margin: '4px 0 0' }}>Pase de lista biométrico</h2>
    <p className="mx-muted" style={{ margin: '-8px 0 0' }}>Se valida con la huella en la APK antes del partido (meta: menos de 3 segundos). Los jugadores con suspensión vigente o huella que no coincide quedan bloqueados.</p>
    <div className="mx-two-cols">{datos.plantillas.map((pl) => <PaseDeLista key={pl.equipoId} equipo={pl.equipo} plantilla={pl.jugadores} pases={datos.pases.filter((x) => x.equipoId === pl.equipoId)} />)}</div>
  </section>
}
