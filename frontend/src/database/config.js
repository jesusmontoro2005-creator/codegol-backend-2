// En desarrollo usamos /api y el proxy de Vite lo dirige a localhost:8080.
// También acepta el origen del backend o su URL terminada en /api.
// En producción, define VITE_API_URL con la URL pública del backend.
const apiUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
export const API_BASE_URL = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
