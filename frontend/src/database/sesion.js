// Datos de la persona que inició sesión (los guarda Login.jsx en localStorage).
export function usuarioActual() {
  try { return JSON.parse(localStorage.getItem('codegol-auth-user') || '{}') || {} } catch { return {} }
}
export function nombreUsuario() { const u = usuarioActual(); return u.nombreCompleto || u.nombre || u.username || 'Administrador' }
export function iniciales(nombre) { return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'AD' }
export const ROLES = { ROLE_ADMIN: 'Administrador', ROLE_ARBITRO: 'Árbitro', ROLE_MESA_CONTROL: 'Mesa de control' }
export function fechaHoyLarga() { const t = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1) }
