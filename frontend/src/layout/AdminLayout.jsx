import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import './AdminLayout.css'

function savedTheme() {
  return localStorage.getItem('codegol-theme') === 'dark' ? 'dark' : 'light'
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [theme, setTheme] = useState(savedTheme)
  const location = useLocation()
  const navigate = useNavigate()

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('codegol-theme', nextTheme)
  }

  function logout() {
    localStorage.removeItem('codegol-session')
    localStorage.removeItem('codegol-auth-token')
    localStorage.removeItem('codegol-auth-user')
    localStorage.removeItem('codegol-auth-mode')
    navigate('/', { replace: true })
  }

  return <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-sidebar-open' : ''}`} data-theme={theme}>
    {mobileOpen && <button aria-label="Cerrar menú" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
    <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
    <div className="main-column"><TopBar location={location} theme={theme} onThemeToggle={toggleTheme} onMenuToggle={() => { if (window.innerWidth <= 760) setMobileOpen(!mobileOpen); else setCollapsed(!collapsed) }} notificationsOpen={notificationsOpen} onNotificationsToggle={() => { setNotificationsOpen(!notificationsOpen); setAccountOpen(false) }} accountOpen={accountOpen} onAccountToggle={() => { setAccountOpen(!accountOpen); setNotificationsOpen(false) }} onLogout={logout} /><main className="page-content"><Outlet /></main></div>
  </div>
}
