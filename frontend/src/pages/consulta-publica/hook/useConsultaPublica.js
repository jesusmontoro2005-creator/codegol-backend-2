import { useEffect, useMemo, useState } from 'react'
import { listarPartidos, obtenerGoleadores, obtenerPosiciones } from '../../../database/servicios'
import { obtenerEquiposDeTorneo, obtenerTorneo, obtenerTorneos } from '../../torneos/hook/torneos'

export default function useConsultaPublica() {
  const [torneos, setTorneos] = useState([])
  const [torneoId, setTorneoId] = useState('')
  const [torneo, setTorneo] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [posiciones, setPosiciones] = useState([])
  const [partidos, setPartidos] = useState([])
  const [goleadores, setGoleadores] = useState([])
  const [cargandoTorneos, setCargandoTorneos] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [error, setError] = useState('')
  const [categoria, setCategoria] = useState('')
  const [actualizadoEn, setActualizadoEn] = useState(null)

  useEffect(() => {
    obtenerTorneos()
      .then((lista) => {
        setTorneos(lista)
        if (lista.length) {
          setTorneoId(String((lista.find((t) => t.estado === 'EN_PROGRESO') || lista[0]).id))
          setCargandoDetalle(true)
        }
      })
      .catch((cause) => setError(cause.message || 'No se pudieron consultar los torneos.'))
      .finally(() => setCargandoTorneos(false))
  }, [])

  useEffect(() => {
    let vigente = true
    if (!torneoId) return () => { vigente = false }
    const cargar = (silencioso) => Promise.all([obtenerTorneo(torneoId), obtenerEquiposDeTorneo(torneoId), obtenerPosiciones(torneoId), listarPartidos(torneoId), obtenerGoleadores(torneoId)])
      .then(([detalle, listaEquipos, tabla, calendario, goleo]) => {
        if (!vigente) return
        setTorneo(detalle); setEquipos(listaEquipos); setPosiciones(tabla); setPartidos(calendario); setGoleadores(goleo)
        setActualizadoEn(new Date()); setError('')
      })
      .catch((cause) => { if (vigente && !silencioso) setError(cause.message || 'No se pudo consultar este torneo.') })
      .finally(() => { if (vigente) setCargandoDetalle(false) })
    cargar(false)
    // Tabla y goleo se actualizan al cerrarse cada cédula (HU-03): se vuelve a consultar cada 30 s sin pedir recarga.
    const timer = window.setInterval(() => { if (!document.hidden) cargar(true) }, 30000)
    return () => { vigente = false; window.clearInterval(timer) }
  }, [torneoId])

  const categorias = useMemo(() => [...new Set(torneos.map((t) => t.categoria?.nombre).filter(Boolean))], [torneos])
  const torneosVisibles = useMemo(() => torneos.filter((t) => !categoria || t.categoria?.nombre === categoria), [torneos, categoria])

  function seleccionarCategoria(nombre) {
    setCategoria(nombre)
    const primero = torneos.find((t) => !nombre || t.categoria?.nombre === nombre)
    if (primero && String(primero.id) !== String(torneoId)) seleccionarTorneo(String(primero.id))
  }

  function seleccionarTorneo(id) {
    setTorneoId(id)
    setTorneo(null); setEquipos([]); setPosiciones([]); setPartidos([]); setGoleadores([])
    setError('')
    setCargandoDetalle(Boolean(id))
  }

  return { torneos, torneosVisibles, categorias, categoria, seleccionarCategoria, actualizadoEn, torneoId, seleccionarTorneo, torneo, equipos, posiciones, partidos, goleadores, cargandoTorneos, cargandoDetalle, error }
}
