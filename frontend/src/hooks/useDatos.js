import { useCallback, useEffect, useState } from 'react'

/** Carga datos asíncronos: const { datos, cargando, error, recargar } = useDatos(() => api(), [deps]). */
export default function useDatos(cargador, deps = [], inicial = []) {
  const [datos, setDatos] = useState(inicial)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let vigente = true
    Promise.resolve().then(() => { if (vigente) setCargando(true); return cargador() })
      .then((r) => { if (vigente) { setDatos(r); setError('') } })
      .catch((e) => { if (vigente) setError(e.message || 'No se pudo cargar la información.') })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])
  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  return { datos, cargando, error, recargar, setDatos }
}
