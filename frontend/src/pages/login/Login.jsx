import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import codegolLogo from '../../assets/codegol-logo.jpeg'
import { iniciarSesion } from '../../database/auth'
import './Login.css'

export default function Login() {
  const location = useLocation()
  const [user, setUser] = useState(location.state?.registeredUsername || '')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  if (localStorage.getItem('codegol-auth-token')) return <Navigate to="/admin" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)
    try {
      if (user === '123' && password === '123') {
        localStorage.setItem('codegol-auth-token', 'local-demo-123')
        localStorage.setItem('codegol-auth-mode', 'local-demo')
        localStorage.setItem('codegol-auth-user', JSON.stringify({ username: '123', nombreCompleto: 'Usuario de demostración', rol: 'ROLE_ADMIN' }))
        setFeedback({ type: 'success', text: 'Acceso de demostración correcto. Entrando al panel…' })
        window.setTimeout(() => navigate('/admin', { replace: true }), 700)
        return
      }

      if (user !== user.trim()) { setFeedback({ type: 'error', text: 'El usuario no debe llevar espacios al inicio ni al final.' }); setSubmitting(false); return }
      const { modoDemo, ...respuesta } = await iniciarSesion({ username: user, password })
      localStorage.setItem('codegol-auth-token', respuesta.token)
      localStorage.setItem('codegol-auth-user', JSON.stringify(respuesta))
      if (modoDemo) localStorage.setItem('codegol-auth-mode', 'local-demo'); else localStorage.removeItem('codegol-auth-mode')
      setFeedback({ type: 'success', text: 'Inicio de sesión correcto. Entrando al panel…' })
      window.setTimeout(() => navigate('/admin', { replace: true }), 1100)
    } catch (error) {
      const message = error.status === 401
        ? 'El usuario o la contraseña no coinciden.'
        : error.status === 403
          ? 'El backend rechazó el endpoint de inicio de sesión (403) antes de validar tus datos.'
          : error.status === 400
            ? 'El backend no aceptó los datos enviados. Revisa el usuario y la contraseña.'
            : error.status
              ? 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.'
              : 'No pudimos conectar con el servidor. Revisa que el backend esté encendido.'
      setFeedback({ type: 'error', text: message })
      setSubmitting(false)
    }
  }

  return <main className="login-page"><section className="login-card"><div className="login-brand"><span className="login-brand-mark"><i className="pi pi-bolt" /></span><span>CODE<span>GOL</span></span></div><div className="login-heading"><span className="login-eyebrow">GESTIÓN DEPORTIVA</span><h1>¡Qué bueno verte!</h1><p>Inicia sesión para continuar a tu espacio de administración.</p></div>
    <form onSubmit={handleSubmit} className="login-form"><label htmlFor="username">Usuario</label><div className="login-input-wrap"><i className="pi pi-user" /><input id="username" autoComplete="username" required value={user} onChange={(event) => { setUser(event.target.value); setFeedback(null) }} placeholder="Escribe tu nombre de usuario" /></div><label htmlFor="password">Contraseña</label><div className="login-input-wrap"><i className="pi pi-lock" /><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.target.value); setFeedback(null) }} placeholder="Escribe tu contraseña" /></div>{feedback && <p className={`login-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}><i className={`pi ${feedback.type === 'success' ? 'pi-check-circle' : 'pi-exclamation-circle'}`} />{feedback.text}</p>}<button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Ingresando…' : 'Entrar al panel'} {!submitting && <i className="pi pi-arrow-right" />}</button></form>
    <div className="demo-hint"><i className="pi pi-info-circle" /><span><b>Acceso de demostración</b><br />Usuario: <strong>123</strong> · Contraseña: <strong>123</strong></span></div><Link className="public-tournaments-link" to="/consulta-publica"><i className="pi pi-globe" /> Consultar torneos públicos</Link><footer className="login-footer">© 2026 CODEGOL · Tu complejo, más conectado.</footer></section><aside className="login-art"><img className="login-logo-image" src={codegolLogo} alt="Logo de CODEGOL" /><div className="login-art-overlay" /><div className="login-art-circle circle-one" /><div className="login-art-circle circle-two" /><div className="login-art-content"><span className="login-art-tag"><i className="pi pi-circle-fill" /> TU CANCHA, TU LIGA, TU HISTORIA</span><h2>El fútbol se vive.<br /><span>CODEGOL lo organiza.</span></h2><p>Todo lo que pasa en tu complejo, en un solo lugar.</p><div className="login-stat-row"><div><b>01</b><span>COMUNIDAD</span></div><i /><div><b>90′</b><span>DE PURA PASIÓN</span></div></div></div><div className="login-pitch"><div className="pitch-circle" /><div className="pitch-midline" /><div className="pitch-box pitch-box-left" /><div className="pitch-box pitch-box-right" /></div><span className="login-art-caption">CODEGOL · PLATAFORMA DE GESTIÓN DEPORTIVA</span></aside></main>
}
