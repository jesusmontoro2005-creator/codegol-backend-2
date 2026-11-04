import { Link } from 'react-router-dom'
import ModoDemo from '../../components/ModoDemo'
import useDatos from '../../hooks/useDatos'
import { actualizarPartido, fechaLarga, hoyISO, listarArbitros, listarPartidos } from '../../database/servicios'

const ROLES = { ROLE_ARBITRO: 'Árbitro', ROLE_MESA_CONTROL: 'Mesa de control' }

export default function Arbitros() {
  const { datos, cargando, error, recargar } = useDatos(async () => {
    const [arbitros, partidos] = await Promise.all([listarArbitros(), listarPartidos()])
    return { arbitros, partidos }
  }, [], { arbitros: [], partidos: [] })
  const proximos = datos.partidos.filter((p) => p.estado === 'PROGRAMADO' && p.fecha >= hoyISO())
  const sinArbitro = proximos.filter((p) => !p.arbitroId)

  async function asignar(partido, arbitroId) { await actualizarPartido(partido.id, { arbitroId: arbitroId ? Number(arbitroId) : null }); recargar() }

  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">ADMINISTRACIÓN · PERSONAL DE CANCHA</span><h1>Árbitros</h1><p>Personal que opera la cédula arbitral en la APK y partidos asignados a cada uno.</p></div><Link className="mx-btn" to="/admin/registro"><i className="pi pi-user-plus" /> Registrar árbitro</Link></header>
    <ModoDemo />
    {error && <p className="mx-alert error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p>}
    <div className="mx-stats"><div className="mx-stat"><span><i className="pi pi-stopwatch" /> Árbitros y mesa</span><b>{datos.arbitros.length}</b></div><div className="mx-stat"><span><i className="pi pi-calendar" /> Partidos por jugar</span><b>{proximos.length}</b></div><div className="mx-stat"><span><i className="pi pi-exclamation-triangle" /> Sin árbitro asignado</span><b>{sinArbitro.length}</b></div></div>
    <div className="mx-card"><div className="mx-card-head"><h2>Personal registrado</h2></div>
      {cargando ? <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando…</p> : datos.arbitros.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>NOMBRE</th><th>USUARIO</th><th>CORREO</th><th>ROL</th><th className="num">PARTIDOS ASIGNADOS</th></tr></thead><tbody>{datos.arbitros.map((a) => <tr key={a.id}><td><b>{a.nombreCompleto}</b></td><td>{a.username}</td><td>{a.email}</td><td><span className="mx-chip info">{ROLES[a.rol] || a.rol}</span></td><td className="num">{proximos.filter((p) => p.arbitroId === a.id).length}</td></tr>)}</tbody></table></div> : <div className="mx-empty"><i className="pi pi-users" />Aún no hay árbitros. Regístralos con el rol “Árbitro”.</div>}</div>
    <div className="mx-card"><div className="mx-card-head"><h2>Asignación de partidos</h2></div>
      {proximos.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>FECHA</th><th>PARTIDO</th><th>CANCHA</th><th>ÁRBITRO</th></tr></thead><tbody>{proximos.map((p) => <tr key={p.id}><td>{fechaLarga(p.fecha)} · {String(p.horaInicio).slice(0, 5)}</td><td><b>{p.local}</b> vs <b>{p.visitante}</b></td><td>{p.cancha}</td><td><select className="mx-field" style={{ height: 34, border: '1px solid var(--mx-border)', borderRadius: 7, background: 'var(--mx-input)', color: 'var(--mx-text)', padding: '0 8px' }} value={p.arbitroId || ''} onChange={(e) => asignar(p, e.target.value)}><option value="">Sin asignar</option>{datos.arbitros.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="mx-empty"><i className="pi pi-calendar" />No hay partidos programados. Genera un calendario primero.</div>}</div>
  </section>
}
