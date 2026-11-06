package com.codegol.api.modules.calendario.service;

import com.codegol.api.modules.auth.model.Rol;
import com.codegol.api.modules.auth.model.Usuario;
import com.codegol.api.modules.auth.repository.UsuarioRepository;
import com.codegol.api.modules.calendario.dto.ActualizarPartidoRequest;
import com.codegol.api.modules.calendario.dto.CalendarioGeneradoResponse;
import com.codegol.api.modules.calendario.dto.CanchaResponse;
import com.codegol.api.modules.calendario.dto.CrearPartidoRequest;
import com.codegol.api.modules.calendario.dto.GenerarCalendarioRequest;
import com.codegol.api.modules.calendario.dto.PartidoResponse;
import com.codegol.api.modules.calendario.exception.CalendarioException;
import com.codegol.api.modules.calendario.model.Cancha;
import com.codegol.api.modules.calendario.model.EstadoPartido;
import com.codegol.api.modules.calendario.model.Jornada;
import com.codegol.api.modules.calendario.model.Partido;
import com.codegol.api.modules.calendario.repository.CanchaRepository;
import com.codegol.api.modules.calendario.repository.CoberturaArbitrajeRepository;
import com.codegol.api.modules.calendario.repository.JornadaRepository;
import com.codegol.api.modules.calendario.repository.PartidoRepository;
import com.codegol.api.modules.torneos.model.Equipo;
import com.codegol.api.modules.torneos.model.EstadoTorneo;
import com.codegol.api.modules.torneos.model.Torneo;
import com.codegol.api.modules.torneos.repository.EquipoRepository;
import com.codegol.api.modules.torneos.repository.TorneoRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CalendarioService {
    private static final ZoneId ZONA_LIGA = ZoneId.of("America/Mexico_City");
    private static final int DIAS_BUSQUEDA_POR_JORNADA = 7;

    private final CanchaRepository canchaRepository;
    private final JornadaRepository jornadaRepository;
    private final PartidoRepository partidoRepository;
    private final EquipoRepository equipoRepository;
    private final TorneoRepository torneoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CoberturaArbitrajeRepository coberturaArbitrajeRepository;

    @Transactional(readOnly = true)
    public List<CanchaResponse> listarCanchas() {
        return canchaRepository.findByActivaTrueOrderByIdAsc().stream()
                .map(cancha -> new CanchaResponse(cancha.getId(), cancha.getNombre()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PartidoResponse> listarPartidos(Long torneoId) {
        if (torneoId != null && torneoId <= 0) throw CalendarioException.invalid("El torneo no es válido.");
        if (torneoId != null && !torneoRepository.existsById(torneoId)) {
            throw CalendarioException.notFound("No se encontró el torneo solicitado.");
        }
        List<Partido> partidos = partidoRepository.listarCalendario(torneoId);
        Map<Long, Set<Long>> pagos = coberturaArbitrajeRepository.equiposConArbitrajePagado(
                partidos.stream().map(Partido::getId).toList());
        return partidos.stream().map(partido -> convertir(partido, pagos)).toList();
    }

    @Transactional
    public PartidoResponse crearPartido(CrearPartidoRequest request) {
        Torneo torneo = bloquearTorneo(request.getTorneoId());
        validarTorneoAbierto(torneo);
        validarFechaDelTorneo(torneo, request.getFecha());
        validarHoras(request.getHoraInicio(), request.getHoraFin());
        if (request.getLocalId().equals(request.getVisitanteId())) {
            throw CalendarioException.invalid("Elige dos equipos distintos.");
        }

        List<Equipo> elegibles = equiposPagados(torneo.getId());
        Set<Long> idsElegibles = elegibles.stream().map(Equipo::getId).collect(Collectors.toSet());
        if (!idsElegibles.containsAll(List.of(request.getLocalId(), request.getVisitanteId()))) {
            throw CalendarioException.conflict("Ambos equipos deben pertenecer al torneo y tener la inscripción pagada.");
        }
        Cancha cancha = bloquearCanchas(List.of(request.getCanchaId())).get(0);
        if (!cancha.isActiva()) throw CalendarioException.conflict("La cancha seleccionada está inactiva.");
        bloquearEquipos(List.of(request.getLocalId(), request.getVisitanteId()));

        Partido candidato = new Partido();
        candidato.setFecha(request.getFecha());
        candidato.setHoraInicio(request.getHoraInicio());
        candidato.setHoraFin(request.getHoraFin());
        candidato.setCancha(cancha);
        candidato.setEquipoLocal(buscarEquipo(elegibles, request.getLocalId()));
        candidato.setEquipoVisitante(buscarEquipo(elegibles, request.getVisitanteId()));
        validarSinTraslapes(candidato, null);

        short numeroJornada = numeroJornada(request.getJornada());
        Jornada jornada = jornadaRepository.findByTorneoIdAndNumero(torneo.getId(), numeroJornada)
                .orElseGet(() -> crearJornada(torneo, numeroJornada));
        jornada.setFechaInicio(minFecha(jornada.getFechaInicio(), candidato.getFecha()));
        jornada.setFechaFin(maxFecha(jornada.getFechaFin(), candidato.getFecha()));
        candidato.setJornada(jornada);
        candidato.setEstado(EstadoPartido.PROGRAMADO);
        partidoRepository.saveAndFlush(candidato);
        return convertir(candidato, coberturaArbitrajeRepository.equiposConArbitrajePagado(List.of(candidato.getId())));
    }

    @Transactional
    public CalendarioGeneradoResponse generarCalendario(Long torneoId, GenerarCalendarioRequest request) {
        Torneo torneo = bloquearTorneo(torneoId);
        validarTorneoAbierto(torneo);
        if (request.getFechaInicio().isBefore(hoy()) || request.getFechaInicio().isBefore(torneo.getFechaInicio())) {
            throw CalendarioException.invalid("La primera jornada debe ser hoy o una fecha posterior y no puede iniciar antes del torneo.");
        }
        if (request.getDiasEntreJornadas() == null || request.getDiasEntreJornadas() < 1 || request.getDiasEntreJornadas() > 30) {
            throw CalendarioException.invalid("Los días entre jornadas deben estar entre 1 y 30.");
        }
        if (request.getDuracionMin() == null || request.getDuracionMin() < 1 || request.getDuracionMin() > 180) {
            throw CalendarioException.invalid("La duración debe estar entre 1 y 180 minutos.");
        }
        if (request.getJornadaInicial() == null || request.getJornadaInicial() < 1
                || request.getJornadaInicial() > Short.MAX_VALUE) {
            throw CalendarioException.invalid("El número de la primera jornada no es válido.");
        }
        List<String> horarios = validarHorarios(request.getHorarios(), request.getDuracionMin());
        List<Long> canchasSolicitadas = validarIdsUnicos(request.getCanchaIds(), "No repitas canchas.");
        if (horarios.isEmpty() || canchasSolicitadas.isEmpty()) {
            throw CalendarioException.invalid("Elige al menos un horario y una cancha.");
        }

        List<Equipo> elegibles = equiposPagados(torneoId);
        if (elegibles.size() < 2) throw CalendarioException.invalid("Se necesitan al menos 2 equipos inscritos y con inscripción pagada.");
        if (elegibles.size() > 128) throw CalendarioException.invalid("El torneo supera el máximo de 128 equipos para generar el calendario.");

        List<Cancha> canchas = bloquearCanchas(canchasSolicitadas);
        if (canchas.size() != canchasSolicitadas.size() || canchas.stream().anyMatch(c -> !c.isActiva())) {
            throw CalendarioException.conflict("Una o más canchas ya no existen o están inactivas. Actualiza la pantalla e inténtalo de nuevo.");
        }
        List<Long> equipoIds = elegibles.stream().map(Equipo::getId).sorted().toList();
        bloquearEquipos(equipoIds);

        List<Partido> anteriores = partidoRepository.findByJornadaTorneoId(torneoId);
        if (anteriores.stream().anyMatch(p -> p.getEstado() != EstadoPartido.PROGRAMADO)) {
            throw CalendarioException.conflict("El torneo ya tiene partidos jugados o en curso; no se puede regenerar el calendario.");
        }
        if (!coberturaArbitrajeRepository.partidosConPagosAsociados(anteriores.stream().map(Partido::getId).toList()).isEmpty()) {
            throw CalendarioException.conflict("No se puede reemplazar un partido que ya tiene pagos asociados.");
        }

        partidoRepository.deleteAll(anteriores);
        partidoRepository.flush();
        limpiarJornadasVacias(torneoId);

        List<GeneradorLiga.Encuentro> encuentros = GeneradorLiga.generar(
                equipoIds, request.isDobleVuelta(), request.getJornadaInicial());
        if (encuentros.stream().mapToInt(GeneradorLiga.Encuentro::jornada).max().orElse(request.getJornadaInicial()) > Short.MAX_VALUE) {
            throw CalendarioException.invalid("El calendario supera el número máximo de jornadas permitido.");
        }

        Map<LocalDate, List<Partido>> ocupadosPorFecha = new HashMap<>();
        List<CalendarioGeneradoResponse.PartidoNoAsignado> sinLugar = new ArrayList<>();
        Map<Integer, List<Partido>> porJornada = new HashMap<>();
        int duracion = request.getDuracionMin();

        for (GeneradorLiga.Encuentro encuentro : encuentros) {
            LocalDate fechaBase = request.getFechaInicio().plusDays((long) (encuentro.jornada() - request.getJornadaInicial()) * request.getDiasEntreJornadas());
            Partido colocado = null;
            for (int extra = 0; extra < DIAS_BUSQUEDA_POR_JORNADA && colocado == null; extra++) {
                LocalDate fecha = fechaBase.plusDays(extra);
                if (torneo.getFechaFin() != null && fecha.isAfter(torneo.getFechaFin())) break;
                for (String horario : horarios) {
                    LocalTime inicio = LocalTime.parse(horario);
                    int finMinutos = inicio.getHour() * 60 + inicio.getMinute() + duracion;
                    if (finMinutos > (23 * 60 + 59)) continue;
                    LocalTime fin = LocalTime.of(finMinutos / 60, finMinutos % 60);
                    for (Cancha cancha : canchas) {
                        List<Partido> delDia = ocupadosPorFecha.computeIfAbsent(fecha,
                                d -> partidoRepository.findByFechaAndEstadoNot(d, EstadoPartido.CANCELADO));
                        Partido candidato = crearCandidato(fecha, inicio, fin, cancha,
                                buscarEquipo(elegibles, encuentro.localId()), buscarEquipo(elegibles, encuentro.visitanteId()));
                        if (motivoTraslape(delDia, candidato, null) != null) continue;
                        colocado = candidato;
                        delDia.add(colocado);
                        porJornada.computeIfAbsent(encuentro.jornada(), ignored -> new ArrayList<>()).add(colocado);
                        break;
                    }
                    if (colocado != null) break;
                }
            }
            if (colocado == null) {
                sinLugar.add(new CalendarioGeneradoResponse.PartidoNoAsignado(encuentro.jornada(), encuentro.localId(), encuentro.visitanteId()));
            }
        }

        List<Partido> creados = new ArrayList<>();
        for (Map.Entry<Integer, List<Partido>> entrada : porJornada.entrySet().stream().sorted(Map.Entry.comparingByKey()).toList()) {
            Jornada jornada = crearJornada(torneo, numeroJornada(entrada.getKey()));
            LocalDate primera = entrada.getValue().stream().map(Partido::getFecha).min(LocalDate::compareTo).orElseThrow();
            LocalDate ultima = entrada.getValue().stream().map(Partido::getFecha).max(LocalDate::compareTo).orElseThrow();
            jornada.setFechaInicio(primera);
            jornada.setFechaFin(ultima);
            jornadaRepository.save(jornada);
            for (Partido partido : entrada.getValue()) {
                partido.setJornada(jornada);
                partido.setEstado(EstadoPartido.PROGRAMADO);
                partido.setGolesLocal((short) 0);
                partido.setGolesVisitante((short) 0);
                creados.add(partido);
            }
        }
        partidoRepository.saveAllAndFlush(creados);
        return new CalendarioGeneradoResponse(creados.size(), sinLugar);
    }

    @Transactional
    public PartidoResponse actualizarPartido(Long id, ActualizarPartidoRequest request) {
        Partido lectura = partidoRepository.findById(id)
                .orElseThrow(() -> CalendarioException.notFound("No se encontró el partido."));
        Torneo torneo = bloquearTorneo(lectura.getJornada().getTorneo().getId());
        Partido partido = partidoRepository.buscarParaActualizar(id)
                .orElseThrow(() -> CalendarioException.notFound("No se encontró el partido."));
        if (partido.getEstado() != EstadoPartido.PROGRAMADO) {
            throw CalendarioException.conflict("Solo se pueden reprogramar o asignar árbitro a partidos programados.");
        }

        boolean muevePartido = request.getFecha() != null || request.getHoraInicio() != null
                || request.getHoraFin() != null || request.getCanchaId() != null;
        Long canchaNuevaId = request.getCanchaId() != null ? request.getCanchaId() : partido.getCancha().getId();
        bloquearCanchas(List.of(partido.getCancha().getId(), canchaNuevaId).stream().distinct().sorted().toList());
        bloquearEquipos(List.of(partido.getEquipoLocal().getId(), partido.getEquipoVisitante().getId()).stream().sorted().toList());

        if (muevePartido) {
            LocalDate fecha = request.getFecha() != null ? request.getFecha() : partido.getFecha();
            LocalTime inicio = request.getHoraInicio() != null ? request.getHoraInicio() : partido.getHoraInicio();
            LocalTime fin = request.getHoraFin() != null ? request.getHoraFin() : partido.getHoraFin();
            validarFechaDelTorneo(torneo, fecha);
            validarHoras(inicio, fin);
            if (request.getCanchaId() != null) {
                Cancha cancha = canchaRepository.findById(request.getCanchaId())
                        .filter(Cancha::isActiva)
                        .orElseThrow(() -> CalendarioException.conflict("La cancha seleccionada no existe o está inactiva."));
                partido.setCancha(cancha);
            }
            partido.setFecha(fecha);
            partido.setHoraInicio(inicio);
            partido.setHoraFin(fin);
            validarSinTraslapes(partido, partido.getId());
            actualizarFechasJornada(partido.getJornada());
        }

        if (request.isArbitroIdPresente()) {
            if (request.getArbitroId() == null) {
                partido.setArbitro(null);
            } else {
                Usuario arbitro = usuarioRepository.findByIdAndRol(request.getArbitroId(), Rol.ROLE_ARBITRO)
                        .filter(Usuario::isActivo)
                        .orElseThrow(() -> CalendarioException.invalid("El usuario seleccionado no es un árbitro activo."));
                partido.setArbitro(arbitro);
            }
        }

        partidoRepository.saveAndFlush(partido);
        return convertir(partido, coberturaArbitrajeRepository.equiposConArbitrajePagado(List.of(partido.getId())));
    }

    @Transactional
    public void eliminarPartido(Long id) {
        Partido lectura = partidoRepository.findById(id)
                .orElseThrow(() -> CalendarioException.notFound("No se encontró el partido."));
        bloquearTorneo(lectura.getJornada().getTorneo().getId());
        Partido partido = partidoRepository.buscarParaActualizar(id)
                .orElseThrow(() -> CalendarioException.notFound("No se encontró el partido."));
        bloquearCanchas(List.of(partido.getCancha().getId()));
        bloquearEquipos(List.of(partido.getEquipoLocal().getId(), partido.getEquipoVisitante().getId()).stream().sorted().toList());
        exigirProgramado(partido);
        if (!coberturaArbitrajeRepository.partidosConPagosAsociados(List.of(partido.getId())).isEmpty()) {
            throw CalendarioException.conflict("No se puede eliminar un partido que ya tiene pagos asociados.");
        }
        Jornada jornada = partido.getJornada();
        partidoRepository.delete(partido);
        partidoRepository.flush();
        limpiarJornadaSiVacia(jornada);
    }

    @Transactional
    public void borrarCalendario(Long torneoId) {
        bloquearTorneo(torneoId);
        List<Partido> programados = partidoRepository.findByJornadaTorneoIdAndEstadoNot(torneoId, EstadoPartido.CANCELADO)
                .stream().filter(p -> p.getEstado() == EstadoPartido.PROGRAMADO).toList();
        Set<Long> canchaIds = programados.stream().map(p -> p.getCancha().getId()).collect(Collectors.toCollection(TreeSet::new));
        Set<Long> equipoIds = new TreeSet<>();
        programados.forEach(p -> { equipoIds.add(p.getEquipoLocal().getId()); equipoIds.add(p.getEquipoVisitante().getId()); });
        if (!canchaIds.isEmpty()) bloquearCanchas(canchaIds);
        if (!equipoIds.isEmpty()) bloquearEquipos(equipoIds);

        List<Long> partidoIds = programados.stream().map(Partido::getId).toList();
        if (!coberturaArbitrajeRepository.partidosConPagosAsociados(partidoIds).isEmpty()) {
            throw CalendarioException.conflict("No se pueden borrar partidos programados que ya tienen pagos asociados.");
        }
        Set<Jornada> jornadas = programados.stream().map(Partido::getJornada).collect(Collectors.toSet());
        partidoRepository.deleteAll(programados);
        partidoRepository.flush();
        jornadas.forEach(this::limpiarJornadaSiVacia);
    }

    private Torneo bloquearTorneo(Long id) {
        if (id == null || id <= 0) throw CalendarioException.invalid("El torneo no es válido.");
        return torneoRepository.bloquearPorId(id)
                .orElseThrow(() -> CalendarioException.notFound("No se encontró el torneo."));
    }

    private void validarTorneoAbierto(Torneo torneo) {
        if (torneo.getEstado() == EstadoTorneo.FINALIZADO || torneo.getEstado() == EstadoTorneo.CANCELADO) {
            throw CalendarioException.conflict("No se puede modificar el calendario de un torneo finalizado o cancelado.");
        }
    }

    private void validarFechaDelTorneo(Torneo torneo, LocalDate fecha) {
        if (fecha == null || fecha.isBefore(hoy())) throw CalendarioException.invalid("La fecha del partido no puede ser anterior a hoy.");
        if (torneo.getFechaInicio() != null && fecha.isBefore(torneo.getFechaInicio())) {
            throw CalendarioException.invalid("La fecha del partido no puede ser anterior al inicio del torneo.");
        }
        if (torneo.getFechaFin() != null && fecha.isAfter(torneo.getFechaFin())) {
            throw CalendarioException.invalid("La fecha del partido no puede ser posterior al cierre del torneo.");
        }
    }

    private LocalDate hoy() {
        return LocalDate.now(ZONA_LIGA);
    }

    private void validarHoras(LocalTime inicio, LocalTime fin) {
        if (inicio == null || fin == null || !fin.isAfter(inicio)) {
            throw CalendarioException.invalid("La hora de fin debe ser posterior a la hora de inicio.");
        }
        if (inicio.getSecond() != 0 || inicio.getNano() != 0 || fin.getSecond() != 0 || fin.getNano() != 0) {
            throw CalendarioException.invalid("Las horas deben indicar minutos exactos, sin segundos.");
        }
    }

    private List<String> validarHorarios(List<String> valores, int duracion) {
        if (valores == null || valores.isEmpty()) throw CalendarioException.invalid("Elige al menos un horario.");
        LinkedHashSet<String> unicos = new LinkedHashSet<>();
        for (String valor : valores) {
            try {
                LocalTime hora = LocalTime.parse(valor);
                if (!hora.equals(hora.withSecond(0).withNano(0))) throw new IllegalArgumentException();
                int fin = hora.getHour() * 60 + hora.getMinute() + duracion;
                if (fin > (23 * 60 + 59)) throw CalendarioException.invalid("Uno de los partidos terminaría después de la medianoche.");
                if (!unicos.add(valor)) throw CalendarioException.invalid("No repitas horarios.");
            } catch (CalendarioException e) {
                throw e;
            } catch (RuntimeException e) {
                throw CalendarioException.invalid("Usa horarios válidos en formato HH:mm.");
            }
        }
        return List.copyOf(unicos);
    }

    private List<Long> validarIdsUnicos(List<Long> valores, String mensaje) {
        if (valores == null || valores.stream().anyMatch(id -> id == null || id <= 0)) {
            throw CalendarioException.invalid("Hay una cancha seleccionada no válida.");
        }
        List<Long> ids = valores.stream().distinct().sorted().toList();
        if (ids.size() != valores.size()) throw CalendarioException.invalid(mensaje);
        return ids;
    }

    private short numeroJornada(Integer valor) {
        if (valor == null || valor < 1 || valor > Short.MAX_VALUE) {
            throw CalendarioException.invalid("El número de jornada no es válido.");
        }
        return valor.shortValue();
    }

    private List<Equipo> equiposPagados(Long torneoId) {
        return equipoRepository.findByTorneoId(torneoId).stream()
                .filter(Equipo::isPagoInscripcionCubierto)
                .sorted(Comparator.comparing(Equipo::getId))
                .toList();
    }

    private Equipo buscarEquipo(List<Equipo> equipos, Long id) {
        return equipos.stream().filter(e -> e.getId().equals(id)).findFirst()
                .orElseThrow(() -> CalendarioException.conflict("Uno de los equipos ya no está inscrito en el torneo."));
    }

    private List<Cancha> bloquearCanchas(Collection<Long> ids) {
        List<Long> ordenados = ids.stream().distinct().sorted().toList();
        if (ordenados.isEmpty()) throw CalendarioException.invalid("Elige al menos una cancha.");
        List<Cancha> canchas = canchaRepository.bloquearPorIds(ordenados);
        if (canchas.size() != ordenados.size()) throw CalendarioException.notFound("Una de las canchas seleccionadas no existe.");
        return canchas;
    }

    private void bloquearEquipos(Collection<Long> ids) {
        List<Long> ordenados = ids.stream().distinct().sorted().toList();
        if (equipoRepository.bloquearPorIds(ordenados).size() != ordenados.size()) {
            throw CalendarioException.notFound("Uno de los equipos seleccionados no existe.");
        }
    }

    private Jornada crearJornada(Torneo torneo, short numero) {
        Jornada jornada = new Jornada();
        jornada.setTorneo(torneo);
        jornada.setNumero(numero);
        return jornadaRepository.save(jornada);
    }

    private Jornada crearJornada(Torneo torneo, int numero) {
        return crearJornada(torneo, numeroJornada(numero));
    }

    private Partido crearCandidato(LocalDate fecha, LocalTime inicio, LocalTime fin, Cancha cancha, Equipo local, Equipo visitante) {
        Partido partido = new Partido();
        partido.setFecha(fecha);
        partido.setHoraInicio(inicio);
        partido.setHoraFin(fin);
        partido.setCancha(cancha);
        partido.setEquipoLocal(local);
        partido.setEquipoVisitante(visitante);
        partido.setEstado(EstadoPartido.PROGRAMADO);
        return partido;
    }

    private void validarSinTraslapes(Partido candidato, Long ignorarId) {
        List<Partido> delDia = partidoRepository.findByFechaAndEstadoNot(candidato.getFecha(), EstadoPartido.CANCELADO);
        String motivo = motivoTraslape(delDia, candidato, ignorarId);
        if (motivo != null) throw CalendarioException.conflict(motivo);
    }

    private String motivoTraslape(List<Partido> existentes, Partido candidato, Long ignorarId) {
        for (Partido existente : existentes) {
            if (ignorarId != null && ignorarId.equals(existente.getId())) continue;
            if (existente.getEstado() == EstadoPartido.CANCELADO || !existente.getFecha().equals(candidato.getFecha())) continue;
            if (!existente.getHoraInicio().isBefore(candidato.getHoraFin())
                    || !candidato.getHoraInicio().isBefore(existente.getHoraFin())) continue;
            if (existente.getCancha().getId().equals(candidato.getCancha().getId())) {
                return "La cancha ya está ocupada en ese horario.";
            }
            Set<Long> existentesIds = Set.of(existente.getEquipoLocal().getId(), existente.getEquipoVisitante().getId());
            if (existentesIds.contains(candidato.getEquipoLocal().getId())
                    || existentesIds.contains(candidato.getEquipoVisitante().getId())) {
                return "Uno de los equipos ya juega en ese horario.";
            }
        }
        return null;
    }

    private void exigirProgramado(Partido partido) {
        if (partido.getEstado() != EstadoPartido.PROGRAMADO) {
            throw CalendarioException.conflict("Solo se pueden eliminar partidos programados.");
        }
    }

    private void limpiarJornadasVacias(Long torneoId) {
        for (Jornada jornada : jornadaRepository.findByTorneoIdOrderByNumeroAsc(torneoId)) {
            limpiarJornadaSiVacia(jornada);
        }
    }

    private void limpiarJornadaSiVacia(Jornada jornada) {
        if (!partidoRepository.existsByJornadaId(jornada.getId())) jornadaRepository.delete(jornada);
    }

    private void actualizarFechasJornada(Jornada jornada) {
        List<Partido> partidos = partidoRepository.findByJornadaTorneoIdAndEstadoNot(jornada.getTorneo().getId(), EstadoPartido.CANCELADO)
                .stream().filter(p -> p.getJornada().getId().equals(jornada.getId())).toList();
        if (partidos.isEmpty()) return;
        jornada.setFechaInicio(partidos.stream().map(Partido::getFecha).min(LocalDate::compareTo).orElse(null));
        jornada.setFechaFin(partidos.stream().map(Partido::getFecha).max(LocalDate::compareTo).orElse(null));
    }

    private LocalDate minFecha(LocalDate actual, LocalDate nueva) {
        return actual == null || nueva.isBefore(actual) ? nueva : actual;
    }

    private LocalDate maxFecha(LocalDate actual, LocalDate nueva) {
        return actual == null || nueva.isAfter(actual) ? nueva : actual;
    }

    private PartidoResponse convertir(Partido partido, Map<Long, Set<Long>> pagos) {
        Set<Long> pagadores = pagos.getOrDefault(partido.getId(), Set.of());
        int equiposPagados = (int) List.of(partido.getEquipoLocal().getId(), partido.getEquipoVisitante().getId())
                .stream().distinct().filter(pagadores::contains).count();
        return PartidoResponse.builder()
                .id(partido.getId())
                .torneoId(partido.getJornada().getTorneo().getId())
                .torneo(partido.getJornada().getTorneo().getNombre())
                .jornada((int) partido.getJornada().getNumero())
                .fecha(partido.getFecha())
                .horaInicio(partido.getHoraInicio())
                .horaFin(partido.getHoraFin())
                .canchaId(partido.getCancha().getId())
                .cancha(partido.getCancha().getNombre())
                .localId(partido.getEquipoLocal().getId())
                .local(partido.getEquipoLocal().getNombre())
                .visitanteId(partido.getEquipoVisitante().getId())
                .visitante(partido.getEquipoVisitante().getNombre())
                .golesLocal((int) partido.getGolesLocal())
                .golesVisitante((int) partido.getGolesVisitante())
                .estado(partido.getEstado())
                .arbitroId(partido.getArbitro() == null ? null : partido.getArbitro().getId())
                .arbitro(partido.getArbitro() == null ? null : partido.getArbitro().getNombreCompleto())
                .arbitrajeCubierto(equiposPagados == 2)
                .equiposPagados(equiposPagados)
                .build();
    }
}
