import { useState } from 'react'
import { registrarUsuario } from '../../database/auth'
import { sinEspaciosExtra, validarCorreo, validarNombrePersona, validarPassword, validarUsuario } from '../../utils/validaciones'
import './Registro.css'

const vacio = { nombreCompleto: '', username: '', email: '', password: '', confirmPassword: '', rol: 'ROLE_ADMIN' }

function validar(f) {
  const e = {}
  const nombre = validarNombrePersona(f.nombreCompleto, 'El nombre'); if (nombre) e.nombreCompleto = nombre
  const usuario = validarUsuario(f.username); if (usuario) e.username = usuario
  const correo = validarCorreo(f.email); if (correo) e.email = correo
  const clave = validarPassword(f.password); if (clave) e.password = clave
  if (!e.password && f.password.toLowerCase().includes(f.username.toLowerCase()) && f.username) e.password = 'La contraseña no debe contener tu nombre de usuario.'
  if (!f.confirmPassword) e.confirmPassword = 'Confirma tu contraseña.'
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.'
  return e
}

export default function Registro() {
  const [form, setForm] = useState(vacio)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrores((current) => ({ ...current, [name]: undefined }))
    setError('')
    setSuccess('')
  }

  async function submit(event) {
    event.preventDefault()
    const encontrados = validar(form)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) { setError('Revisa los campos marcados antes de continuar.'); return }

    setSaving(true)
    try {
      // El usuario se envía EXACTAMENTE como se escribió (respeta mayúsculas y minúsculas).
      await registrarUsuario({ ...form, nombreCompleto: sinEspaciosExtra(form.nombreCompleto), email: form.email.trim() })
      setSuccess(`La cuenta "${form.username}" se registró correctamente. ${form.rol === 'ROLE_ADMIN' ? 'Ya puede iniciar sesión en el panel con ese usuario tal como se escribió.' : 'Como no es administrador, no podrá entrar al panel web (usará la APK). Si necesita acceso al panel, cámbiale el rol en Configuración › Usuarios y permisos.'}`)
      setForm({ ...vacio, rol: form.rol })
      setErrores({})
    } catch (registrationError) {
      const message = registrationError.status === 403
        ? 'El backend rechazó el registro (403). Tu sesión no tiene permiso para registrar usuarios.'
        : registrationError.status === 409
          ? registrationError.message || 'Ese usuario o correo ya está registrado.'
          : registrationError.status
            ? registrationError.message || `El backend rechazó el registro (${registrationError.status}).`
            : 'No se pudo conectar con el backend local. Revisa que esté encendido en localhost:8080.'
      setError(message)
    } finally { setSaving(false) }
  }

  const campo = (name) => ({ 'aria-invalid': errores[name] ? 'true' : undefined, 'aria-describedby': errores[name] ? `err-${name}` : undefined })
  const mensaje = (name) => errores[name] && <small className="register-field-error" id={`err-${name}`} role="alert">{errores[name]}</small>

  return <section className="register-admin-page">
    <header className="register-page-heading"><div><span>ADMINISTRACIÓN · USUARIOS</span><h1>Registrar usuario</h1><p>Crea una cuenta para acceder a CODEGOL.</p></div></header>
    <section className="register-admin-card">
      <div className="register-notice"><i className="pi pi-info-circle" /><span>La cuenta se enviará al backend CODEGOL con el rol que elijas. Solo el rol Administrador entra al panel web; los árbitros y la mesa de control usan la APK en cancha. Puedes cambiar el rol después en Configuración › Usuarios y permisos.</span></div>
      <form className="register-form" onSubmit={submit} noValidate>
        <div className="register-form-grid">
          <label htmlFor="nombreCompleto">Nombre completo<input id="nombreCompleto" name="nombreCompleto" autoComplete="name" maxLength={100} value={form.nombreCompleto} onChange={update} placeholder="Tu nombre" {...campo('nombreCompleto')} />{mensaje('nombreCompleto')}</label>
          <label htmlFor="registerUsername">Nombre de usuario<input id="registerUsername" name="username" autoComplete="username" maxLength={50} value={form.username} onChange={update} placeholder="Por ejemplo: lesli_admin" autoCapitalize="none" spellCheck={false} {...campo('username')} /><small className="register-field-hint">Se guarda tal cual lo escribes: “Lesli” y “lesli” son usuarios distintos. 4 a 50 caracteres: letras, números, punto, guion y guion bajo.</small>{mensaje('username')}</label>
          <label htmlFor="registerEmail">Correo electrónico<input id="registerEmail" name="email" type="email" autoComplete="email" maxLength={100} value={form.email} onChange={update} placeholder="tu@correo.com" {...campo('email')} />{mensaje('email')}</label>
          <label htmlFor="registerPassword">Contraseña<input id="registerPassword" name="password" type="password" autoComplete="new-password" maxLength={72} value={form.password} onChange={update} placeholder="Mínimo 6 caracteres" {...campo('password')} /><small className="register-field-hint">Letras y números, mínimo 6 caracteres.</small>{mensaje('password')}</label>
          <label htmlFor="confirmPassword">Confirma tu contraseña<input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" maxLength={72} value={form.confirmPassword} onChange={update} placeholder="Escríbela de nuevo" {...campo('confirmPassword')} />{mensaje('confirmPassword')}</label>
          <label htmlFor="rol">Rol<select id="rol" name="rol" value={form.rol} onChange={update}><option value="ROLE_ADMIN">Administrador general</option><option value="ROLE_ARBITRO">Árbitro</option><option value="ROLE_MESA_CONTROL">Mesa de control</option></select></label>
        </div>
        {error && <p className="register-error" role="alert"><i className="pi pi-exclamation-circle" />{error}</p>}
        {success && <p className="register-success" role="status"><i className="pi pi-check-circle" />{success}</p>}
        <div className="register-form-actions"><button className="register-submit" type="submit" disabled={saving}><i className="pi pi-user-plus" />{saving ? 'Registrando…' : 'Registrar usuario'}</button></div>
      </form>
    </section>
  </section>
}
