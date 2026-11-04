import { API_BASE_URL } from './config'

/** Envía una solicitud HTTP al backend y convierte respuestas con error en mensajes legibles. */
export async function apiRequest(path, options = {}) {
  const endpoint = `${API_BASE_URL}/${path.replace(/^\/+/, '')}`
  const headers = new Headers(options.headers || {})
  const isFormData = options.body instanceof FormData
  const token = localStorage.getItem('codegol-auth-token')
  const isDemoSession = localStorage.getItem('codegol-auth-mode') === 'local-demo'

  if (token && !isDemoSession && !path.startsWith('auth/login')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(endpoint, { ...options, headers })
  if (response.status === 204) return null

  const responseType = response.headers.get('content-type') || ''
  if (response.ok && responseType.includes('text/html')) throw new Error('El servidor devolvió una página en lugar de datos de la API.')
  const result = responseType.includes('application/json') ? await response.json() : await response.text()

  if (response.status === 401 && token && !isDemoSession && !path.startsWith('auth/')) {
    // El token venció o ya no es válido: se limpia la sesión y se manda al login.
    ;['codegol-session', 'codegol-auth-token', 'codegol-auth-user', 'codegol-auth-mode'].forEach((k) => localStorage.removeItem(k))
    window.location.assign('/login')
    throw Object.assign(new Error('Tu sesión venció. Inicia sesión de nuevo.'), { status: 401 })
  }

  if (!response.ok) {
    const message = typeof result === 'object' && (result?.message || result?.mensaje || result?.detail || result?.error)
      ? result.message || result.mensaje || result.detail || result.error
      : `La solicitud falló (${response.status}).`
    throw Object.assign(new Error(message), { status: response.status })
  }

  return result
}

export const apiGet = (path, options) => apiRequest(path, { ...options, method: 'GET' })
export const apiPost = (path, data, options) => apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(data) })
export const apiPut = (path, data, options) => apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(data) })
export const apiDelete = (path, options) => apiRequest(path, { ...options, method: 'DELETE' })
