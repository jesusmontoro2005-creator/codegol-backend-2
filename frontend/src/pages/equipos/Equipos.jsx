import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ModoDemo from '../../components/ModoDemo'
import useDatos from '../../hooks/useDatos'
import { listarJugadores, moneda } from '../../database/servicios'
import { validarEquipo } from '../../utils/validaciones'
import { editarEquipo, obtenerEquipos, obtenerEquiposDeTorneo, obtenerTorneos } from '../torneos/hook/torneos'

export default function Equipos() {
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [editando, setEditando] = useState(null)
  const [errorEdicion, setErrorEdicion] = useState('')
  const { datos, cargando, error, recargar } = useDatos(async () => {
    const [equipos, torneos, jugadores] = await Promise.all([obtenerEquipos(), obtenerTorneos(), listarJugadores()])
    const inscripciones = (await Promise.all(torneos.map(async (t) => (await obtenerEquiposDeTorneo(t.id)).map((e) => ({ ...e, torneo: t }))))).flat()
    return { equipos, torneos, jugadores, inscripciones }
  }, [], { equipos: [], torneos: [], jugadores: [], inscripciones: [] })

  const filas = useMemo(() => datos.equipos
    .filter((e) => `${e.nombre} ${e.delegado || ''}`.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .map((e) => ({ ...e, plantilla: datos.jugadores.filter((j) => j.equipoId === e.id), torneos: datos.inscripciones.filter((i) => i.id === e.id) })), [datos, busqueda])
  const equipo = filas.find((e) => e.id === seleccionado)
  const sinHuella = datos.jugadores.filter((j) => !j.huella).length

  async function guardarEdicion(event) {
    event.preventDefault(); setErrorEdicion('')
    const f = new FormData(event.currentTarget)
    const campos = { nombre: String(f.get('nombre')).trim().replace(/\s+/g, ' '), delegado: String(f.get('delegado')).trim(), telefono: String(f.get('telefono')).trim(), logoUrl: String(f.get('logoUrl')).trim() }
    const problema = validarEquipo(campos, datos.equipos, editando.id)
    if (problema) { setErrorEdicion(problema); return }
    try {
      await editarEquipo(editando.id, { nombre: campos.nombre, delegado: campos.delegado || null, telefono: campos.telefono || null, logoUrl: campos.logoUrl || null })
      setEditando(null); recargar()
    } catch (e) { setErrorEdicion(e.message) }
  }

  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">ADMINISTRACIÓN · EQUIPOS</span><h1>Equipos</h1><p>Consulta equipos, delegados, plantillas y estado de inscripción.</p></div><div className="mx-actions"><button className="mx-btn ghost" onClick={recargar}><i className="pi pi-refresh" /> Actualizar</button><Link className="mx-btn" to="/admin/torneos"><i className="pi pi-user-plus" /> Inscribir equipo</Link></div></header>
    <ModoDemo />
    {error && <p className="mx-alert error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p>}
    <div className="mx-stats">
      <div className="mx-stat"><span><i className="pi pi-shield" /> Equipos registrados</span><b>{datos.equipos.length}</b></div>
      <div className="mx-stat"><span><i className="pi pi-check-circle" /> Inscripciones pagadas</span><b>{datos.inscripciones.filter((i) => i.pagoInscripcionCubierto).length}</b></div>
      <div className="mx-stat"><span><i className="pi pi-clock" /> Pagos pendientes</span><b>{datos.inscripciones.filter((i) => !i.pagoInscripcionCubierto).length}</b></div>
      <div className="mx-stat"><span><i className="pi pi-id-card" /> Jugadores sin huella</span><b>{sinHuella}</b></div>
    </div>
    <div className="mx-toolbar"><label className="mx-field" style={{ minWidth: 260 }}>Buscar<input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Equipo o delegado" /></label></div>
    {cargando && <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando equipos…</p>}
    {!cargando && !filas.length && <div className="mx-empty"><i className="pi pi-shield" />No hay equipos que coincidan.</div>}
    <div className="mx-team-grid">{filas.map((e) => <button key={e.id} className={`mx-team ${seleccionado === e.id ? 'selected' : ''}`} onClick={() => setSeleccionado(seleccionado === e.id ? null : e.id)}>
      <div className="mx-team-top"><span className="mx-avatar">{e.logoUrl ? <img src={e.logoUrl} alt="" /> : <i className="pi pi-shield" />}</span><div><b>{e.nombre}</b><br /><small>{e.delegado || 'Delegado pendiente'}{e.telefono ? ` · ${e.telefono}` : ''}</small></div></div>
      <div className="mx-actions">{e.torneos.length ? e.torneos.map((i) => <span key={i.torneoId} className={`mx-chip ${i.pagoInscripcionCubierto ? 'ok' : 'warn'}`}>{i.torneoNombre} · {i.pagoInscripcionCubierto ? 'Inscrito' : 'Pago pendiente'}</span>) : <span className="mx-chip">Sin torneo</span>}</div>
      <small><i className="pi pi-users" /> {e.plantilla.length} jugadores</small>
    </button>)}</div>
    {equipo && <section className="mx-card"><div className="mx-card-head"><div><h2>Plantilla de {equipo.nombre}</h2><p className="mx-card-sub" style={{ margin: 0 }}>{equipo.torneos.map((i) => `${i.torneoNombre} (cuota ${moneda(i.torneo.cuotaInscripcion)})`).join(' · ') || 'Aún sin torneo'}</p></div><div className="mx-actions"><button className="mx-btn ghost small" onClick={() => { setErrorEdicion(''); setEditando(equipo) }}><i className="pi pi-pencil" /> Editar equipo</button><Link className="mx-btn ghost small" to="/admin/jugadores"><i className="pi pi-users" /> Administrar jugadores</Link></div></div>
      {equipo.plantilla.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>#</th><th>JUGADOR</th><th>POSICIÓN</th><th>HUELLA</th></tr></thead><tbody>{equipo.plantilla.map((j) => <tr key={j.id}><td>{j.dorsal || '—'}</td><td><b>{j.nombre} {j.apellidos}</b></td><td>{j.posicion}</td><td><span className={`mx-chip ${j.huella ? 'ok' : 'warn'}`}><i className={`pi ${j.huella ? 'pi-check' : 'pi-clock'}`} /> {j.huella ? 'Registrada' : 'Pendiente'}</span></td></tr>)}</tbody></table></div> : <p className="mx-empty">Este equipo todavía no tiene jugadores.</p>}</section>}
    {editando && <div className="mx-modal-bg" role="dialog" aria-modal="true" aria-label="Editar equipo"><form className="mx-modal" onSubmit={guardarEdicion} noValidate><h2>Editar equipo</h2>
      <div className="mx-form-grid"><label className="mx-field">Nombre<input name="nombre" defaultValue={editando.nombre} required maxLength={100} /></label><label className="mx-field">Delegado<input name="delegado" defaultValue={editando.delegado || ''} maxLength={100} /></label><label className="mx-field">Teléfono<input name="telefono" type="tel" defaultValue={editando.telefono || ''} maxLength={20} /></label><label className="mx-field">Logo (URL)<input name="logoUrl" type="url" defaultValue={editando.logoUrl || ''} placeholder="https://…" /></label></div>
      {errorEdicion && <p className="mx-alert error" role="alert" style={{ marginTop: 12 }}>{errorEdicion}</p>}
      <div className="mx-actions" style={{ marginTop: 16 }}><button className="mx-btn">Guardar cambios</button><button type="button" className="mx-btn ghost" onClick={() => setEditando(null)}>Cancelar</button></div></form></div>}
  </section>
}
