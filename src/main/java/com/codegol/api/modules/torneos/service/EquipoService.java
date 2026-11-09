package com.codegol.api.modules.torneos.service;

import com.codegol.api.modules.torneos.dto.EquipoRequest;
import com.codegol.api.modules.torneos.dto.EquipoResponse;
import com.codegol.api.modules.torneos.model.Equipo;
import com.codegol.api.modules.torneos.model.EstadoInscripcion;
import com.codegol.api.modules.torneos.model.Inscripcion;
import com.codegol.api.modules.torneos.model.Torneo;
import com.codegol.api.modules.torneos.repository.EquipoRepository;
import com.codegol.api.modules.torneos.repository.InscripcionRepository;
import com.codegol.api.modules.torneos.repository.TorneoRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository equipoRepository;
    private final TorneoRepository torneoRepository;
    private final InscripcionRepository inscripcionRepository;
    private final JdbcTemplate jdbc;

    @Transactional
    public EquipoResponse registrarEquipo(EquipoRequest request) {
        String nombre = request.getNombre().trim().replaceAll("\\s+", " ");
        String delegado = request.getDelegado() == null ? "" : request.getDelegado().trim().replaceAll("\\s+", " ");
        String telefono = request.getTelefono() == null ? "" : request.getTelefono().trim();
        if (delegado.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del delegado es obligatorio.");
        if (telefono.replaceAll("\\D", "").length() != 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El teléfono del delegado debe tener exactamente 10 dígitos.");
        Torneo torneo = torneoRepository.findById(request.getTorneoId())
                .orElseThrow(() -> new IllegalArgumentException("Torneo no encontrado con ID: " + request.getTorneoId()));
        if (torneo.isArchivado())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se pueden inscribir equipos en un torneo archivado.");
        if (torneo.getEstado() == com.codegol.api.modules.torneos.model.EstadoTorneo.FINALIZADO
                || torneo.getEstado() == com.codegol.api.modules.torneos.model.EstadoTorneo.CANCELADO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se pueden inscribir equipos en un torneo cerrado.");

        if (equipoRepository.existsByNombreIgnoreCaseAndTorneoId(nombre, request.getTorneoId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un equipo con ese nombre en este torneo.");
        }

        Equipo equipo = new Equipo();
        equipo.setNombre(nombre);
        equipo.setLogoUrl(request.getLogoUrl());
        equipo.setDelegado(delegado);
        equipo.setNombreRepresentante(delegado);
        equipo.setTelefono(telefono);
        equipo.setTelefonoContacto(telefono);
        // El alta del equipo no equivale a un cobro; solo Finanzas marca la inscripción pagada.
        equipo.setPagoInscripcionCubierto(false);
        equipo.setTorneo(torneo);

        Equipo guardado = equipoRepository.save(equipo);
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setTorneo(torneo);
        inscripcion.setEquipo(guardado);
        inscripcion.setEstado(EstadoInscripcion.PENDIENTE_PAGO);
        inscripcionRepository.save(inscripcion);
        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<EquipoResponse> listarEquiposPorTorneo(Long torneoId) {
        return equipoRepository.findByTorneoId(torneoId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EquipoResponse> listarTodosLosEquipos() {
        return equipoRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EquipoResponse actualizarEquipo(Long id, EquipoRequest request) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado con ID: " + id));
        if (request.getNombre() != null) {
            String nombre = request.getNombre().trim().replaceAll("\\s+", " ");
            if (nombre.length() < 2 || nombre.length() > 100 || !nombre.matches("[\\p{L}\\p{N}][\\p{L}\\p{N} .,&'\\-]*")
                    || !nombre.matches(".*\\p{L}.*"))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del equipo no tiene un formato válido.");
            if (equipoRepository.existsByNombreIgnoreCaseAndTorneoIdAndIdNot(nombre, equipo.getTorneo().getId(), id))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un equipo con ese nombre en este torneo.");
            equipo.setNombre(nombre);
        }
        if (request.getLogoUrl() != null) {
            if (request.getLogoUrl().length() > 255 || !request.getLogoUrl().isBlank()
                    && !request.getLogoUrl().matches("https?://.+"))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El logo debe ser una URL http o https de hasta 255 caracteres.");
            equipo.setLogoUrl(request.getLogoUrl());
        }
        if (request.getDelegado() != null) {
            if (request.getDelegado().length() > 100 || !request.getDelegado().isBlank()
                    && !request.getDelegado().matches("[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]*"))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del delegado no tiene un formato válido.");
            equipo.setDelegado(request.getDelegado());
            equipo.setNombreRepresentante(request.getDelegado());
        }
        if (request.getTelefono() != null) {
            if (request.getTelefono().length() > 20 || !request.getTelefono().isBlank()
                    && (!request.getTelefono().matches("[0-9() +\\-]+") || request.getTelefono().replaceAll("\\D", "").length() != 10))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El teléfono debe contener exactamente 10 dígitos.");
            equipo.setTelefono(request.getTelefono());
            equipo.setTelefonoContacto(request.getTelefono());
        }
        return mapToResponse(equipoRepository.save(equipo));
    }

    @Transactional
    public void eliminarEquipo(Long id) {
        if (!equipoRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado.");

        Integer referencias = jdbc.queryForObject(
                "SELECT ("
                + "EXISTS(SELECT 1 FROM partidos WHERE equipo_local_id=? OR equipo_visitante_id=?) OR "
                + "EXISTS(SELECT 1 FROM pagos WHERE equipo_id=?) OR "
                + "EXISTS(SELECT 1 FROM tabla_posiciones WHERE equipo_id=?) OR "
                + "EXISTS(SELECT 1 FROM pase_lista pl JOIN jugadores j ON j.id=pl.jugador_id WHERE pl.equipo_id=? OR j.equipo_id=?) OR "
                + "EXISTS(SELECT 1 FROM eventos_partido ev LEFT JOIN jugadores j ON j.id=ev.jugador_id OR j.id=ev.jugador_entra_id WHERE ev.equipo_id=? OR j.equipo_id=?) OR "
                + "EXISTS(SELECT 1 FROM suspensiones s JOIN jugadores j ON j.id=s.jugador_id WHERE j.equipo_id=?)"
                + ")", Integer.class, id, id, id, id, id, id, id, id, id);
        if (referencias != null && referencias != 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede borrar este equipo porque tiene historial de partidos, estadísticas o pagos. El historial debe conservarse.");

        // Se borran solo registros sin historial: las huellas se eliminan por la FK de jugador.
        jdbc.update("DELETE FROM jugadores WHERE equipo_id=?", id);
        jdbc.update("DELETE FROM inscripciones WHERE equipo_id=?", id);
        jdbc.update("DELETE FROM equipos WHERE id=?", id);
    }

    private EquipoResponse mapToResponse(Equipo equipo) {
        return EquipoResponse.builder()
                .id(equipo.getId())
                .nombre(equipo.getNombre())
                .logoUrl(equipo.getLogoUrl())
                .delegado(equipo.getDelegado() != null ? equipo.getDelegado() : equipo.getNombreRepresentante())
                .telefono(equipo.getTelefono() != null ? equipo.getTelefono() : equipo.getTelefonoContacto())
                .pagoInscripcionCubierto(equipo.isPagoInscripcionCubierto())
                .torneoId(equipo.getTorneo() != null ? equipo.getTorneo().getId() : null)
                .torneoNombre(equipo.getTorneo() != null ? equipo.getTorneo().getNombre() : null)
                .build();
    }
}
