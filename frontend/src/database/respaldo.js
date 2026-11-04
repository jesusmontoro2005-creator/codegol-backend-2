import { useSyncExternalStore } from 'react'

// Permite trabajar sin backend: si la API no responde (o aún no tiene ese endpoint),
// se usa la base de demostración del navegador y se avisa con un banner.
let usandoDemo = false
const oyentes = new Set()
function marcar(valor) { if (usandoDemo !== valor) { usandoDemo = valor; oyentes.forEach((fn) => fn()) } }

export const esSesionDemo = () => localStorage.getItem('codegol-auth-mode') === 'local-demo'
export function useModoDemo() {
  return useSyncExternalStore((fn) => { oyentes.add(fn); return () => oyentes.delete(fn) }, () => usandoDemo)
}

function sinBackend(error) {
  if (!error.status) return true
  if ([404, 501, 502, 503, 504].includes(error.status)) return true
  return error.status === 500 && /^La solicitud falló/.test(error.message)
}

export async function conRespaldo(real, local) {
  if (esSesionDemo()) { marcar(true); return local() }
  try {
    const resultado = await real()
    marcar(false)
    return resultado
  } catch (error) {
    if (!sinBackend(error)) throw error
    marcar(true)
    return local()
  }
}
