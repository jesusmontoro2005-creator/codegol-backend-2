import { useMemo, useState } from 'react'
import useDatos from '../../../hooks/useDatos'
import { crearJugadorConHuella, editarJugador, eliminarJugador, listarJugadores, obtenerSuspensiones, registrarHuella } from '../../../database/servicios'
import { capturarMuestraHuella } from '../../../services/fingerprintReader'
import { obtenerEquipos, obtenerTorneos } from '../../torneos/hook/torneos'
import { buscarJugadores, validarJugador } from './jugador'

const formularioVacio = { nombre: '', apellidos: '', equipoId: '', posicion: 'Delantero', dorsal: '', curp: '', fotoUrl: '' }

export default function useJugadores() {
  const { datos, cargando, error, recargar } = useDatos(async () => {
    const [jugadores, equipos, torneos] = await Promise.all([listarJugadores(), obtenerEquipos(), obtenerTorneos()])
    const suspendidos = (await Promise.all(torneos.filter((t) => t.estado === 'EN_PROGRESO').map((t) => obtenerSuspensiones(t.id)))).flat()
    return { jugadores, equipos, suspendidos }
  }, [], { jugadores: [], equipos: [], suspendidos: [] })
  const [busqueda, setBusqueda] = useState('')
  const [filtroEquipo, setFiltroEquipo] = useState('')
  const [formulario, setFormulario] = useState(formularioVacio)
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [capturasHuella, setCapturasHuella] = useState([])
  const [dedo, setDedo] = useState('INDICE_DER')
  const [capturandoHuella, setCapturandoHuella] = useState(false)
  const [estadoHuella, setEstadoHuella] = useState('')

  const jugadoresVisibles = useMemo(() => buscarJugadores(datos.jugadores, busqueda, filtroEquipo), [datos.jugadores, busqueda, filtroEquipo])
  const idsSuspendidos = useMemo(() => new Set(datos.suspendidos.map((s) => s.jugadorId)), [datos.suspendidos])

  function cambiarCampo(event) { const { name, value } = event.target; setFormulario((actual) => ({ ...actual, [name]: value })) }
  function abrirFormulario(jugador = null) { setJugadorEnEdicion(jugador); setFormulario(jugador ? { ...formularioVacio, ...jugador } : { ...formularioVacio, equipoId: filtroEquipo }); setMensaje(''); setCapturasHuella([]); setDedo('INDICE_DER'); setEstadoHuella(''); setFormularioAbierto(true) }
  function cerrarFormulario() { setFormularioAbierto(false); setJugadorEnEdicion(null); setFormulario(formularioVacio); setCapturasHuella([]); setMensaje(''); setEstadoHuella('') }

  async function capturarHuella() {
    setCapturandoHuella(true); setMensaje(''); setCapturasHuella([])
    const imagenes = []
    try {
      for (let intento = 1; intento <= 3; intento += 1) {
        setEstadoHuella(`Captura ${intento} de 3: coloca el mismo dedo en el lector.`)
        const { sample } = await capturarMuestraHuella()
        imagenes.push(sample.Data)
        setCapturasHuella([...imagenes])
      }
      setEstadoHuella('Tres capturas listas. Al guardar, el backend registrará al jugador y su huella.')
    } catch (e) {
      setCapturasHuella([])
      setEstadoHuella('No se completaron las capturas.')
      setMensaje(e.message)
    } finally { setCapturandoHuella(false) }
  }

  async function guardarJugador(event) {
    event.preventDefault()
    setGuardando(true)
    try {
      const limpio = validarJugador(formulario, datos.jugadores, jugadorEnEdicion?.id)
      if (!jugadorEnEdicion && capturasHuella.length !== 3) throw new Error('Captura tres veces la huella antes de registrar al jugador.')
      if (jugadorEnEdicion) {
        await editarJugador(jugadorEnEdicion.id, limpio)
        if (capturasHuella.length === 3) await registrarHuella(jugadorEnEdicion.id, { dedo, imagenes: capturasHuella })
      } else {
        await crearJugadorConHuella({ ...limpio, dedo, imagenes: capturasHuella })
      }
      cerrarFormulario(); recargar()
    } catch (e) { setMensaje(e.message) } finally { setGuardando(false) }
  }

  async function quitarJugador(jugador) {
    if (!window.confirm(`¿Quitar a ${jugador.nombre} ${jugador.apellidos} de la plantilla activa? Se borrará su huella; si tiene historial, este se conservará.`)) return
    try {
      await eliminarJugador(jugador.id)
      setMensaje('El jugador se quitó de la plantilla activa. Su historial se conserva y su huella fue eliminada.')
      await recargar()
    } catch (e) { setMensaje(e.message) }
  }

  return { jugadores: datos.jugadores, equipos: datos.equipos, jugadoresVisibles, idsSuspendidos, cargando, error, busqueda, setBusqueda, filtroEquipo, setFiltroEquipo, formulario, formularioAbierto, jugadorEnEdicion, mensaje, guardando, cambiarCampo, abrirFormulario, cerrarFormulario, guardarJugador, quitarJugador, recargar, dedo, setDedo, capturasHuella, capturandoHuella, estadoHuella, capturarHuella }
}
