import ThemeToggle from './ThemeToggle'
import AdminPerfil from './AdminPerfil'
import useDatos from '../hooks/useDatos'
import { hoyISO, listarPartidos } from '../database/servicios'
import { fechaHoyLarga } from '../database/sesion'

const sectionNames = { '/admin': 'Dashboard', '/admin/torneos': 'Torneos', '/admin/equipos': 'Equipos', '/admin/jugadores': 'Jugadores', '/admin/calendario': 'Calendario y partidos', '/admin/estadisticas': 'Estadísticas', '/admin/arbitros': 'Árbitros', '/admin/finanzas': 'Finanzas y caja', '/admin/configuracion': 'Configuración', '/admin/registro': 'Registrar usuario' }

function useAvisos() {
  const { datos } = useDatos(async () => {
    const hoy = hoyISO(); const proximos = (await listarPartidos()).filter((p) => p.estado === 'PROGRAMADO' && p.fecha >= hoy)
    const avisos = []
    const deHoy = proximos.filter((p) => p.fecha === hoy)
    if (deHoy.length) avisos.push({ icon: 'pi-calendar', texto: `Tienes ${deHoy.length} partido${deHoy.length === 1 ? '' : 's'} programado${deHoy.length === 1 ? '' : 's'} para hoy.` })
    const sinArbitraje = deHoy.filter((p) => !p.arbitrajeCubierto)
    if (sinArbitraje.length) avisos.push({ icon: 'pi-wallet', texto: `${sinArbitraje.length} partido${sinArbitraje.length === 1 ? '' : 's'} de hoy con arbitraje pendiente de pago.` })
    const sinArbitro = proximos.filter((p) => !p.arbitroId)
    if (sinArbitro.length) avisos.push({ icon: 'pi-stopwatch', texto: `${sinArbitro.length} partido${sinArbitro.length === 1 ? '' : 's'} sin árbitro asignado.` })
    return avisos
  }, [], [])
  return datos
}

export default function TopBar({ location, theme, onThemeToggle, onMenuToggle, notificationsOpen, onNotificationsToggle, accountOpen, onAccountToggle, onLogout }) {
  const title = sectionNames[location.pathname] || (location.pathname.startsWith('/admin/partidos/') ? 'Cédula del partido' : 'Dashboard')
  const avisos = useAvisos()
  return <header className="topbar"><div className="topbar-start"><button className="icon-button sidebar-toggle" aria-label="Contraer o expandir menú" onClick={onMenuToggle}><i className="pi pi-bars" /></button><span className="topbar-divider" /><div className="breadcrumb"><span>CODEGOL</span><i className="pi pi-angle-right" /><b>{title}</b></div></div>
    <div className="topbar-actions"><span className="today-label"><i className="pi pi-calendar" /> {fechaHoyLarga()}</span><ThemeToggle theme={theme} onToggle={onThemeToggle} />
      <div className="popover-anchor"><button className={`icon-button notification-button ${notificationsOpen ? 'selected' : ''}`} aria-label="Notificaciones" aria-expanded={notificationsOpen} onClick={onNotificationsToggle}><i className="pi pi-bell" />{avisos.length > 0 && <span className="notification-dot" />}</button>{notificationsOpen && <div className="top-popover notifications-popover"><b>Notificaciones</b>{avisos.length ? avisos.map((a) => <p key={a.texto}><i className={`pi ${a.icon}`} /> {a.texto}</p>) : <p><i className="pi pi-check-circle" /> Todo al día.</p>}<button onClick={onNotificationsToggle}>Entendido</button></div>}</div>
      <span className="topbar-divider profile-divider" /><AdminPerfil open={accountOpen} onToggle={onAccountToggle} onLogout={onLogout} />
    </div></header>
}
