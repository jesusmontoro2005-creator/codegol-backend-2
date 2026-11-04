// Base de datos de demostración que vive en el navegador (localStorage).
// Replica el modelo de la BD MySQL (01_codegol_schema.sql) para poder trabajar el front
// sin backend. Cuando la API real responde, este módulo no se usa.
import { generarRol, motivoTraslape } from '../utils/calendario'
import { ahoraISO, hoyISO, sumarDias } from '../utils/fechas'
import { calcularGoleadores, calcularPosiciones, calcularSuspensiones } from '../utils/estadisticas'

const KEY = 'codegol-demo-db-v2' // v2: jugadores, pases de lista y cuentas nuevas (los datos de prueba anteriores se reemplazan)
const hoy = () => hoyISO()
const mas = (dias) => sumarDias(hoyISO(), dias)
const clonar = (x) => JSON.parse(JSON.stringify(x))
function fallo(mensaje, status = 400) { return Object.assign(new Error(mensaje), { status }) }

function semilla() {
  const nombres = [
    ['Tigres del Norte', 'Luis Ramírez', '5512345601'], ['Águilas FC', 'Mario Soto', '5512345602'],
    ['Deportivo Neza', 'Pedro Cruz', '5512345603'], ['Halcones United', 'Jorge Díaz', '5512345604'],
    ['Pantera Rosa FC', 'Sofía Mena', '5512345605'], ['Las Guerreras', 'Ana López', '5512345606'], ['Neza Queens', 'Paola Ruiz', '5512345607'],
  ]
  // Mismos 26 jugadores que db/02_codegol_seed.sql (ids 1-20 varonil con huella salvo el 5, 10, 15 y 20; 21-26 femenil)
  const planteles = [
    [['Andrés', 'Vega Lara', 'Portero', 1], ['Iván', 'Torres Mena', 'Defensa', 4], ['Diego', 'Núñez Rosas', 'Medio', 8], ['Raúl', 'Pineda Gil', 'Delantero', 9], ['Omar', 'Salas Ibarra', 'Delantero', 11]],
    [['Hugo', 'Mora Páez', 'Portero', 1], ['Sergio', 'Lara Cano', 'Defensa', 3], ['Esteban', 'Rojas Vidal', 'Medio', 6], ['Kevin', 'Ortiz Luna', 'Delantero', 10], ['Aldo', 'Reyes Mejía', 'Delantero', 7]],
    [['Tomás', 'Báez Ruiz', 'Portero', 1], ['Joel', 'Campos Ávila', 'Defensa', 5], ['Mauro', 'Silva Peña', 'Medio', 8], ['Erik', 'Duarte Soto', 'Delantero', 9], ['Fabián', 'Ponce Vera', 'Delantero', 10]],
    [['Nicolás', 'Herrera Cruz', 'Portero', 1], ['Bruno', 'Aguilar Mata', 'Defensa', 2], ['Leo', 'Cortés Nava', 'Medio', 6], ['Ramiro', 'Zamora Tapia', 'Delantero', 9], ['Gael', 'Pacheco Ríos', 'Delantero', 11]],
  ]
  const jugadores = []
  planteles.forEach((plantel, e) => plantel.forEach(([nombre, apellidos, posicion, dorsal], i) => jugadores.push({ id: jugadores.length + 1, equipoId: e + 1, nombre, apellidos, posicion, dorsal: String(dorsal), curp: '', fotoUrl: '', huella: i !== 4 })))
  ;[[5, 'Valeria', 'Cruz Ortega', 'Portero', 1], [5, 'Daniela', 'Soto Ramos', 'Delantero', 7], [5, 'Karen', 'Lugo Pérez', 'Medio', 10], [6, 'Mariana', 'Díaz Flores', 'Portero', 1], [6, 'Fernanda', 'Ríos Salas', 'Delantero', 9], [7, 'Ximena', 'Torres Gil', 'Defensa', 5]]
    .forEach(([equipoId, nombre, apellidos, posicion, dorsal]) => jugadores.push({ id: jugadores.length + 1, equipoId, nombre, apellidos, posicion, dorsal: String(dorsal), curp: '', fotoUrl: '', huella: false }))
  const ev = (partidoId, equipoId, jugadorId, tipo, minuto) => ({ partidoId, equipoId, jugadorId, tipo, minuto })
  const p = (id, jornada, fecha, canchaId, localId, visitanteId, estado, gl = 0, gv = 0) => ({ id, torneoId: 1, jornada, fecha, horaInicio: '10:00', horaFin: '11:00', canchaId, localId, visitanteId, golesLocal: gl, golesVisitante: gv, estado, arbitroId: 2 })
  const pago = (id, equipoId, concepto, monto, fechaPago, extra = {}) => ({ id, equipoId, concepto, torneoId: 1, monto, metodo: 'EFECTIVO', estado: 'CUBIERTO', fechaPago: `${fechaPago}T11:00:00`, folio: `CG-${String(id).padStart(6, '0')}`, ...extra })
  return {
    contadores: {},
    categorias: [{ id: 1, nombre: 'Varonil', descripcion: 'Equipos varoniles', activa: true }, { id: 2, nombre: 'Femenil', descripcion: 'Equipos femeniles', activa: true }, { id: 3, nombre: 'Mixto', descripcion: 'Equipos mixtos', activa: true }, { id: 4, nombre: 'Libre', descripcion: 'Categoría libre', activa: true }],
    torneos: [
      { id: 1, nombre: 'Apertura 2026 Varonil', descripcion: 'Torneo de liga a una vuelta', categoriaId: 1, fechaInicio: mas(-7), fechaFin: mas(75), estado: 'EN_PROGRESO', cuotaInscripcion: 1500, cuotaArbitraje: 150, limiteAmarillas: 3 },
      { id: 2, nombre: 'Apertura 2026 Femenil', descripcion: 'Inscripciones abiertas', categoriaId: 2, fechaInicio: mas(14), fechaFin: mas(95), estado: 'EN_INSCRIPCION', cuotaInscripcion: 1200, cuotaArbitraje: 150, limiteAmarillas: 3 },
    ],
    equipos: nombres.map(([nombre, delegado, telefono], i) => ({ id: i + 1, nombre, delegado, telefono, logoUrl: null })),
    inscripciones: [1, 2, 3, 4].map((e) => ({ torneoId: 1, equipoId: e, pagada: true })).concat([5, 6, 7].map((e, i) => ({ torneoId: 2, equipoId: e, pagada: i === 0 }))),
    jugadores,
    canchas: [{ id: 1, nombre: 'Cancha 1' }, { id: 2, nombre: 'Cancha 2' }, { id: 3, nombre: 'Cancha 3' }],
    partidos: [p(1, 1, mas(-7), 1, 1, 2, 'FINALIZADO', 2, 1), p(2, 1, mas(-7), 2, 3, 4, 'FINALIZADO', 1, 2), p(3, 2, hoy(), 1, 1, 3, 'PROGRAMADO'), p(4, 2, hoy(), 2, 2, 4, 'PROGRAMADO'), p(5, 3, mas(7), 1, 1, 4, 'PROGRAMADO'), p(6, 3, mas(7), 2, 2, 3, 'PROGRAMADO')],
    eventos: [ev(1, 1, 4, 'GOL', 12), ev(1, 1, 4, 'GOL', 33), ev(1, 2, 9, 'GOL', 45), ev(1, 1, 3, 'AMARILLA', 20), ev(1, 2, 8, 'AMARILLA', 50), ev(2, 3, 14, 'GOL', 8), ev(2, 4, 19, 'GOL', 22), ev(2, 4, 19, 'GOL', 40), ev(2, 3, 12, 'ROJA', 55)],
    pagos: [
      pago(1, 1, 'INSCRIPCION', 1500, mas(-12)), pago(2, 2, 'INSCRIPCION', 1500, mas(-12), { metodo: 'TRANSFERENCIA' }), pago(3, 3, 'INSCRIPCION', 1500, mas(-11)), pago(4, 4, 'INSCRIPCION', 1500, mas(-11), { metodo: 'TARJETA' }),
      pago(5, 1, 'ARBITRAJE', 150, mas(-7), { partidoId: 1 }), pago(6, 2, 'ARBITRAJE', 150, mas(-7), { partidoId: 1 }), pago(7, 3, 'ARBITRAJE', 150, mas(-7), { partidoId: 2 }), pago(8, 4, 'ARBITRAJE', 150, mas(-7), { partidoId: 2 }),
      pago(9, 4, 'MULTA', 100, mas(-7), { descripcion: 'Retardo en presentación del equipo' }),
      pago(10, 1, 'ARBITRAJE', 150, hoy(), { partidoId: 3 }), pago(11, 3, 'ARBITRAJE', 150, hoy(), { partidoId: 3 }),
      { id: 12, equipoId: 5, concepto: 'INSCRIPCION', torneoId: 2, monto: 1200, metodo: 'EFECTIVO', estado: 'CUBIERTO', fechaPago: `${hoy()}T09:30:00`, folio: 'CG-000012' },
    ],
    // Pase de lista biométrico (HU-01). resultado: AUTORIZADO | HUELLA_NO_COINCIDE | SUSPENDIDO
    pases: [1, 2].flatMap((partidoId) => jugadores
      .filter((j) => (partidoId === 1 ? [1, 2] : [3, 4]).includes(j.equipoId))
      .map((j, i) => ({ partidoId, jugadorId: j.id, equipoId: j.equipoId, resultado: j.huella ? 'AUTORIZADO' : 'HUELLA_NO_COINCIDE', metodo: 'HUELLA', tiempoMs: 900 + ((j.id * 137) % 1700), validadoEn: `${partidoId === 1 ? mas(-7) : mas(-7)}T09:${String(40 + (i % 15)).padStart(2, '0')}:00` }))),
    usuarios: [
      { id: 1, username: 'admin', nombreCompleto: 'Administrador General', email: 'admin@codegol.mx', rol: 'ROLE_ADMIN', password: 'codegol123' },
      { id: 2, username: 'arbitro', nombreCompleto: 'Carlos Árbitro', email: 'arbitro@codegol.mx', rol: 'ROLE_ARBITRO', password: 'codegol123' },
      { id: 3, username: 'mesa', nombreCompleto: 'Mesa de Control', email: 'mesa@codegol.mx', rol: 'ROLE_MESA_CONTROL', password: 'codegol123' },
    ],
  }
}

