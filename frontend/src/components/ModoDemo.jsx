import { useModoDemo } from '../database/respaldo'

export default function ModoDemo() {
  const activo = useModoDemo()
  if (!activo) return null
  return <p className="mx-demo-banner" role="status"><i className="pi pi-info-circle" /> Estás en modo demostración: los cambios se guardan solo en este navegador y no llegan a la base de datos de phpMyAdmin.</p>
}
