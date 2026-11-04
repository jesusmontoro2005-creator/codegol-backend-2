import { useModoDemo } from '../database/respaldo'

export default function ModoDemo() {
  const activo = useModoDemo()
  if (!activo) return null
  return <p className="mx-demo-banner" role="status"><i className="pi pi-info-circle" /> Mostrando datos de demostración guardados en este navegador (no hay conexión con el backend o el endpoint aún no existe).</p>
}
