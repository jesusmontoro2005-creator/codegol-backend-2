import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layout/AdminLayout'
import Dashboard from './pages/Dashboard'
import Torneos from './pages/torneos'
import Equipos from './pages/equipos'
import Jugadores from './pages/jugadores'
import Calendario from './pages/calendario'
import Estadisticas from './pages/estadisticas'
import Arbitros from './pages/arbitros'
import Finanzas from './pages/finanzas'
import Configuracion from './pages/configuracion'
import Login from './pages/login/Login'
import Registro from './pages/registro/Registro'
import PublicHome from './pages/public-home/PublicHome'
import Cedula from './pages/partidos/Cedula'
import { usuarioActual } from './database/sesion'

function cerrarSesion() {
  ;['codegol-session', 'codegol-auth-token', 'codegol-auth-user', 'codegol-auth-mode'].forEach((k) => localStorage.removeItem(k))
  window.location.assign('/login')
}

// El panel web es del Administrador. Árbitro y Mesa de control trabajan en la APK (HU-02).
function ProtectedAdmin() {
  if (!localStorage.getItem('codegol-auth-token')) return <Navigate to="/" replace />
  const rol = usuarioActual().rol
  if (rol && rol !== 'ROLE_ADMIN') {
    return <main className="login-page" style={{ gridTemplateColumns: '1fr' }}><section className="login-card" style={{ textAlign: 'center', gap: 14 }}>
      <h1>Este panel es para administradores</h1>
      <p>Tu cuenta ({rol === 'ROLE_ARBITRO' ? 'Árbitro' : 'Mesa de control'}) opera desde la aplicación móvil en cancha: pase de lista con huella y cédula arbitral.</p>
      <button className="login-submit" onClick={cerrarSesion}>Cerrar sesión</button>
      <a className="public-tournaments-link" href="/consulta-publica">Ir a la consulta pública</a>
    </section></main>
  }
  return <AdminLayout />
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<PublicHome />} />
    <Route path="/login" element={<Login />} />
    <Route path="/consulta-publica" element={<PublicHome />} />
    <Route path="/admin" element={<ProtectedAdmin />}>
      <Route index element={<Dashboard />} />
      <Route path="torneos" element={<Torneos />} />
      <Route path="equipos" element={<Equipos />} />
      <Route path="jugadores" element={<Jugadores />} />
      <Route path="calendario" element={<Calendario />} />
      <Route path="partidos/:id" element={<Cedula />} />
      <Route path="estadisticas" element={<Estadisticas />} />
      <Route path="arbitros" element={<Arbitros />} />
      <Route path="finanzas" element={<Finanzas />} />
      <Route path="configuracion" element={<Configuracion />} />
      <Route path="registro" element={<Registro />} />
      <Route path="*" element={<Dashboard />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}
