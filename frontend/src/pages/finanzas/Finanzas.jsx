import { useEffect, useMemo, useRef, useState } from 'react'
import ModoDemo from '../../components/ModoDemo'
import SelectorTorneo from '../../components/SelectorTorneo'
import useDatos from '../../hooks/useDatos'
import useTorneoElegido from '../../hooks/useTorneoElegido'
import { fechaLarga, hoyISO, listarPagos, listarPartidos, moneda, registrarPago } from '../../database/servicios'
import { obtenerEquiposDeTorneo } from '../torneos/hook/torneos'

const CONCEPTOS = { INSCRIPCION: 'Inscripción', ARBITRAJE: 'Arbitraje', MULTA: 'Multa' }
const METODOS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }
const inicioDeMes = () => `${hoyISO().slice(0, 8)}01`
const formVacio = { concepto: 'INSCRIPCION', equipoId: '', partidoId: '', monto: '', metodo: 'EFECTIVO', descripcion: '' }

function Recibo({ pago, onCerrar }) {
  return <div className="mx-modal-bg" role="dialog" aria-modal="true" aria-label="Recibo digital"><div className="mx-modal">
    <div className="mx-print"><div className="mx-receipt"><div className="mx-receipt-top"><div><div className="mx-receipt-brand">CODE<span>GOL</span></div><small className="mx-muted">Recibo digital de pago</small></div><span className="mx-chip ok">Folio {pago.folio}</span></div>
      <dl><dt>Fecha</dt><dd>{new Date(pago.fechaPago).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</dd><dt>Equipo</dt><dd>{pago.equipo}</dd><dt>Concepto</dt><dd>{CONCEPTOS[pago.concepto]}{pago.descripcion ? ` — ${pago.descripcion}` : ''}</dd>{pago.torneo && <><dt>Torneo</dt><dd>{pago.torneo}</dd></>}<dt>Método</dt><dd>{METODOS[pago.metodo] || pago.metodo}</dd><dt>Estado</dt><dd>Cubierto</dd></dl>
      <div className="mx-receipt-total"><span>Total pagado</span><span>{moneda(pago.monto)}</span></div></div></div>
    <div className="mx-actions" style={{ marginTop: 16 }}><button className="mx-btn" onClick={() => window.print()}><i className="pi pi-print" /> Imprimir / guardar PDF</button><button className="mx-btn ghost" onClick={onCerrar}>Cerrar</button></div></div></div>
}

export default function Finanzas() {
  const { torneos, torneoId, torneo, setTorneoId } = useTorneoElegido()
  const [tab, setTab] = useState('cobro')
  const [form, setForm] = useState(formVacio)
  const [aviso, setAviso] = useState(null)
  const [recibo, setRecibo] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const avisoRef = useRef(null)
  const formRef = useRef(null)
  useEffect(() => { if (aviso) avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [aviso])
  const [filtros, setFiltros] = useState({ desde: inicioDeMes(), hasta: hoyISO(), concepto: '' })

  const base = useDatos(async () => {
    if (!torneoId) return { equipos: [], partidos: [], pagosArbitraje: [] }
    const [equipos, partidos, pagosArbitraje] = await Promise.all([obtenerEquiposDeTorneo(torneoId), listarPartidos(torneoId), listarPagos({ concepto: 'ARBITRAJE' })])
    return { equipos, partidos, pagosArbitraje }
  }, [torneoId, recibo], { equipos: [], partidos: [], pagosArbitraje: [] })
  const reporte = useDatos(() => listarPagos(filtros), [filtros.desde, filtros.hasta, filtros.concepto, recibo])

  const porCobrar = base.datos.partidos.filter((p) => p.estado === 'PROGRAMADO' && !p.arbitrajeCubierto)
  const partido = base.datos.partidos.find((p) => String(p.id) === String(form.partidoId))
  const equiposOpciones = useMemo(() => {
    const { equipos } = base.datos
    if (form.concepto === 'INSCRIPCION') return equipos.filter((e) => !e.pagoInscripcionCubierto)
    if (form.concepto === 'ARBITRAJE') return partido ? equipos.filter((e) => [partido.localId, partido.visitanteId].includes(e.id) && !base.datos.pagosArbitraje.some((x) => Number(x.partidoId) === Number(partido.id) && Number(x.equipoId) === Number(e.id))) : []
    return equipos
  }, [base.datos, form.concepto, partido])
  const cuota = form.concepto === 'INSCRIPCION' ? torneo?.cuotaInscripcion : form.concepto === 'ARBITRAJE' ? torneo?.cuotaArbitraje : 0
  const cambiar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value, ...(e.target.name === 'concepto' ? { equipoId: '', partidoId: '', monto: '' } : {}), ...(e.target.name === 'partidoId' ? { equipoId: '' } : {}) }))

  async function cobrar(event) {
    event.preventDefault(); setGuardando(true); setAviso(null)
    try {
      if (!torneoId) throw Object.assign(new Error('Elige primero el torneo.'), { status: 400 })
      if (form.concepto === 'ARBITRAJE' && !form.partidoId) throw Object.assign(new Error('Elige el partido al que corresponde el arbitraje.'), { status: 400 })
      if (!form.equipoId) throw Object.assign(new Error(form.concepto === 'INSCRIPCION' && !equiposOpciones.length ? 'Todos los equipos de este torneo ya pagaron su inscripción.' : 'Elige el equipo que realiza el pago.'), { status: 400 })
      const monto = Number(form.monto) || Number(cuota) || 0
      if (form.concepto === 'MULTA' ? !(monto > 0) : !(monto >= 0)) throw Object.assign(new Error('Escribe un monto mayor a cero.'), { status: 400 })
      if (monto > 100000) throw Object.assign(new Error('El monto no puede pasar de $100,000.'), { status: 400 })
      if (form.monto !== '' && Number(form.monto) <= 0) throw Object.assign(new Error('El monto debe ser mayor a cero.'), { status: 400 })
      if (form.concepto === 'MULTA' && form.descripcion.trim().length < 3) throw Object.assign(new Error('Describe el motivo de la multa (mínimo 3 caracteres).'), { status: 400 })
      const pago = await registrarPago({ ...form, descripcion: form.descripcion.trim(), torneoId: Number(torneoId), equipoId: Number(form.equipoId), partidoId: form.partidoId ? Number(form.partidoId) : null, monto })
      setRecibo(pago); setForm({ ...formVacio, concepto: form.concepto, metodo: form.metodo })
      setAviso(null)
    } catch (e) { setAviso({ tipo: e.status === 409 ? 'warn' : 'error', texto: e.message }) } finally { setGuardando(false) }
  }

  const pagos = reporte.datos
  const total = pagos.reduce((s, p) => s + Number(p.monto), 0)
  const porConcepto = Object.keys(CONCEPTOS).map((c) => ({ concepto: c, total: pagos.filter((p) => p.concepto === c).reduce((s, p) => s + Number(p.monto), 0), n: pagos.filter((p) => p.concepto === c).length }))

  function exportarCsv() {
    const filas = [['Folio', 'Fecha', 'Equipo', 'Concepto', 'Torneo', 'Método', 'Monto'], ...pagos.map((p) => [p.folio, String(p.fechaPago).slice(0, 10), p.equipo, CONCEPTOS[p.concepto], p.torneo || '', METODOS[p.metodo] || p.metodo, Number(p.monto).toFixed(2)])]
    const csv = filas.map((f) => f.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: `ingresos-codegol-${filtros.desde}-a-${filtros.hasta}.csv` }).click()
    URL.revokeObjectURL(url)
  }

  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">ADMINISTRACIÓN · CAJA</span><h1>Finanzas y caja</h1><p>Cobra inscripciones, arbitrajes y multas, emite recibos y revisa los ingresos del complejo.</p></div></header>
    <ModoDemo />
    <div className="mx-card" style={{ padding: 0 }}>
      <div className="mx-tabs" role="tablist">{[['cobro', 'pi-wallet', 'Registrar cobro'], ['reporte', 'pi-chart-bar', 'Reporte de ingresos']].map(([id, icono, texto]) => <button key={id} role="tab" aria-selected={tab === id} className={`mx-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}><i className={`pi ${icono}`} />{texto}</button>)}</div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {tab === 'cobro' && <>
        {aviso && <p ref={avisoRef} className={`mx-alert ${aviso.tipo}`} role="alert"><i className="pi pi-exclamation-triangle" />{aviso.texto}</p>}
        <form ref={formRef} onSubmit={cobrar} noValidate><div className="mx-form-grid">
          <SelectorTorneo torneos={torneos} value={torneoId} onChange={(v) => { setTorneoId(v); setForm((f) => ({ ...f, equipoId: '', partidoId: '' })) }} />
          <label className="mx-field">Concepto<select name="concepto" value={form.concepto} onChange={cambiar}>{Object.entries(CONCEPTOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          {form.concepto === 'ARBITRAJE' && <label className="mx-field">Partido<select name="partidoId" value={form.partidoId} onChange={cambiar} required><option value="" disabled>Elige el partido</option>{base.datos.partidos.filter((p) => p.estado === 'PROGRAMADO').map((p) => <option key={p.id} value={p.id}>J{p.jornada} · {p.local} vs {p.visitante} · {fechaLarga(p.fecha)} {String(p.horaInicio).slice(0, 5)}</option>)}</select></label>}
          <label className="mx-field">Equipo<select name="equipoId" value={form.equipoId} onChange={cambiar} required><option value="" disabled>{form.concepto === 'ARBITRAJE' && !partido ? 'Primero elige el partido' : 'Elige el equipo'}</option>{equiposOpciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
          <label className="mx-field">Monto (MXN)<input name="monto" type="number" min="0" step="0.01" value={form.monto} onChange={cambiar} placeholder={cuota ? `Cuota: ${cuota}` : 'Escribe el monto'} /></label>
          <label className="mx-field">Método de pago<select name="metodo" value={form.metodo} onChange={cambiar}>{Object.entries(METODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          {form.concepto === 'MULTA' && <label className="mx-field wide">Motivo de la multa<input name="descripcion" value={form.descripcion} onChange={cambiar} placeholder="Ej. Retardo, agresión al árbitro…" required /></label>}
        </div>
        {form.concepto === 'ARBITRAJE' && partido && !equiposOpciones.length && <p className="mx-muted" style={{ marginTop: 10 }}>Los dos equipos de este partido ya pagaron su arbitraje: la cédula puede abrirse en la APK.</p>}
        {form.concepto === 'INSCRIPCION' && !equiposOpciones.length && <p className="mx-muted" style={{ marginTop: 10 }}>Todos los equipos de este torneo ya pagaron su inscripción.</p>}
        <div className="mx-actions" style={{ marginTop: 14 }}><button className="mx-btn" disabled={guardando}><i className="pi pi-check" /> {guardando ? 'Registrando…' : 'Cobrar y emitir recibo'}</button></div></form>
        <div><h2 style={{ font: '700 16px Manrope, sans-serif', margin: '6px 0 10px' }}>Arbitrajes por cobrar</h2>
          <p className="mx-muted" style={{ margin: '0 0 10px' }}>La cédula arbitral solo se puede abrir en la APK cuando ambos equipos ya pagaron su arbitraje.</p>
          {porCobrar.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>JORNADA</th><th>PARTIDO</th><th>FECHA</th><th>ESTADO</th><th /></tr></thead><tbody>{porCobrar.map((p) => <tr key={p.id}><td>J{p.jornada}</td><td><b>{p.local}</b> vs <b>{p.visitante}</b></td><td>{fechaLarga(p.fecha)} · {String(p.horaInicio).slice(0, 5)}</td><td><span className="mx-chip warn">Pagado {p.equiposPagados ?? 0}/2</span></td><td><button className="mx-btn ghost small" onClick={() => { setAviso(null); setForm({ ...formVacio, concepto: 'ARBITRAJE', partidoId: String(p.id), metodo: form.metodo }); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>Cobrar</button></td></tr>)}</tbody></table></div> : <p className="mx-empty">No hay arbitrajes pendientes en este torneo.</p>}</div></>}

      {tab === 'reporte' && <>
        <div className="mx-toolbar"><label className="mx-field">Desde<input type="date" value={filtros.desde} max={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></label><label className="mx-field">Hasta<input type="date" value={filtros.hasta} min={filtros.desde} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></label>
          <label className="mx-field">Concepto<select value={filtros.concepto} onChange={(e) => setFiltros({ ...filtros, concepto: e.target.value })}><option value="">Todos</option>{Object.entries(CONCEPTOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <button className="mx-btn ghost" onClick={exportarCsv} disabled={!pagos.length}><i className="pi pi-download" /> Exportar CSV</button></div>
        {reporte.error && <p className="mx-alert error" role="alert">{reporte.error}</p>}
        <div className="mx-stats"><div className="mx-stat"><span><i className="pi pi-wallet" /> Total de ingresos</span><b>{moneda(total)}</b></div>{porConcepto.map((c) => <div key={c.concepto} className="mx-stat"><span>{CONCEPTOS[c.concepto]} · {c.n} pagos</span><b>{moneda(c.total)}</b></div>)}</div>
        {reporte.cargando ? <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando…</p> : pagos.length ? <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>FOLIO</th><th>FECHA</th><th>EQUIPO</th><th>CONCEPTO</th><th>MÉTODO</th><th className="num">MONTO</th><th /></tr></thead><tbody>{pagos.map((p) => <tr key={p.id}><td>{p.folio}</td><td>{String(p.fechaPago).slice(0, 10)}</td><td><b>{p.equipo}</b></td><td><span className="mx-chip info">{CONCEPTOS[p.concepto]}</span>{p.descripcion && <small className="mx-muted"> {p.descripcion}</small>}</td><td>{METODOS[p.metodo] || p.metodo}</td><td className="num strong">{moneda(p.monto)}</td><td><button className="mx-btn ghost small" onClick={() => setRecibo(p)}>Recibo</button></td></tr>)}</tbody><tfoot><tr className="mx-tfoot"><td colSpan="5">Total</td><td className="num">{moneda(total)}</td><td /></tr></tfoot></table></div> : <div className="mx-empty"><i className="pi pi-inbox" />No hay ingresos en el periodo elegido.</div>}</>}
      </div>
    </div>
    {recibo && <Recibo pago={recibo} onCerrar={() => setRecibo(null)} />}
  </section>
}
