import { NavLink } from 'react-router-dom'
import { iniciales, nombreUsuario, ROLES, usuarioActual } from '../database/sesion'

export default function AdminPerfil({ open, onToggle, onLogout }) {
  const usuario = usuarioActual(); const nombre = nombreUsuario(); const rol = ROLES[usuario.rol] || 'Administrador'
  return <div className="popover-anchor"><button className="profile-button" aria-expanded={open} onClick={onToggle}><span className="profile-avatar">{iniciales(nombre)}</span><span className="profile-copy"><b>{nombre}</b><small>{rol}</small></span><i className="pi pi-angle-down profile-chevron" /></button>{open && <div className="top-popover account-popover"><b>{nombre}</b><small>{usuario.email || usuario.username || rol}</small><NavLink to="/admin/configuracion" onClick={onToggle}><i className="pi pi-cog" /> Configuración</NavLink><button onClick={onLogout}><i className="pi pi-sign-out" /> Cerrar sesión</button></div>}</div>
}
