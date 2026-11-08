package com.codegol.api.modules.torneos.controller;


import com.codegol.api.modules.torneos.dto.EquipoRequest;
import com.codegol.api.modules.torneos.dto.EquipoResponse;
import com.codegol.api.modules.torneos.model.Equipo;
import com.codegol.api.modules.torneos.service.EquipoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {
	private final EquipoService equipoService;@PostMapping
    public ResponseEntity<EquipoResponse> registrarEquipo(@Valid @RequestBody EquipoRequest request) {
        EquipoResponse response = equipoService.registrarEquipo(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/torneo/{torneoId}")
    public ResponseEntity<List<EquipoResponse>> listarEquiposPorTorneo(@PathVariable Long torneoId) {
        return ResponseEntity.ok(equipoService.listarEquiposPorTorneo(torneoId));
    }

    @GetMapping
    public ResponseEntity<List<EquipoResponse>> listarTodos() {
        return ResponseEntity.ok(equipoService.listarTodosLosEquipos());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoResponse> actualizar(@PathVariable Long id, @RequestBody EquipoRequest request) {
        return ResponseEntity.ok(equipoService.actualizarEquipo(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        equipoService.eliminarEquipo(id);
        return ResponseEntity.noContent().build();
    }

}
