import ModoDemo from '../../components/ModoDemo'
import useJugadores from './hook/useJugadores'
import { POSICIONES } from './hook/jugador'
import './Jugadores.css'

export default function Jugador() {
  const j = useJugadores()
  const sinHuella = j.jugadores.filter((x) => !x.huella).length

  return <section className="players-page">
    <header className="players-heading"><div><span className="players-eyebrow">ADMINISTRACIÓN · PLANTILLA</span><h1>Jugadores</h1><p>Registra a los jugadores de cada equipo y revisa su estado de huella y suspensión.</p></div><button className="players-add-button" onClick={() => j.abrirFormulario()} disabled={!j.equipos.length}><i className="pi pi-plus" /> Agregar jugador</button></header>
    <ModoDemo />
    {j.error && <p className="player-form-error" role="alert">{j.error}</p>}
    <div className="players-summary"><div className="players-summary-icon"><i className="pi pi-users" /></div><div><span>JUGADORES REGISTRADOS</span><strong>{j.jugadores.length}</strong></div><div><span>SIN HUELLA</span><strong>{sinHuella}</strong></div><div><span>SUSPENDIDOS</span><strong>{j.idsSuspendidos.size}</strong></div><i className="pi pi-shield players-summary-decoration" /></div>
    <div className="players-toolbar"><div><h2>Plantillas</h2><p>Filtra por equipo o busca por nombre, posición o dorsal.</p></div>
      <div className="mx-toolbar"><label className="mx-field">Equipo<select value={j.filtroEquipo} onChange={(e) => j.setFiltroEquipo(e.target.value)}><option value="">Todos</option>{j.equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
        <label className="players-search"><i className="pi pi-search" /><input value={j.busqueda} onChange={(e) => j.setBusqueda(e.target.value)} placeholder="Buscar jugador" /></label></div></div>
    {j.formularioAbierto && <form className="player-form" onSubmit={j.guardarJugador} noValidate><div className="player-form-heading"><div><span>{j.jugadorEnEdicion ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}</span><h2>{j.jugadorEnEdicion ? 'Actualizar jugador' : 'Agregar jugador'}</h2></div><button type="button" className="player-close-button" aria-label="Cerrar formulario" onClick={j.cerrarFormulario}><i className="pi pi-times" /></button></div>
      <div className="player-form-grid"><label>Nombre<input name="nombre" value={j.formulario.nombre} onChange={j.cambiarCampo} placeholder="Ej. Diego" required /></label><label>Apellidos<input name="apellidos" value={j.formulario.apellidos} onChange={j.cambiarCampo} placeholder="Ej. Ramírez López" required maxLength={100} /></label>
        <label>Equipo<select name="equipoId" value={j.formulario.equipoId} onChange={j.cambiarCampo} required><option value="" disabled>Selecciona un equipo</option>{j.equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
        <label>Posición<select name="posicion" value={j.formulario.posicion} onChange={j.cambiarCampo}>{POSICIONES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Dorsal<input name="dorsal" inputMode="numeric" maxLength={2} value={j.formulario.dorsal} onChange={j.cambiarCampo} placeholder="Ej. 10" /></label>
        <label>CURP <span>(opcional, evita duplicados)</span><input name="curp" maxLength={18} value={j.formulario.curp} onChange={j.cambiarCampo} placeholder="18 caracteres" style={{ textTransform: 'uppercase' }} /></label>
        <label>Foto (URL) <span>(se muestra al pasar lista)</span><input name="fotoUrl" type="url" value={j.formulario.fotoUrl || ''} onChange={j.cambiarCampo} placeholder="https://…" /></label></div>
      <p className="mx-muted" style={{ margin: '4px 0 0' }}><i className="pi pi-info-circle" /> La huella dactilar se captura en la terminal de campo (APK con lector) al dar de alta al jugador.</p>
      {j.mensaje && <p className="player-form-error" role="alert">{j.mensaje}</p>}<div className="player-form-actions"><button type="button" className="player-cancel-button" onClick={j.cerrarFormulario}>Cancelar</button><button type="submit" className="players-add-button" disabled={j.guardando}><i className="pi pi-check" /> {j.guardando ? 'Guardando…' : 'Guardar jugador'}</button></div></form>}
    {j.cargando && <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando jugadores…</p>}
    {!j.cargando && (j.jugadoresVisibles.length ? <div className="players-grid">{j.jugadoresVisibles.map((x, index) => <article className="player-card" key={x.id}><div className={`player-avatar player-avatar-${index % 4}`}>{x.fotoUrl ? <img src={x.fotoUrl} alt={`Foto de ${x.nombre}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : `${x.nombre[0]}${x.apellidos?.[0] || ''}`.toUpperCase()}</div><div className="player-card-content"><div className="player-card-top"><span className="player-position">{x.posicion}</span><span className="player-number">#{x.dorsal || '—'}</span></div><h3>{x.nombre} {x.apellidos}</h3><p><i className="pi pi-shield" /> {x.equipo}</p>
        <div className="mx-actions" style={{ gap: 6, marginTop: 6 }}><span className={`mx-chip ${x.huella ? 'ok' : 'warn'}`}><i className={`pi ${x.huella ? 'pi-check' : 'pi-clock'}`} /> {x.huella ? 'Huella registrada' : 'Sin huella'}</span>{j.idsSuspendidos.has(x.id) && <span className="mx-chip bad"><i className="pi pi-ban" /> Suspendido</span>}</div></div>
        <div className="player-card-actions"><button aria-label={`Editar a ${x.nombre}`} onClick={() => j.abrirFormulario(x)}><i className="pi pi-pencil" /> Editar</button><button aria-label={`Eliminar a ${x.nombre}`} onClick={() => j.quitarJugador(x)}><i className="pi pi-trash" /> Eliminar</button></div></article>)}</div> : <div className="players-empty"><span><i className="pi pi-user-plus" /></span><h2>{j.busqueda || j.filtroEquipo ? 'No encontramos jugadores' : 'Tu lista empieza aquí'}</h2><p>{j.busqueda || j.filtroEquipo ? 'Prueba con otro filtro.' : 'Agrega el primer jugador y aparecerá en esta sección.'}</p></div>)}
  </section>
}
