package com.codegol.api.modules.calendario.controller;

import com.codegol.api.modules.calendario.dto.ActualizarPartidoRequest;
import com.codegol.api.modules.calendario.dto.CalendarioGeneradoResponse;
import com.codegol.api.modules.calendario.dto.CanchaResponse;
import com.codegol.api.modules.calendario.dto.CrearPartidoRequest;
import com.codegol.api.modules.calendario.dto.GenerarCalendarioRequest;
import com.codegol.api.modules.calendario.dto.PartidoResponse;
import com.codegol.api.modules.calendario.service.CalendarioService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CalendarioController {
    private final CalendarioService calendarioService;

    @GetMapping("/canchas")
    public List<CanchaResponse> listarCanchas() {
        return calendarioService.listarCanchas();
    }

    @GetMapping("/partidos")
    public List<PartidoResponse> listarPartidos(@RequestParam(required = false) Long torneoId) {
        return calendarioService.listarPartidos(torneoId);
    }

    @PostMapping("/partidos")
    public ResponseEntity<PartidoResponse> crearPartido(@Valid @RequestBody CrearPartidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarioService.crearPartido(request));
    }

    @PutMapping("/partidos/{id}")
    public PartidoResponse actualizarPartido(@PathVariable Long id, @RequestBody ActualizarPartidoRequest request) {
        return calendarioService.actualizarPartido(id, request);
    }

    @DeleteMapping("/partidos/{id}")
    public ResponseEntity<Void> eliminarPartido(@PathVariable Long id) {
        calendarioService.eliminarPartido(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/torneos/{torneoId}/calendario")
    public CalendarioGeneradoResponse generarCalendario(@PathVariable Long torneoId,
            @Valid @RequestBody GenerarCalendarioRequest request) {
        return calendarioService.generarCalendario(torneoId, request);
    }

    @DeleteMapping("/torneos/{torneoId}/calendario")
    public ResponseEntity<Void> borrarCalendario(@PathVariable Long torneoId) {
        calendarioService.borrarCalendario(torneoId);
        return ResponseEntity.noContent().build();
    }
}
