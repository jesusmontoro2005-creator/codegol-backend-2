import { NavLink } from 'react-router-dom'
import codegolLogo from '../assets/codegol-logo.jpeg'

const menuGroups = [
  { label: 'GENERAL', links: [
    { to: '/admin', label: 'Dashboard', icon: 'pi-home' },
    { to: '/admin/torneos', label: 'Torneos', icon: 'pi-star-fill' },
    { to: '/admin/equipos', label: 'Equipos', icon: 'pi-shield' },
    { to: '/admin/jugadores', label: 'Jugadores', icon: 'pi-users' },
    { to: '/admin/calendario', label: 'Calendario y partidos', icon: 'pi-calendar' },
    { to: '/admin/estadisticas', label: 'Estadísticas', icon: 'pi-chart-bar' },
  ] },
  { label: 'ADMINISTRACIÓN', links: [
    { to: '/admin/arbitros', label: 'Árbitros', icon: 'pi-stopwatch' },
    { to: '/admin/finanzas', label: 'Finanzas y caja', icon: 'pi-wallet' },
    { to: '/admin/registro', label: 'Registrar usuario', icon: 'pi-user-plus' },
  ] },
]

export default function Sidebar({ collapsed, onNavigate }) {
  return <aside className="sidebar">
    <NavLink to="/admin" className="brand" aria-label="CODEGOL inicio" onClick={onNavigate}><span className="brand-mark"><img className="brand-logo-image" src={codegolLogo} alt="" /></span><span className="brand-name">CODE<span>GOL</span></span><span className="brand-version">PRO</span></NavLink>
    <NavLink to="/consulta-publica" onClick={onNavigate} className={({ isActive }) => `nav-link public-panel-link ${isActive ? 'active' : ''}`} title={collapsed ? 'Consulta pública' : undefined}><i className="pi pi-globe" /><span>Consulta pública</span></NavLink>
    <nav className="side-nav" aria-label="Navegación principal">{menuGroups.map((group) => <div className="nav-group" key={group.label}><p className="nav-label">{group.label}</p>{group.links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/admin'} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={collapsed ? link.label : undefined}><i className={`pi ${link.icon}`} /><span>{link.label}</span>{link.badge && <b className="nav-badge">{link.badge}</b>}</NavLink>)}</div>)}</nav>
    <div className="sidebar-bottom"><NavLink to="/admin/configuracion" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onNavigate}><i className="pi pi-cog" /><span>Configuración</span></NavLink><div className="sidebar-help"><span className="help-icon"><i className="pi pi-question-circle" /></span><div><b>¿Necesitas ayuda?</b><small>Visita nuestro centro de soporte</small></div><button aria-label="Abrir soporte"><i className="pi pi-arrow-up-right" /></button></div><div className="sidebar-footer"><span className="online-dot" /> Todos los sistemas operativos <span className="footer-version">v1.0.0</span></div></div>
  </aside>
}
