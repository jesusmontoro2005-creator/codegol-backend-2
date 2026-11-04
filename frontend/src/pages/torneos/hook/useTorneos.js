import { useCallback, useEffect, useState } from 'react'
import {
  crearCategoria,
  crearTorneo,
  inscribirEquipo,
  obtenerCategorias,
  obtenerEquipos,
  obtenerEquiposDeTorneo,
  obtenerTorneo,
  obtenerTorneos,
  actualizarTorneo,
} from './torneos'

export default function useTorneos() {
  const [categorias, setCategorias] = useState([])
  const [torneos, setTorneos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [equiposInscritos, setEquiposInscritos] = useState([])
  const [torneoSeleccionado, setTorneoSeleccionado] = useState('')
  const [torneoDetalle, setTorneoDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargarCatalogos = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargando(true)
      setError('')
    }
    try {
      const [categoriasApi, torneosApi, equiposApi] = await Promise.all([
        obtenerCategorias(), obtenerTorneos(), obtenerEquipos(),
      ])
      setCategorias(categoriasApi)
      setTorneos(torneosApi)
      setEquipos(equiposApi)
      setTorneoSeleccionado((actual) => actual || (torneosApi[0] ? String(torneosApi[0].id) : ''))
    } catch (cause) {
      setError(cause.message || 'No se pudo cargar la información del backend.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => cargarCatalogos(false))
  }, [cargarCatalogos])

  useEffect(() => {
    let vigente = true
    if (!torneoSeleccionado) return () => { vigente = false }
    Promise.all([obtenerEquiposDeTorneo(torneoSeleccionado), obtenerTorneo(torneoSeleccionado)])
      .then(([lista, detalle]) => {
        if (!vigente) return
        setEquiposInscritos(lista)
        setTorneoDetalle(detalle)
      })
      .catch((cause) => { if (vigente) setError(cause.message || 'No se pudo consultar el torneo.') })
    return () => { vigente = false }
  }, [torneoSeleccionado])

  async function guardarCategoria(datos) {
    setGuardando(true); setError(''); setMensaje('')
    try {
      await crearCategoria({ nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim(), activa: true })
      setMensaje('La categoría se creó correctamente.')
      await cargarCatalogos()
      return true
    } catch (cause) { setError(cause.message || 'No se pudo crear la categoría.'); return false }
    finally { setGuardando(false) }
  }

  async function guardarTorneo(datos) {
    setGuardando(true); setError(''); setMensaje('')
    try {
      const creado = await crearTorneo({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin || null,
        estado: datos.estado,
        categoriaId: Number(datos.categoriaId),
        cuotaInscripcion: Number(datos.cuotaInscripcion) || 0,
        cuotaArbitraje: Number(datos.cuotaArbitraje) || 0,
        limiteAmarillas: Number(datos.limiteAmarillas) || 3,
      })
      setMensaje('El torneo se creó correctamente.')
      await cargarCatalogos()
      if (creado?.id) seleccionarTorneo(String(creado.id))
      return true
    } catch (cause) { setError(cause.message || 'No se pudo crear el torneo.'); return false }
    finally { setGuardando(false) }
  }

  // Devuelve { ok, error }: el formulario de equipos muestra el resultado junto al botón (no arriba de la página).
  async function guardarEquipo(datos) {
    if (!torneoSeleccionado) return { ok: false, error: 'Primero selecciona un torneo.' }
    setGuardando(true); setError(''); setMensaje('')
    try {
      await inscribirEquipo({
        nombre: datos.nombre.trim(),
        logoUrl: datos.logoUrl.trim() || null,
        delegado: datos.delegado.trim() || null,
        telefono: datos.telefono.trim() || null,
        pagoInscripcionCubierto: datos.pagoInscripcionCubierto,
        torneoId: Number(torneoSeleccionado),
      })
      setEquiposInscritos(await obtenerEquiposDeTorneo(torneoSeleccionado))
      setEquipos(await obtenerEquipos())
      return { ok: true }
    } catch (cause) { return { ok: false, error: cause.message || 'No se pudo inscribir el equipo.' } }
    finally { setGuardando(false) }
  }

  async function cambiarEstado(estado) {
    if (!torneoSeleccionado) return
    setGuardando(true); setError(''); setMensaje('')
    try {
      const actualizado = await actualizarTorneo(torneoSeleccionado, { estado })
      setTorneoDetalle((actual) => ({ ...actual, ...actualizado, estado }))
      setMensaje(`El torneo ahora está ${estado.replaceAll('_', ' ').toLowerCase()}.`)
      setTorneos(await obtenerTorneos())
    } catch (cause) { setError(cause.message || 'No se pudo cambiar el estado del torneo.') }
    finally { setGuardando(false) }
  }

  function seleccionarTorneo(id) {
    setTorneoSeleccionado(id)
    setTorneoDetalle(null)
    setEquiposInscritos([])
  }

  return {
    categorias, torneos, equipos, equiposInscritos, torneoSeleccionado, torneoDetalle,
    seleccionarTorneo, cargando, guardando, error, mensaje,
    guardarCategoria, guardarTorneo, guardarEquipo, cambiarEstado, recargar: cargarCatalogos,
  }
}
