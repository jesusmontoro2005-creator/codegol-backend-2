package com.codegol.api.modules.jugadores.service;

import com.codegol.api.modules.biometria.dto.RegistrarHuellaRequest;
import com.codegol.api.modules.biometria.service.MotorHuellasService;
import com.codegol.api.modules.jugadores.dto.CrearJugadorConHuellaRequest;
import com.codegol.api.modules.jugadores.dto.JugadorRequest;
import com.codegol.api.modules.jugadores.dto.JugadorResponse;
import com.codegol.api.modules.jugadores.model.Jugador;
import com.codegol.api.modules.jugadores.model.PosicionJugador;
import com.codegol.api.modules.jugadores.repository.JugadorRepository;
import com.codegol.api.modules.jugadores.repository.JugadorResumen;
import com.codegol.api.modules.torneos.repository.EquipoRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JugadorService {
    private final JugadorRepository jugadorRepository;
    private final EquipoRepository equipoRepository;
    private final MotorHuellasService motorHuellasService;

    public JugadorService(JugadorRepository jugadorRepository, EquipoRepository equipoRepository,
            MotorHuellasService motorHuellasService) {
        this.jugadorRepository = jugadorRepository;
        this.equipoRepository = equipoRepository;
        this.motorHuellasService = motorHuellasService;
    }

    @Transactional(readOnly = true)
    public List<JugadorResponse> listar(Long equipoId) {
        return jugadorRepository.listarResumen(equipoId).stream().map(JugadorService::respuesta).toList();
    }

    @Transactional(readOnly = true)
    public JugadorResponse obtener(long id) {
        return jugadorRepository.resumenPorId(id).map(JugadorService::respuesta)
                .orElseThrow(() -> noEncontrado(id));
    }

    @Transactional
    public JugadorResponse crearConHuella(CrearJugadorConHuellaRequest request, String username) {
        JugadorRequest datos = new JugadorRequest(request.equipoId(), request.nombre(), request.apellidos(),
                request.dorsal(), request.curp(), request.posicion(), request.fotoUrl());
        validarEquipoYUnicidad(datos, null);
        Jugador jugador = jugadorRepository.saveAndFlush(nuevoJugador(datos));
        motorHuellasService.registrar(jugador.getId(), new RegistrarHuellaRequest(request.dedo(), request.imagenes()), username);
        return obtener(jugador.getId());
    }

    @Transactional
    public JugadorResponse editar(long id, JugadorRequest request) {
        Jugador jugador = jugadorRepository.findById(id).orElseThrow(() -> noEncontrado(id));
        if (!Boolean.TRUE.equals(jugador.getActivo()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El jugador ya fue retirado de la plantilla activa.");
        validarEquipoYUnicidad(request, id);
        aplicar(jugador, request);
        jugadorRepository.saveAndFlush(jugador);
        return obtener(id);
    }

    @Transactional
    public void eliminar(long id) {
        Jugador jugador = jugadorRepository.findById(id).orElseThrow(() -> noEncontrado(id));
        if (Integer.valueOf(1).equals(jugadorRepository.tieneHistorialDePartido(id))) {
            // Keep the player row referenced by match history, but remove it from active rosters.
            jugador.setActivo(false);
            jugador.setDorsal(null);
            jugador.setCurp(null);
            jugadorRepository.saveAndFlush(jugador);
            motorHuellasService.eliminarPlantilla(id);
        } else {
            jugadorRepository.delete(jugador);
        }
    }

    private void validarEquipoYUnicidad(JugadorRequest request, Long idActual) {
        if (!equipoRepository.existsById(request.equipoId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado.");
        String curp = normalizar(request.curp());
        if (!curp.isEmpty() && (idActual == null
                ? jugadorRepository.existsByCurpIgnoreCase(curp)
                : jugadorRepository.existsByCurpIgnoreCaseAndIdNot(curp, idActual)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esa CURP ya está registrada.");
        Integer dorsal = dorsal(request.dorsal());
        if (dorsal != null && (idActual == null
                ? jugadorRepository.existsByDorsalAndEquipoId(dorsal, request.equipoId())
                : jugadorRepository.existsByDorsalAndEquipoIdAndIdNot(dorsal, request.equipoId(), idActual)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese dorsal ya está asignado dentro del equipo.");
    }

    private static Jugador nuevoJugador(JugadorRequest request) {
        Jugador jugador = new Jugador();
        aplicar(jugador, request);
        return jugador;
    }

    private static void aplicar(Jugador jugador, JugadorRequest request) {
        String[] apellidos = separarApellidos(request.apellidos());
        if (apellidos[0].length() > 80 || apellidos[1].length() > 80)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada apellido debe tener como máximo 80 caracteres.");
        jugador.setEquipoId(request.equipoId());
        jugador.setNombre(request.nombre().trim());
        jugador.setApellidoPaterno(apellidos[0]);
        jugador.setApellidoMaterno(apellidos[1].isBlank() ? null : apellidos[1]);
        jugador.setDorsal(dorsal(request.dorsal()));
        String curp = normalizar(request.curp());
        jugador.setCurp(curp.isBlank() ? null : curp);
        jugador.setFotoUrl(normalizar(request.fotoUrl()).isBlank() ? null : request.fotoUrl().trim());
        String posicion = request.posicion() == null || request.posicion().isBlank() ? "DELANTERO" : request.posicion().trim().toUpperCase(Locale.ROOT);
        jugador.setPosicion(PosicionJugador.valueOf(posicion));
    }

    private static JugadorResponse respuesta(JugadorResumen r) {
        return new JugadorResponse(r.getId(), r.getEquipoId(), r.getNombre(), r.getApellidos(),
                r.getDorsal() == null ? "" : r.getDorsal().toString(), r.getCurp(), r.getFotoUrl(),
                r.getEquipo(), r.getPosicion(), Integer.valueOf(1).equals(r.getHuella()));
    }

    private static String[] separarApellidos(String apellidos) {
        String limpio = apellidos.trim().replaceAll("\\s+", " ");
        int corte = limpio.indexOf(' ');
        return corte < 0 ? new String[] { limpio, "" }
                : new String[] { limpio.substring(0, corte), limpio.substring(corte + 1) };
    }

    private static Integer dorsal(String dorsal) {
        if (dorsal == null || dorsal.isBlank()) return null;
        Integer numero = Integer.valueOf(dorsal.trim());
        if (numero < 0 || numero > 99)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El dorsal debe estar entre 0 y 99.");
        return numero;
    }

    private static String normalizar(String value) { return value == null ? "" : value.trim(); }
    private static ResponseStatusException noEncontrado(long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Jugador no encontrado: " + id);
    }
}
