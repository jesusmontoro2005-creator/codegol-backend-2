import { useState } from 'react'
import useDatos from '../../hooks/useDatos'
import { cambiarRolUsuario, listarUsuarios } from '../../database/servicios'
import { demo } from '../../database/demo'
import { API_BASE_URL } from '../../database/config'
import { iniciales, nombreUsuario, ROLES, usuarioActual } from '../../database/sesion'

function Usuarios({ yo }) {
  const { datos, cargando, error, recargar } = useDatos(listarUsuarios, [], [])
  const [aviso, setAviso] = useState(null)
  const [guardando, setGuardando] = useState(null)
  async function cambiar(u, rol) {
    if (rol === u.rol) return
    if (u.username === yo.username && rol !== 'ROLE_ADMIN') { setAviso({ tipo: 'warn', texto: 'No puedes quitarte a ti mismo el rol de administrador. Pídele a otro administrador que lo haga.' }); return }
    if (!window.confirm(`¿Cambiar a "${u.username}" de ${ROLES[u.rol]} a ${ROLES[rol]}?${rol === 'ROLE_ADMIN' ? '\n\nTendrá acceso total al panel web.' : '\n\nYa no podrá entrar al panel web; operará desde la APK.'}`)) return
    setGuardando(u.id); setAviso(null)
    try { await cambiarRolUsuario(u.id, rol); setAviso({ tipo: 'ok', texto: `"${u.username}" ahora es ${ROLES[rol]}.${rol === 'ROLE_ADMIN' ? ' Ya puede iniciar sesión en el panel web.' : ''}` }); recargar() }
    catch (e) { setAviso({ tipo: e.status === 409 ? 'warn' : 'error', texto: e.message }) }
    finally { setGuardando(null) }
  }
  return <div className="mx-card"><h2>Usuarios y permisos</h2><p className="mx-card-sub">Aquí decides quién puede entrar al panel web. Solo el rol <b>Administrador</b> accede al panel; Árbitro y Mesa de control trabajan en la APK en cancha.</p>
    {aviso && <p className={`mx-alert ${aviso.tipo}`} role={aviso.tipo === 'ok' ? 'status' : 'alert'} style={{ marginBottom: 12 }}><i className={`pi ${aviso.tipo === 'ok' ? 'pi-check-circle' : 'pi-exclamation-triangle'}`} />{aviso.texto}</p>}
    {error && <p className="mx-alert error" role="alert">{error}</p>}
    {cargando && !datos.length ? <p className="mx-loading"><i className="pi pi-spin pi-spinner" /> Cargando usuarios…</p>
      : <div className="mx-table-wrap"><table className="mx-table"><thead><tr><th>USUARIO</th><th>NOMBRE</th><th>CORREO</th><th>ROL / PERMISO</th></tr></thead><tbody>
        {datos.map((u) => <tr key={u.id}><td><b>{u.username}</b>{u.username === yo.username && <small className="mx-muted"> · tú</small>}</td><td>{u.nombreCompleto}</td><td>{u.email}</td>
          <td><select aria-label={`Rol de ${u.username}`} value={u.rol} disabled={guardando === u.id} onChange={(e) => cambiar(u, e.target.value)} style={{ height: 36, borderRadius: 8, border: '1px solid var(--mx-border, #e5e5ee)', padding: '0 10px', font: 'inherit', background: 'transparent', color: 'inherit' }}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td></tr>)}
      </tbody></table></div>}</div>
}

export default function Configuracion() {
  const usuario = usuarioActual(); const nombre = nombreUsuario()
  const [aviso, setAviso] = useState('')
  const esDemo = localStorage.getItem('codegol-auth-mode') === 'local-demo'
  function reiniciar() {
    if (!window.confirm('Se borrarán los cambios hechos en el modo demostración y volverán los datos de ejemplo. ¿Continuar?')) return
    demo.reiniciar(); setAviso('Datos de demostración restablecidos.')
  }
  return <section className="mx-page">
    <header className="mx-head"><div><span className="mx-eyebrow">SISTEMA · CONFIGURACIÓN</span><h1>Configuración</h1><p>Tu cuenta y la conexión del panel con el servidor.</p></div></header>
    {aviso && <p className="mx-alert ok" role="status"><i className="pi pi-check-circle" />{aviso}</p>}
    <div className="mx-card"><h2>Mi cuenta</h2><p className="mx-card-sub">Datos de la sesión actual.</p><div className="mx-team-top"><span className="mx-avatar" style={{ fontWeight: 800 }}>{iniciales(nombre)}</span><div><b>{nombre}</b><br /><small className="mx-muted">{usuario.email || usuario.username || '—'} · {ROLES[usuario.rol] || 'Administrador'}</small></div></div></div>
    <Usuarios yo={usuario} />
    <div className="mx-card"><h2>Conexión con el servidor</h2><p className="mx-card-sub">El panel consume la API REST de CODEGOL (Spring Boot).</p><dl className="mx-receipt" style={{ border: 0, padding: 0 }}><dl style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 8, margin: 0 }}><dt className="mx-muted">URL de la API</dt><dd style={{ margin: 0, fontWeight: 700 }}>{API_BASE_URL}</dd><dt className="mx-muted">Modo de sesión</dt><dd style={{ margin: 0, fontWeight: 700 }}>{esDemo ? 'Demostración (sin servidor)' : 'Servidor'}</dd></dl></dl></div>
    <div className="mx-card"><h2>Datos de demostración</h2><p className="mx-card-sub">Cuando el servidor no responde, el panel usa datos de ejemplo guardados en este navegador. Puedes volver a empezar.</p><button className="mx-btn danger" onClick={reiniciar}><i className="pi pi-undo" /> Restablecer datos de demostración</button></div>
  </section>
}
