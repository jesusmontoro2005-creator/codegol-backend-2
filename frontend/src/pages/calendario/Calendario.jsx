import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ModoDemo from '../../components/ModoDemo'
import SelectorTorneo from '../../components/SelectorTorneo'
import useDatos from '../../hooks/useDatos'
import useTorneoElegido from '../../hooks/useTorneoElegido'
import { actualizarPartido, borrarCalendario, crearPartido, eliminarPartido, fechaLarga, generarCalendario, hoyISO, listarArbitros, listarCanchas, listarPartidos } from '../../database/servicios'
import { aMinutos, deMinutos, motivoTraslape } from '../../utils/calendario'
import { sumarDias } from '../../utils/fechas'
import { obtenerEquiposDeTorneo } from '../torneos/hook/torneos'

const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const ESTADOS = { PROGRAMADO: ['Programado', 'info'], EN_CURSO: ['En juego', 'warn'], FINALIZADO: ['Finalizado', 'ok'], SUSPENDIDO: ['Suspendido', 'bad'], CANCELADO: ['Cancelado', 'bad'] }
const finDeSemana = () => sumarDias(hoyISO(), (6 - new Date().getDay() + 7) % 7 || 7)

export default function Calendario() {
  const { torneos, torneoId, torneo, setTorneoId, error: errorTorneos } = useTorneoElegido()
  const { datos, cargando, error, recargar } = useDatos(async () => {
    if (!torneoId) return { todos: [], canchas: [], equipos: [], arbitros: [] }
    const [todos, canchas, equipos, arbitros] = await Promise.all([listarPartidos(), listarCanchas(), obtenerEquiposDeTorneo(torneoId), listarArbitros()])
    return { todos, canchas, equipos, arbitros }
  }, [torneoId], { todos: [], canchas: [], equipos: [], arbitros: [] })
  const [panel, setPanel] = useState('')
  const [aviso, setAviso] = useState(null)
  const avisoRef = useRef(null)
  useEffect(() => { if (aviso) avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [aviso])
  const [trabajando, setTrabajando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [gen, setGen] = useState({ fechaInicio: finDeSemana(), diasEntreJornadas: 7, horarios: ['10:00', '11:00', '12:00'], duracionMin: 60, canchaIds: null, dobleVuelta: false })
  const [manual, setManual] = useState({ jornada: 1, fecha: hoyISO(), horaInicio: '10:00', duracionMin: 60, canchaId: '', localId: '', visitanteId: '' })

  const partidos = useMemo(() => datos.todos.filter((p) => String(p.torneoId) === String(torneoId)), [datos.todos, torneoId])
  const jornadas = useMemo(() => { const m = new Map(); partidos.forEach((p) => m.set(p.jornada, [...(m.get(p.jornada) || []), p])); return [...m.entries()].sort((a, b) => a[0] - b[0]) }, [partidos])
  const pagados = datos.equipos.filter((e) => e.pagoInscripcionCubierto)
  const canchasElegidas = gen.canchaIds ?? datos.canchas.map((c) => c.id)
  const programados = partidos.filter((p) => p.estado === 'PROGRAMADO').length
  const jugados = partidos.length - programados // finalizados, en curso, suspendidos o cancelados
  const sinEquipos = pagados.length < 2

  const nombreEquipo = (id) => datos.equipos.find((e) => String(e.id) === String(id))?.nombre
  async function ejecutar(accion, textoOk) {
    setTrabajando(true); setAviso(null)
    try { const r = await accion(); setAviso({ tipo: 'ok', texto: typeof textoOk === 'function' ? textoOk(r) : textoOk }); recargar(); return true }
    catch (e) { setAviso({ tipo: e.status === 409 ? 'warn' : 'error', texto: e.message }); return false }
    finally { setTrabajando(false) }
  }

  function alternar(lista, valor) { return lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor].sort((a, b) => (a > b ? 1 : -1)) }

  async function enviarGenerar(event) {
    event.preventDefault()
    if (programados && !window.confirm(`Se reemplazarán los ${programados} partidos programados de este torneo. ¿Continuar?`)) return
    if (!gen.horarios.length || !canchasElegidas.length) { setAviso({ tipo: 'error', texto: 'Elige al menos un horario y una cancha.' }); return }
    if (!gen.fechaInicio || gen.fechaInicio < hoyISO()) { setAviso({ tipo: 'error', texto: 'La primera jornada no puede ser en una fecha pasada.' }); return }
    if (!(Number(gen.diasEntreJornadas) >= 1 && Number(gen.diasEntreJornadas) <= 30)) { setAviso({ tipo: 'error', texto: 'Los días entre jornadas deben estar entre 1 y 30.' }); return }
    const ok = await ejecutar(() => generarCalendario(torneoId, { ...gen, canchaIds: canchasElegidas, diasEntreJornadas: Number(gen.diasEntreJornadas), duracionMin: Number(gen.duracionMin) }),
      (r) => `Calendario generado: ${r?.creados ?? 'varios'} partidos.${r?.sinLugar?.length ? ` ${r.sinLugar.length} no encontraron cancha u horario libre; agrega más horarios o canchas.` : ''}`)
    if (ok) setPanel('')
  }

  async function enviarManual(event) {
    event.preventDefault()
    const horaFin = deMinutos(aMinutos(manual.horaInicio) + Number(manual.duracionMin))
    const candidato = { ...manual, horaFin, torneoId: Number(torneoId), jornada: Number(manual.jornada) }
    if (!manual.localId || !manual.visitanteId || !manual.canchaId) { setAviso({ tipo: 'error', texto: 'Elige la cancha y los dos equipos.' }); return }
    if (manual.localId === manual.visitanteId) { setAviso({ tipo: 'error', texto: 'Elige dos equipos distintos.' }); return }
    if (!manual.fecha || manual.fecha < hoyISO()) { setAviso({ tipo: 'error', texto: 'La fecha del partido no puede ser anterior a hoy.' }); return }
    if (!(Number.isInteger(Number(manual.jornada)) && Number(manual.jornada) >= 1 && Number(manual.jornada) <= 60)) { setAviso({ tipo: 'error', texto: 'La jornada debe ser un número entero entre 1 y 60.' }); return }
    if (aMinutos(manual.horaInicio) + Number(manual.duracionMin) > 24 * 60 - 1) { setAviso({ tipo: 'error', texto: 'El partido no puede terminar después de la medianoche.' }); return }
    const motivo = motivoTraslape(datos.todos, candidato)
    if (motivo) { setAviso({ tipo: 'warn', texto: `No se puede guardar. ${motivo}` }); return }
    const ok = await ejecutar(() => crearPartido({ torneoId: Number(torneoId), jornada: candidato.jornada, fecha: manual.fecha, horaInicio: manual.horaInicio, horaFin, canchaId: Number(manual.canchaId), localId: Number(manual.localId), visitanteId: Number(manual.visitanteId) }), 'Partido agregado al calendario.')
    if (ok) setPanel('')
  }

  async function guardarEdicion(event) {
    event.preventDefault()
    const horaFin = deMinutos(aMinutos(editando.horaInicio) + Number(editando.duracionMin))
    const cambios = { fecha: editando.fecha, horaInicio: editando.horaInicio, horaFin, canchaId: Number(editando.canchaId) }
    if (!cambios.fecha || cambios.fecha < hoyISO()) { setAviso({ tipo: 'error', texto: 'No se puede reprogramar a una fecha pasada.' }); return }
    const motivo = motivoTraslape(datos.todos, { ...editando, ...cambios }, editando.id)
    if (motivo) { setAviso({ tipo: 'warn', texto: `No se puede reprogramar. ${motivo}` }); return }
    if (await ejecutar(() => actualizarPartido(editando.id, cambios), 'Partido reprogramado.')) setEditando(null)
  }

  const camposManual = (e) => setManual((m) => ({ ...m, [e.target.name]: e.target.value }))
  const f = (set) => (e) => set((m) => ({ ...m, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">COMPETENCIA · CALENDARIO</span><h1>Calendario y partidos</h1><p>Genera el rol de juegos por jornadas sin traslapes de cancha, horario o equipo.</p></div>
      <div className="mx-actions"><SelectorTorneo torneos={torneos} value={torneoId} onChange={setTorneoId} />
        <button className="mx-btn" disabled={sinEquipos || jugados > 0} title={jugados > 0 ? 'Ya hay partidos jugados: no se regenera el calendario para no perder resultados.' : sinEquipos ? 'Se necesitan 2 equipos con inscripción pagada.' : undefined} onClick={() => setPanel(panel === 'gen' ? '' : 'gen')}><i className="pi pi-sync" /> Generar calendario</button>
        <button className="mx-btn ghost" disabled={pagados.length < 2} onClick={() => setPanel(panel === 'manual' ? '' : 'manual')}><i className="pi pi-plus" /> Agregar partido</button></div></header>
    <ModoDemo />
    {(error || errorTorneos) && <p className="mx-alert error" role="alert"><i className="pi pi-exclamation-circle" />{error || errorTorneos}</p>}
    {aviso && <p ref={avisoRef} className={`mx-alert ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}><i className={`pi ${aviso.tipo === 'ok' ? 'pi-check-circle' : 'pi-exclamation-triangle'}`} />{aviso.texto}</p>}
    {torneo && jugados > 0 && <p className="mx-alert info"><i className="pi pi-info-circle" /> Este torneo ya tiene {jugados} partido(s) jugado(s) o en curso, así que el calendario automático queda bloqueado para no borrar resultados. Puedes seguir agregando partidos con “Agregar partido”, reprogramar los que faltan o crear un torneo nuevo para generar otro calendario completo.</p>}
    {torneo && pagados.length < 2 && <p className="mx-alert warn"><i className="pi pi-info-circle" /> Este torneo tiene {pagados.length} equipo(s) con inscripción pagada. Se necesitan al menos 2 para armar el calendario (los pagos se registran en Finanzas).</p>}

    {panel === 'gen' && <form className="mx-card" onSubmit={enviarGenerar}><h2>Generar calendario automático</h2><p className="mx-card-sub">Se juega todos contra todos con {pagados.length} equipos. Los partidos se reparten por jornada en las canchas y horarios que elijas, sin empalmes.</p>
      <div className="mx-form-grid"><label className="mx-field">Fecha de la primera jornada<input type="date" name="fechaInicio" value={gen.fechaInicio} min={hoyISO()} onChange={f(setGen)} required /></label>
        <label className="mx-field">Días entre jornadas<input type="number" name="diasEntreJornadas" min="1" max="30" value={gen.diasEntreJornadas} onChange={f(setGen)} required /></label>
        <label className="mx-field">Duración del partido<select name="duracionMin" value={gen.duracionMin} onChange={f(setGen)}>{[40, 50, 60, 70, 90].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
        <label className="mx-field">Vueltas<select name="dobleVuelta" value={String(gen.dobleVuelta)} onChange={(e) => setGen((g) => ({ ...g, dobleVuelta: e.target.value === 'true' }))}><option value="false">Solo ida</option><option value="true">Ida y vuelta</option></select></label>
        <div className="mx-field wide">Canchas disponibles<div className="mx-checks">{datos.canchas.map((c) => <label key={c.id} className={`mx-check ${canchasElegidas.includes(c.id) ? 'on' : ''}`}><input type="checkbox" checked={canchasElegidas.includes(c.id)} onChange={() => setGen((g) => ({ ...g, canchaIds: alternar(canchasElegidas, c.id) }))} />{c.nombre}</label>)}</div></div>
        <div className="mx-field wide">Horarios de inicio<div className="mx-checks">{HORARIOS.map((h) => <label key={h} className={`mx-check ${gen.horarios.includes(h) ? 'on' : ''}`}><input type="checkbox" checked={gen.horarios.includes(h)} onChange={() => setGen((g) => ({ ...g, horarios: alternar(g.horarios, h) }))} />{h}</label>)}</div></div></div>
      <div className="mx-actions" style={{ marginTop: 16 }}><button className="mx-btn" disabled={trabajando}><i className="pi pi-check" /> {trabajando ? 'Generando…' : 'Generar'}</button><button type="button" className="mx-btn ghost" onClick={() => setPanel('')}>Cancelar</button></div></form>}

    {panel === 'manual' && <form className="mx-card" onSubmit={enviarManual}><h2>Agregar partido manualmente</h2><p className="mx-card-sub">Si la cancha o alguno de los equipos ya está ocupado en ese horario, el sistema te avisará y no guardará el partido.</p>
      <div className="mx-form-grid"><label className="mx-field">Jornada<input type="number" name="jornada" min="1" value={manual.jornada} onChange={camposManual} required /></label>
        <label className="mx-field">Fecha<input type="date" name="fecha" value={manual.fecha} onChange={camposManual} required /></label>
        <label className="mx-field">Hora de inicio<input type="time" name="horaInicio" value={manual.horaInicio} onChange={camposManual} required /></label>
        <label className="mx-field">Duración<select name="duracionMin" value={manual.duracionMin} onChange={camposManual}>{[40, 50, 60, 70, 90].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
        <label className="mx-field">Cancha<select name="canchaId" value={manual.canchaId} onChange={camposManual} required><option value="" disabled>Elige cancha</option>{datos.canchas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label className="mx-field">Local<select name="localId" value={manual.localId} onChange={camposManual} required><option value="" disabled>Elige equipo</option>{pagados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
        <label className="mx-field">Visitante<select name="visitanteId" value={manual.visitanteId} onChange={camposManual} required><option value="" disabled>Elige equipo</option>{pagados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label></div>
      <div className="mx-actions" style={{ marginTop: 16 }}><button className="mx-btn" disabled={trabajando}><i className="pi pi-check" /> Guardar partido</button><button type="button" className="mx-btn ghost" onClick={() => setPanel('')}>Cancelar</button></div></form>}

    <div className="mx-stats"><div className="mx-stat"><span><i className="pi pi-calendar" /> Jornadas</span><b>{jornadas.length}</b></div><div className="mx-stat"><span><i className="pi pi-flag" /> Partidos</span><b>{partidos.length}</b></div><div className="mx-stat"><span><i className="pi pi-clock" /> Por jugar</span><b>{programados}</b></div><div className="mx-stat"><span><i className="pi pi-check-circle" /> Finalizados</span><b>{partidos.filter((p) => p.estado === 'FINALIZADO').length}</b></div></div>
    {programados > 0 && <div className="mx-actions"><button className="mx-btn danger small" onClick={() => window.confirm('¿Quitar todos los partidos programados de este torneo?') && ejecutar(() => borrarCalendario(torneoId), 'Se quitaron los partidos programados.')}><i className="pi pi-trash" /> Limpiar partidos programados</button></div>}

    {cargando && <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando calendario…</p>}
    {!cargando && !partidos.length && torneo && <div className="mx-empty"><i className="pi pi-calendar-plus" />Este torneo aún no tiene calendario. Usa “Generar calendario” cuando haya al menos 2 equipos inscritos y pagados.</div>}
    {jornadas.map(([numero, lista]) => <div key={numero} className="mx-jornada"><h3>Jornada {numero}<span className="mx-chip">{lista.length} partidos</span></h3>
      {lista.map((p) => { const [etiqueta, tono] = ESTADOS[p.estado] || [p.estado, '']; const programado = p.estado === 'PROGRAMADO'
        return <article key={p.id} className="mx-match">
          <div className="mx-match-when"><b>{String(p.horaInicio).slice(0, 5)}</b><span>{fechaLarga(p.fecha)}</span></div>
          <div><div className="mx-match-teams"><span>{p.local || nombreEquipo(p.localId)}</span>{p.estado === 'FINALIZADO' ? <span className="mx-score">{p.golesLocal} - {p.golesVisitante}</span> : <span className="mx-vs">VS</span>}<span>{p.visitante || nombreEquipo(p.visitanteId)}</span></div>
            <div className="mx-match-meta"><span className={`mx-chip ${tono}`}>{etiqueta}</span><span className="mx-chip"><i className="pi pi-map-marker" /> {p.cancha}</span>{programado && <span className={`mx-chip ${p.arbitrajeCubierto ? 'ok' : 'warn'}`}><i className="pi pi-wallet" /> {p.arbitrajeCubierto ? 'Arbitraje cubierto' : `Arbitraje pendiente (${p.equiposPagados ?? 0}/2)`}</span>}</div></div>
          <div className="mx-match-actions"><Link className="mx-btn ghost small" to={`/admin/partidos/${p.id}`}><i className="pi pi-id-card" /> Cédula</Link>{programado ? <>
            <select aria-label="Árbitro" className="mx-chip" value={p.arbitroId || ''} onChange={(e) => ejecutar(() => actualizarPartido(p.id, { arbitroId: e.target.value ? Number(e.target.value) : null }), 'Árbitro asignado.')}><option value="">Sin árbitro</option>{datos.arbitros.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}</select>
            <button className="mx-btn ghost small" onClick={() => setEditando({ ...p, duracionMin: aMinutos(p.horaFin) - aMinutos(p.horaInicio) })}><i className="pi pi-pencil" /> Reprogramar</button>
            <button className="mx-btn danger small" aria-label="Eliminar partido" onClick={() => window.confirm('¿Eliminar este partido?') && ejecutar(() => eliminarPartido(p.id), 'Partido eliminado.')}><i className="pi pi-trash" /></button></> : <span className="mx-muted">{p.arbitro ? `Árbitro: ${p.arbitro}` : ''}</span>}</div>
        </article> })}</div>)}

    {editando && <div className="mx-modal-bg" role="dialog" aria-modal="true" aria-label="Reprogramar partido"><form className="mx-modal" onSubmit={guardarEdicion}><h2>Reprogramar partido</h2><p className="mx-card-sub">{editando.local} vs {editando.visitante}</p>
      <div className="mx-form-grid"><label className="mx-field">Fecha<input type="date" name="fecha" value={editando.fecha} onChange={f(setEditando)} required /></label><label className="mx-field">Hora<input type="time" name="horaInicio" value={String(editando.horaInicio).slice(0, 5)} onChange={f(setEditando)} required /></label>
        <label className="mx-field">Cancha<select name="canchaId" value={editando.canchaId} onChange={f(setEditando)}>{datos.canchas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label className="mx-field">Duración<select name="duracionMin" value={editando.duracionMin} onChange={f(setEditando)}>{[40, 50, 60, 70, 90].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label></div>
      {aviso && aviso.tipo !== 'ok' && <p className={`mx-alert ${aviso.tipo}`} style={{ marginTop: 12 }}>{aviso.texto}</p>}
      <div className="mx-actions" style={{ marginTop: 16 }}><button className="mx-btn" disabled={trabajando}>Guardar cambios</button><button type="button" className="mx-btn ghost" onClick={() => { setEditando(null); setAviso(null) }}>Cancelar</button></div></form></div>}
  </section>
}