let db = null
function cargar() {
  if (db) return db
  try { db = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { db = null }
  if (!db) { db = semilla(); guardar() }
  if (!db.pases) { db.pases = semilla().pases; guardar() } // bases demo guardadas antes de existir el pase de lista
  return db
}
function guardar() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* sin almacenamiento */ } }
function siguiente(col) { const d = cargar(); return Math.max(0, ...d[col].map((x) => x.id)) + 1 }

// ---------- vistas enriquecidas (mismo formato que devolverá la API) ----------
const nombreEquipo = (id) => cargar().equipos.find((e) => e.id === id)?.nombre || '—'
const vistaTorneo = (t) => ({ ...t, categoria: cargar().categorias.find((c) => c.id === t.categoriaId) || null })
const vistaJugador = (j) => ({ ...j, equipo: nombreEquipo(j.equipoId) })
const vistaPartido = (p) => {
  const d = cargar()
  const cubiertos = d.pagos.filter((x) => x.partidoId === p.id && x.concepto === 'ARBITRAJE' && x.estado === 'CUBIERTO').length
  return { ...p, torneo: d.torneos.find((t) => t.id === p.torneoId)?.nombre, cancha: d.canchas.find((c) => c.id === p.canchaId)?.nombre, local: nombreEquipo(p.localId), visitante: nombreEquipo(p.visitanteId), arbitro: d.usuarios.find((u) => u.id === p.arbitroId)?.nombreCompleto || null, arbitrajeCubierto: cubiertos >= 2, equiposPagados: cubiertos }
}
const vistaEvento = (e) => { const d = cargar(); const j = d.jugadores.find((x) => x.id === e.jugadorId); return { ...e, jugador: j ? `${j.nombre} ${j.apellidos}`.trim() : 'Jugador', dorsal: j?.dorsal || '', equipo: nombreEquipo(e.equipoId) } }
const vistaPago = (p) => ({ ...p, equipo: nombreEquipo(p.equipoId), torneo: cargar().torneos.find((t) => t.id === p.torneoId)?.nombre || null })
const equiposDe = (torneoId) => cargar().inscripciones.filter((i) => i.torneoId === torneoId).map((i) => ({ ...cargar().equipos.find((e) => e.id === i.equipoId), torneoId, torneoNombre: cargar().torneos.find((t) => t.id === torneoId)?.nombre, pagoInscripcionCubierto: i.pagada }))
const partidosDe = (torneoId) => cargar().partidos.filter((p) => !torneoId || p.torneoId === Number(torneoId))

