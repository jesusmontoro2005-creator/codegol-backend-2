import { apiPost } from './api'
import { demo } from './demo'
import { conRespaldo } from './respaldo'

// Con backend se usan auth/registro y auth/login. Si el backend no está disponible, las cuentas se
// guardan en el modo demostración del navegador para poder probar todo el panel.
export async function registrarUsuario({ username, email, nombreCompleto, password, rol = 'ROLE_ADMIN' }) {
  const datos = { username, email, nombreCompleto, password, rol }
  return conRespaldo(() => apiPost('auth/registro', datos), () => demo.registrarUsuario(datos))
}

export async function iniciarSesion({ username, password }) {
  return conRespaldo(async () => {
    const respuesta = await apiPost('auth/login', { username, password })
    if (!respuesta?.token) throw new Error('El servidor respondió, pero no devolvió un token de acceso.')
    return { ...respuesta, modoDemo: false }
  }, () => ({ ...demo.iniciarSesion({ username, password }), modoDemo: true }))
}
