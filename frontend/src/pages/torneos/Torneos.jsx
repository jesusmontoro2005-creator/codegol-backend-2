import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ModoDemo from '../../components/ModoDemo'
import { moneda } from '../../database/servicios'
import { sinEspaciosExtra, validarInscripcionEquipo, validarNombreCatalogo, validarTorneo } from '../../utils/validaciones'
import useTorneos from './hook/useTorneos'
import './Torneos.css'
import './TorneosSummary.css'

function fechaCorta(value) {
  if (!value) return 'Sin fecha de cierre'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Cada vez que aparece un aviso se lleva a la vista, para que nunca "no pase nada" aunque estés abajo en la página.
function EstadoMensaje({ error, mensaje }) {
  const ref = useRef(null)
  useEffect(() => { if (error || mensaje) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [error, mensaje])
  if (error) return <p ref={ref} className="tournament-alert is-error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p>
  if (mensaje) return <p ref={ref} className="tournament-alert is-success" role="status"><i className="pi pi-check-circle" />{mensaje}</p>
  return null
}

function AvisoEquipo({ aviso }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [aviso])
  return <p ref={ref} className={`tournament-alert ${aviso.tipo === 'ok' ? 'is-success' : 'is-error'}`} role={aviso.tipo === 'ok' ? 'status' : 'alert'}><i className={`pi ${aviso.tipo === 'ok' ? 'pi-check-circle' : 'pi-exclamation-circle'}`} />{aviso.texto}</p>
}

export default function Torneos() {
  const data = useTorneos()
  const [errorLocal, setErrorLocal] = useState('')
  const [avisoEquipo, setAvisoEquipo] = useState(null)
  const torneoActual = data.torneoDetalle || data.torneos.find((torneo) => String(torneo.id) === data.torneoSeleccionado)

  function enviarCategoria(event) {
    event.preventDefault(); setErrorLocal('')
    const formulario = event.currentTarget
    const form = new FormData(formulario)
    const problema = validarNombreCatalogo(form.get('nombre'), data.categorias, 'El nombre de la categoría') || (String(form.get('descripcion') || '').length > 200 ? 'La descripción no puede pasar de 200 caracteres.' : '')
    if (problema) { setErrorLocal(problema); return }
    data.guardarCategoria({ nombre: sinEspaciosExtra(form.get('nombre')), descripcion: String(form.get('descripcion') || '') }).then((ok) => ok && formulario.reset())
  }

  function enviarTorneo(event) {
    event.preventDefault(); setErrorLocal('')
    const formulario = event.currentTarget
    const form = new FormData(formulario)
    const datos = { nombre: sinEspaciosExtra(form.get('nombre')), descripcion: form.get('descripcion'), categoriaId: form.get('categoriaId'), fechaInicio: form.get('fechaInicio'), fechaFin: form.get('fechaFin'), estado: form.get('estado'), cuotaInscripcion: form.get('cuotaInscripcion'), cuotaArbitraje: form.get('cuotaArbitraje'), limiteAmarillas: form.get('limiteAmarillas') }
    const problema = validarTorneo(datos, data.torneos)
    if (problema) { setErrorLocal(problema); return }
    data.guardarTorneo(datos).then((ok) => ok && formulario.reset())
  }

  async function enviarEquipo(event) {
    event.preventDefault(); setErrorLocal(''); setAvisoEquipo(null)
    const formulario = event.currentTarget
    const form = new FormData(formulario)
    const datos = { nombre: sinEspaciosExtra(form.get('nombre')), delegado: sinEspaciosExtra(form.get('delegado')), telefono: String(form.get('telefono') || '').trim(), logoUrl: String(form.get('logoUrl') || '').trim(), pagoInscripcionCubierto: form.get('pagoInscripcionCubierto') === 'on' }
    if (['FINALIZADO', 'CANCELADO'].includes(torneoActual?.estado)) { setAvisoEquipo({ tipo: 'error', texto: 'Este torneo ya está cerrado: no admite nuevas inscripciones.' }); return }
    if (data.equiposInscritos.some((e) => sinEspaciosExtra(e.nombre).toLowerCase() === datos.nombre.toLowerCase())) { setAvisoEquipo({ tipo: 'error', texto: `"${datos.nombre}" ya está inscrito en este torneo.` }); return }
    const problema = validarInscripcionEquipo(datos)
    if (problema) { setAvisoEquipo({ tipo: 'error', texto: problema }); return }
    const r = await data.guardarEquipo(datos)
    if (r.ok) { formulario.reset(); setAvisoEquipo({ tipo: 'ok', texto: `"${datos.nombre}" quedó inscrito en ${torneoActual?.nombre || 'el torneo'}${datos.pagoInscripcionCubierto ? ' con la inscripción pagada.' : '. Su pago queda pendiente: cóbralo en Finanzas para que entre al calendario.'} Ya aparece en la lista “Equipos inscritos” de arriba y en la sección Equipos.` }) }
    else setAvisoEquipo({ tipo: 'error', texto: r.error })
  }

  return <main className="tournaments-page">
    <header className="tournaments-heading"><div><span className="tournaments-eyebrow">· ADMINISTRACIÓN DE COMPETENCIAS</span><h1>Torneos y categorías</h1><p>Crea categorías, organiza torneos e inscribe equipos.</p></div><button className="tournament-refresh" onClick={data.recargar} disabled={data.cargando}><i className={`pi ${data.cargando ? 'pi-spin pi-spinner' : 'pi pi-refresh'}`} /> Actualizar</button></header>
    <ModoDemo />
    <EstadoMensaje error={errorLocal || data.error} mensaje={errorLocal ? '' : data.mensaje} />
    {data.cargando && <div className="tournaments-loading"><i className="pi pi-spin pi-spinner" /> Consultando el backend…</div>}
    <section className="tournament-summary" aria-label="Resumen de torneos"><article><i className="pi pi-tags" /><span>Categorías</span><b>{data.categorias.length}</b></article><article><i className="pi pi-star-fill" /><span>Torneos</span><b>{data.torneos.length}</b></article><article><i className="pi pi-shield" /><span>Equipos registrados</span><b>{data.equipos.length}</b></article><article><i className="pi pi-users" /><span>Inscritos en torneo</span><b>{data.equiposInscritos.length}</b></article></section>

    <section className="tournament-panel category-panel"><div className="tournament-panel-heading"><span className="panel-icon teal-icon"><i className="pi pi-tags" /></span><div><h2>Categorías</h2><p>Las categorías disponibles para crear torneos.</p></div><span className="count-chip">{data.categorias.length}</span></div>
      <div className="category-content"><div className="category-list">{data.categorias.length ? data.categorias.map((categoria) => <article className="category-item" key={categoria.id ?? categoria.nombre}><span className="category-bullet"><i className="pi pi-tag" /></span><div><b>{categoria.nombre}</b><small>{categoria.descripcion || 'Sin descripción'}</small></div><span className={`active-chip ${categoria.activa === false ? 'inactive' : ''}`}>{categoria.activa === false ? 'Inactiva' : 'Activa'}</span></article>) : <p className="tournament-empty-inline">Aún no hay categorías registradas.</p>}</div>
        <form className="compact-form category-form" onSubmit={enviarCategoria}><h3>Crear categoría</h3><label>Nombre<input name="nombre" required maxLength="50" placeholder="Ej. Libre varonil" /></label><label>Descripción <span>(opcional)</span><input name="descripcion" placeholder="Descripción breve" /></label><button className="tournament-primary" disabled={data.guardando}><i className="pi pi-plus" /> Crear categoría</button></form></div>
    </section>

    <section className="tournament-panel"><div className="tournament-panel-heading"><span className="panel-icon orange-icon"><i className="pi pi-star-fill" /></span><div><h2>Torneos</h2><p>Selecciona un torneo para revisar sus equipos inscritos.</p></div><span className="count-chip">{data.torneos.length}</span></div>
      <div className="tournament-workspace"><div className="tournament-list">{data.torneos.length ? data.torneos.map((torneo) => <button key={torneo.id} className={`tournament-list-item ${String(torneo.id) === data.torneoSeleccionado ? 'selected' : ''}`} onClick={() => data.seleccionarTorneo(String(torneo.id))}><span className="tournament-item-icon"><i className="pi pi-flag" /></span><span className="tournament-item-copy"><b>{torneo.nombre}</b><small>{torneo.categoria?.nombre || 'Sin categoría'} · {torneo.estado?.replaceAll('_', ' ') || 'Sin estado'}</small></span><i className="pi pi-angle-right" /></button>) : <p className="tournament-empty-inline">Todavía no hay torneos. Puedes crear el primero aquí.</p>}</div>
        <form className="compact-form tournament-form" onSubmit={enviarTorneo}><h3>Crear torneo</h3><label>Nombre del torneo<input name="nombre" required maxLength="100" placeholder="Ej. Copa CODEGOL 2026" /></label><label>Categoría<select name="categoriaId" required defaultValue=""><option value="" disabled>Selecciona una categoría</option>{data.categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</select></label><div className="form-two-columns"><label>Fecha de inicio<input type="date" name="fechaInicio" required /></label><label>Fecha de cierre<input type="date" name="fechaFin" /></label></div><label>Estado<select name="estado" defaultValue="EN_INSCRIPCION"><option value="EN_INSCRIPCION">En inscripción</option><option value="EN_PROGRESO">En progreso</option><option value="FINALIZADO">Finalizado</option><option value="CANCELADO">Cancelado</option></select></label><div className="form-two-columns"><label>Cuota de inscripción (MXN)<input type="number" name="cuotaInscripcion" min="0" step="0.01" defaultValue="0" /><small className="form-help">0 = sin costo.</small></label><label>Cuota de arbitraje por equipo (MXN)<input type="number" name="cuotaArbitraje" min="0" step="0.01" defaultValue="0" /></label></div><label>Amarillas para suspensión<input type="number" name="limiteAmarillas" min="1" max="10" defaultValue="3" /></label><label>Descripción <span>(opcional)</span><textarea name="descripcion" rows="2" placeholder="Detalles del torneo" /></label><button className="tournament-primary" disabled={data.guardando || !data.categorias.length}><i className="pi pi-plus" /> Crear torneo</button>{!data.categorias.length && <small className="form-help">Primero registra una categoría para habilitar la creación de torneos.</small>}</form></div>
    </section>

    {torneoActual && <section className="tournament-panel selected-tournament-panel"><div className="tournament-panel-heading"><span className="panel-icon teal-icon"><i className="pi pi-shield" /></span><div><h2>{torneoActual.nombre}</h2><p>{torneoActual.categoria?.nombre || 'Categoría sin indicar'} · {torneoActual.estado?.replaceAll('_', ' ') || 'Estado sin indicar'}</p></div><span className="count-chip">{data.equiposInscritos.length} equipos</span></div><div className="selected-tournament-meta"><span><i className="pi pi-calendar" /> {fechaCorta(torneoActual.fechaInicio)} — {fechaCorta(torneoActual.fechaFin)}</span><p>{torneoActual.descripcion || 'Este torneo no tiene descripción.'}</p><p><i className="pi pi-wallet" /> Inscripción {moneda(torneoActual.cuotaInscripcion)} · Arbitraje {moneda(torneoActual.cuotaArbitraje)} por equipo · Suspensión a las {torneoActual.limiteAmarillas ?? 3} amarillas</p><div className="form-two-columns" style={{ alignItems: 'end', margin: '8px 0' }}><label>Estado del torneo<select style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--mx-border, #e5e5ee)', padding: '0 10px', font: 'inherit' }} value={torneoActual.estado} disabled={data.guardando} onChange={(e) => { if (e.target.value !== torneoActual.estado && window.confirm(`¿Cambiar el torneo a "${e.target.value.replaceAll('_', ' ').toLowerCase()}"?`)) data.cambiarEstado(e.target.value) }}><option value="EN_INSCRIPCION">En inscripción</option><option value="EN_PROGRESO">En progreso</option><option value="FINALIZADO">Finalizado</option><option value="CANCELADO">Cancelado</option></select></label><small className="form-help">Pasa a “En progreso” cuando cierren las inscripciones y empiece el calendario.</small></div><div className="tournament-links"><Link to="/admin/calendario"><i className="pi pi-calendar" /> Calendario</Link><Link to="/admin/estadisticas"><i className="pi pi-chart-bar" /> Estadísticas</Link><Link to="/admin/finanzas"><i className="pi pi-wallet" /> Cobros</Link></div></div>
        <div className="registered-teams"><h3>Equipos inscritos</h3>{data.equiposInscritos.length ? <div className="registered-team-list">{data.equiposInscritos.map((equipo) => <article key={equipo.id} className="registered-team"><span className="team-avatar"><i className="pi pi-shield" /></span><div><b>{equipo.nombre}</b><small>{equipo.delegado || 'Delegado pendiente'}{equipo.telefono ? ` · ${equipo.telefono}` : ''}</small></div><span className={`payment-chip ${equipo.pagoInscripcionCubierto ? 'paid' : ''}`}>{equipo.pagoInscripcionCubierto ? 'Pago cubierto' : 'Pago pendiente'}</span></article>)}</div> : <p className="tournament-empty-inline">Este torneo aún no tiene equipos inscritos.</p>}</div>
        <form className="compact-form team-form" onSubmit={enviarEquipo} noValidate><h3>Inscribir equipo</h3><div className="team-form-grid"><label>Nombre del equipo<input name="nombre" required maxLength="100" placeholder="Ej. Deportivo Central" autoComplete="off" /><small className="form-help">Letras y números (no solo números).</small></label><label>Nombre del delegado<input name="delegado" required maxLength="100" placeholder="Ej. Ana López" autoComplete="off" /><small className="form-help">Solo letras y espacios.</small></label><label>Teléfono<input name="telefono" required maxLength="14" type="tel" inputMode="numeric" placeholder="10 dígitos, ej. 5512345678" autoComplete="off" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^\d\s()+-]/g, '') }} /><small className="form-help">Exactamente 10 dígitos.</small></label><label>Logo (URL) <span>(opcional)</span><input name="logoUrl" type="text" placeholder="https://…" autoComplete="off" /></label><label className="checkbox-label"><input type="checkbox" name="pagoInscripcionCubierto" /> Pago de inscripción cubierto</label></div>
          {avisoEquipo && <AvisoEquipo aviso={avisoEquipo} />}
          <button className="tournament-primary" disabled={data.guardando}><i className={`pi ${data.guardando ? 'pi-spin pi-spinner' : 'pi-user-plus'}`} /> {data.guardando ? 'Inscribiendo…' : 'Inscribir equipo'}</button></form>
      </section>}
  </main>
}