export const demo = {
  reiniciar() { db = semilla(); guardar() },

  // --- torneos / categorías / equipos (mismos contratos que usaba el front) ---
  categorias: () => clonar(cargar().categorias),
  crearCategoria(datos) { const c = { id: siguiente('categorias'), nombre: datos.nombre, descripcion: datos.descripcion || '', activa: datos.activa !== false }; cargar().categorias.push(c); guardar(); return clonar(c) },
  torneos: () => clonar(cargar().torneos.map(vistaTorneo)),
  torneo(id) { const t = cargar().torneos.find((x) => x.id === Number(id)); if (!t) throw fallo('Torneo no encontrado.', 404); return clonar(vistaTorneo(t)) },
  crearTorneo(datos) {
    const t = { id: siguiente('torneos'), nombre: datos.nombre, descripcion: datos.descripcion || '', categoriaId: Number(datos.categoriaId), fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin || null, estado: datos.estado || 'EN_INSCRIPCION', cuotaInscripcion: Number(datos.cuotaInscripcion) || 0, cuotaArbitraje: Number(datos.cuotaArbitraje) || 0, limiteAmarillas: Number(datos.limiteAmarillas) || 3 }
    cargar().torneos.push(t); guardar(); return clonar(vistaTorneo(t))
  },
  equipos: () => clonar(cargar().equipos),
  equiposDeTorneo: (torneoId) => clonar(equiposDe(Number(torneoId))),
  inscribirEquipo(datos) {
    const d = cargar(); const torneoId = Number(datos.torneoId)
    let equipo = d.equipos.find((e) => e.nombre.toLowerCase() === datos.nombre.toLowerCase())
    if (!equipo) { equipo = { id: siguiente('equipos'), nombre: datos.nombre, delegado: datos.delegado, telefono: datos.telefono, logoUrl: datos.logoUrl }; d.equipos.push(equipo) }
    if (d.inscripciones.some((i) => i.torneoId === torneoId && i.equipoId === equipo.id)) throw fallo('Ese equipo ya está inscrito en el torneo.', 409)
    d.inscripciones.push({ torneoId, equipoId: equipo.id, pagada: false }); guardar()
    if (datos.pagoInscripcionCubierto) this.registrarPago({ equipoId: equipo.id, torneoId, concepto: 'INSCRIPCION', metodo: 'EFECTIVO' })
    return clonar(equipo)
  },

  actualizarTorneo(id, datos) {
    const t = cargar().torneos.find((x) => x.id === Number(id)); if (!t) throw fallo('Torneo no encontrado.', 404)
    if (datos.estado && !['EN_INSCRIPCION', 'EN_PROGRESO', 'FINALIZADO', 'CANCELADO'].includes(datos.estado)) throw fallo('Estado de torneo no válido.')
    Object.assign(t, datos); guardar(); return clonar(vistaTorneo(t))
  },
  editarEquipo(id, datos) {
    const d = cargar(); const e = d.equipos.find((x) => x.id === Number(id)); if (!e) throw fallo('Equipo no encontrado.', 404)
    if (datos.nombre && d.equipos.some((x) => x.id !== e.id && x.nombre.toLowerCase() === datos.nombre.toLowerCase())) throw fallo('Ya existe otro equipo con ese nombre.', 409)
    Object.assign(e, datos); guardar(); return clonar(e)
  },

  // --- jugadores ---
  jugadores: (equipoId) => clonar(cargar().jugadores.filter((j) => !equipoId || j.equipoId === Number(equipoId)).map(vistaJugador)),
  crearJugador(datos) { const j = { id: siguiente('jugadores'), equipoId: Number(datos.equipoId), nombre: datos.nombre, apellidos: datos.apellidos || '', posicion: datos.posicion || 'Delantero', dorsal: datos.dorsal || '', curp: datos.curp || '', fotoUrl: datos.fotoUrl || '', huella: false }; cargar().jugadores.push(j); guardar(); return clonar(vistaJugador(j)) },
  editarJugador(id, datos) { const j = cargar().jugadores.find((x) => x.id === Number(id)); if (!j) throw fallo('Jugador no encontrado.', 404); Object.assign(j, datos, { equipoId: Number(datos.equipoId ?? j.equipoId) }); guardar(); return clonar(vistaJugador(j)) },
  eliminarJugador(id) { const d = cargar(); d.jugadores = d.jugadores.filter((x) => x.id !== Number(id)); guardar(); return null },

  // --- calendario ---
  canchas: () => clonar(cargar().canchas),
  partidos: (torneoId) => clonar(partidosDe(torneoId).map(vistaPartido).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio) || a.canchaId - b.canchaId)),
  crearPartido(datos) {
    const d = cargar()
    const cand = { ...datos, torneoId: Number(datos.torneoId), canchaId: Number(datos.canchaId), localId: Number(datos.localId), visitanteId: Number(datos.visitanteId), jornada: Number(datos.jornada) }
    if (cand.localId === cand.visitanteId) throw fallo('Elige dos equipos distintos.')
    if (cand.fecha < hoy()) throw fallo('La fecha del partido no puede ser anterior a hoy.')
    const elegibles = equiposDe(cand.torneoId).filter((e) => e.pagoInscripcionCubierto).map((e) => e.id)
    if (![cand.localId, cand.visitanteId].every((id) => elegibles.includes(id))) throw fallo('Ambos equipos deben estar inscritos y con la inscripción pagada.', 409)
    const motivo = motivoTraslape(d.partidos, cand); if (motivo) throw fallo(`Traslape: ${motivo}`, 409)
    const p = { id: siguiente('partidos'), golesLocal: 0, golesVisitante: 0, estado: 'PROGRAMADO', arbitroId: null, ...cand }
    d.partidos.push(p); guardar(); return clonar(vistaPartido(p))
  },
  actualizarPartido(id, cambios) {
    const d = cargar(); const p = d.partidos.find((x) => x.id === Number(id)); if (!p) throw fallo('Partido no encontrado.', 404)
    const cand = { ...p, ...cambios }; const motivo = motivoTraslape(d.partidos, cand, p.id); if (motivo) throw fallo(`Traslape: ${motivo}`, 409)
    Object.assign(p, cambios); guardar(); return clonar(vistaPartido(p))
  },
  eliminarPartido(id) { const d = cargar(); d.partidos = d.partidos.filter((x) => x.id !== Number(id)); guardar(); return null },
  generarCalendario(torneoId, opciones) {
    const d = cargar(); const id = Number(torneoId)
    const equipoIds = equiposDe(id).filter((e) => e.pagoInscripcionCubierto).map((e) => e.id)
    if (equipoIds.length < 2) throw fallo('Se necesitan al menos 2 equipos con inscripción pagada.')
    if (d.partidos.some((p) => p.torneoId === id && p.estado !== 'PROGRAMADO')) throw fallo('El torneo ya tiene partidos jugados; no se puede regenerar el calendario.', 409)
    d.partidos = d.partidos.filter((p) => p.torneoId !== id)
    const { partidos, sinLugar } = generarRol({ ...opciones, equipoIds, existentes: d.partidos })
    partidos.forEach((p) => d.partidos.push({ id: siguiente('partidos'), torneoId: id, arbitroId: null, ...p }))
    guardar(); return { creados: partidos.length, sinLugar }
  },
  borrarCalendario(torneoId) { const d = cargar(); d.partidos = d.partidos.filter((p) => p.torneoId !== Number(torneoId) || p.estado !== 'PROGRAMADO'); guardar(); return null },
  cedula(partidoId) {
    const d = cargar(); const p = d.partidos.find((x) => x.id === Number(partidoId)); if (!p) throw fallo('Partido no encontrado.', 404)
    const suspendidos = this.suspensiones(p.torneoId)
    const pases = d.pases.filter((x) => x.partidoId === p.id).map((x) => { const j = d.jugadores.find((y) => y.id === x.jugadorId); return { ...x, jugador: j ? `${j.nombre} ${j.apellidos}`.trim() : 'Jugador', dorsal: j?.dorsal || '', fotoUrl: j?.fotoUrl || '', equipo: nombreEquipo(x.equipoId) } })
    const eventos = d.eventos.filter((x) => x.partidoId === p.id).sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0)).map(vistaEvento)
    const plantillas = [p.localId, p.visitanteId].map((id) => ({ equipoId: id, equipo: nombreEquipo(id), jugadores: d.jugadores.filter((j) => j.equipoId === id).map((j) => ({ jugadorId: j.id, jugador: `${j.nombre} ${j.apellidos}`.trim(), dorsal: j.dorsal, huella: j.huella, suspendido: suspendidos.some((s) => s.jugadorId === j.id) })) }))
    return clonar({ partido: vistaPartido(p), pases, eventos, plantillas })
  },
  arbitros: () => clonar(cargar().usuarios.filter((u) => u.rol === 'ROLE_ARBITRO' || u.rol === 'ROLE_MESA_CONTROL')),
  usuarios: () => clonar(cargar().usuarios.map(({ password, ...u }) => u)), // eslint-disable-line no-unused-vars
  // Cuentas del modo demostración (solo viven en este navegador; con backend real se usa auth/registro y auth/login).
  registrarUsuario(datos) {
    const d = cargar()
    const username = String(datos.username ?? '')
    if (d.usuarios.some((u) => u.username === username)) throw fallo('Ese nombre de usuario ya está registrado.', 409)
    if (d.usuarios.some((u) => String(u.email).toLowerCase() === String(datos.email).trim().toLowerCase())) throw fallo('Ese correo ya está registrado.', 409)
    const u = { id: siguiente('usuarios'), username, nombreCompleto: String(datos.nombreCompleto).trim().replace(/\s+/g, ' '), email: String(datos.email).trim(), rol: datos.rol || 'ROLE_ADMIN', password: datos.password }
    d.usuarios.push(u); guardar(); const { password, ...publico } = u; return clonar(publico) // eslint-disable-line no-unused-vars
  },
  cambiarRol(id, rol) {
    const d = cargar(); const u = d.usuarios.find((x) => x.id === Number(id)); if (!u) throw fallo('Usuario no encontrado.', 404)
    if (!['ROLE_ADMIN', 'ROLE_ARBITRO', 'ROLE_MESA_CONTROL'].includes(rol)) throw fallo('Rol no válido.')
    if (u.rol === 'ROLE_ADMIN' && rol !== 'ROLE_ADMIN' && d.usuarios.filter((x) => x.rol === 'ROLE_ADMIN').length <= 1) throw fallo('Debe quedar al menos un administrador en el sistema.', 409)
    u.rol = rol; guardar(); const { password, ...publico } = u; return clonar(publico) // eslint-disable-line no-unused-vars
  },
  iniciarSesion({ username, password }) {
    const u = cargar().usuarios.find((x) => x.username === username) // distingue mayúsculas y minúsculas
    if (!u || (u.password ?? 'codegol123') !== password) throw fallo('Usuario o contraseña incorrectos.', 401)
    return { token: `local-demo-${u.id}`, username: u.username, nombreCompleto: u.nombreCompleto, email: u.email, rol: u.rol }
  },

  // --- estadísticas ---
  posiciones(torneoId) { return calcularPosiciones(equiposDe(Number(torneoId)).filter((e) => e.pagoInscripcionCubierto), partidosDe(torneoId)) },
  goleadores(torneoId) { const d = cargar(); const ids = partidosDe(torneoId).map((p) => p.id); return calcularGoleadores(d.eventos.filter((e) => ids.includes(e.partidoId)), d.jugadores, d.equipos) },
  suspensiones(torneoId) {
    const d = cargar(); const t = d.torneos.find((x) => x.id === Number(torneoId)); const ps = partidosDe(torneoId); const ids = ps.map((p) => p.id)
    const eqIds = equiposDe(Number(torneoId)).map((e) => e.id)
    return calcularSuspensiones(ps, d.eventos.filter((e) => ids.includes(e.partidoId)), d.jugadores.filter((j) => eqIds.includes(j.equipoId)), d.equipos, t?.limiteAmarillas || 3)
  },

  // --- finanzas ---
  pagos({ desde, hasta, concepto } = {}) {
    return clonar(cargar().pagos.filter((p) => p.estado === 'CUBIERTO' && (!concepto || p.concepto === concepto) && (!desde || p.fechaPago.slice(0, 10) >= desde) && (!hasta || p.fechaPago.slice(0, 10) <= hasta)).map(vistaPago).sort((a, b) => b.fechaPago.localeCompare(a.fechaPago)))
  },
  registrarPago(datos) {
    const d = cargar(); const equipoId = Number(datos.equipoId); const torneoId = Number(datos.torneoId) || null
    const torneo = d.torneos.find((t) => t.id === torneoId)
    let monto = Number(datos.monto)
    if (!monto && torneo) monto = datos.concepto === 'INSCRIPCION' ? torneo.cuotaInscripcion : datos.concepto === 'ARBITRAJE' ? torneo.cuotaArbitraje : 0
    // Inscripción y arbitraje pueden costar $0 si el torneo así se configuró (la BD permite monto >= 0); una multa siempre lleva monto.
    if (datos.concepto === 'MULTA' ? !(monto > 0) : !(monto >= 0)) throw fallo('Escribe un monto mayor a cero.')
    if (datos.concepto === 'ARBITRAJE' && !datos.partidoId) throw fallo('Elige el partido al que corresponde el arbitraje.')
    if (datos.concepto === 'ARBITRAJE' && d.pagos.some((p) => p.partidoId === Number(datos.partidoId) && p.equipoId === equipoId && p.concepto === 'ARBITRAJE' && p.estado === 'CUBIERTO')) throw fallo('Ese equipo ya pagó el arbitraje de este partido.', 409)
    const id = siguiente('pagos')
    const pago = { id, equipoId, concepto: datos.concepto, torneoId, partidoId: datos.partidoId ? Number(datos.partidoId) : null, monto, metodo: datos.metodo || 'EFECTIVO', estado: 'CUBIERTO', fechaPago: ahoraISO(), descripcion: datos.descripcion || '', folio: `CG-${String(id).padStart(6, '0')}` }
    d.pagos.push(pago)
    if (pago.concepto === 'INSCRIPCION') { const ins = d.inscripciones.find((i) => i.torneoId === torneoId && i.equipoId === equipoId); if (ins) ins.pagada = true }
    guardar(); return clonar(vistaPago(pago))
  },
  recibo(id) { const p = cargar().pagos.find((x) => x.id === Number(id)); if (!p) throw fallo('Pago no encontrado.', 404); return clonar(vistaPago(p)) },
}
