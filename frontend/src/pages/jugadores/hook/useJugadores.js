import { useMemo, useState } from 'react'
import useDatos from '../../../hooks/useDatos'
import { crearJugador, editarJugador, eliminarJugador, listarJugadores, obtenerSuspensiones } from '../../../database/servicios'
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

  const jugadoresVisibles = useMemo(() => buscarJugadores(datos.jugadores, busqueda, filtroEquipo), [datos.jugadores, busqueda, filtroEquipo])
  const idsSuspendidos = useMemo(() => new Set(datos.suspendidos.map((s) => s.jugadorId)), [datos.suspendidos])

  function cambiarCampo(event) { const { name, value } = event.target; setFormulario((actual) => ({ ...actual, [name]: value })) }
  function abrirFormulario(jugador = null) { setJugadorEnEdicion(jugador); setFormulario(jugador ? { ...formularioVacio, ...jugador } : { ...formularioVacio, equipoId: filtroEquipo }); setMensaje(''); setFormularioAbierto(true) }
  function cerrarFormulario() { setFormularioAbierto(false); setJugadorEnEdicion(null); setFormulario(formularioVacio); setMensaje('') }

  async function guardarJugador(event) {
    event.preventDefault()
    setGuardando(true)
    try {
      const limpio = validarJugador(formulario, datos.jugadores, jugadorEnEdicion?.id)
      if (jugadorEnEdicion) await editarJugador(jugadorEnEdicion.id, limpio); else await crearJugador(limpio)
      cerrarFormulario(); recargar()
    } catch (e) { setMensaje(e.message) } finally { setGuardando(false) }
  }

  async function quitarJugador(jugador) {
    if (!window.confirm(`¿Eliminar a ${jugador.nombre} ${jugador.apellidos}? Esta acción no se puede deshacer.`)) return
    try { await eliminarJugador(jugador.id); recargar() } catch (e) { setMensaje(e.message) }
  }

  return { jugadores: datos.jugadores, equipos: datos.equipos, jugadoresVisibles, idsSuspendidos, cargando, error, busqueda, setBusqueda, filtroEquipo, setFiltroEquipo, formulario, formularioAbierto, jugadorEnEdicion, mensaje, guardando, cambiarCampo, abrirFormulario, cerrarFormulario, guardarJugador, quitarJugador, recargar }
}
