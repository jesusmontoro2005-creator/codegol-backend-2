import { useState } from 'react'
import { obtenerTorneos } from '../pages/torneos/hook/torneos'
import useDatos from './useDatos'

/** Lista de torneos + torneo seleccionado (por defecto el que está en progreso). */
export default function useTorneoElegido() {
  const [elegido, setElegido] = useState('')
  const { datos: torneos, cargando, error } = useDatos(obtenerTorneos)
  const actual = elegido || String((torneos.find((t) => t.estado === 'EN_PROGRESO') || torneos[0])?.id || '')
  return { torneos, torneoId: actual, torneo: torneos.find((t) => String(t.id) === actual), setTorneoId: setElegido, cargando, error }
}
