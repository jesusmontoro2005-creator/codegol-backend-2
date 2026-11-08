package com.codegol.api.modules.torneos.controller;





import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codegol.api.modules.torneos.dto.CategoriaDTO;
import com.codegol.api.modules.torneos.dto.EstadoActivoRequest;
import com.codegol.api.modules.torneos.dto.EstadoArchivoRequest;
import com.codegol.api.modules.torneos.dto.TorneoRequest;
import com.codegol.api.modules.torneos.dto.TorneoResponse;
import com.codegol.api.modules.torneos.service.TorneoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/torneos")
@RequiredArgsConstructor
public class TorneoController {

    private final TorneoService torneoService;

    // --- Endpoints para Categorías ---

    @PostMapping("/categorias")
    public ResponseEntity<CategoriaDTO> crearCategoria(@Valid @RequestBody CategoriaDTO dto) {
        CategoriaDTO creada = torneoService.crearCategoria(dto);
        return new ResponseEntity<>(creada, HttpStatus.CREATED);
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaDTO>> listarCategorias(
            @RequestParam(defaultValue = "false") boolean incluirInactivas) {
        return ResponseEntity.ok(incluirInactivas ? torneoService.obtenerTodasLasCategorias()
                : torneoService.obtenerCategoriasActivas());
    }

    @PutMapping("/categorias/{id}/estado")
    public ResponseEntity<CategoriaDTO> cambiarEstadoCategoria(@PathVariable Long id,
            @RequestBody EstadoActivoRequest request) {
        return ResponseEntity.ok(torneoService.cambiarEstadoCategoria(id, request.activa()));
    }

    // --- Endpoints para Torneos ---

    @PostMapping
    public ResponseEntity<TorneoResponse> crearTorneo(@Valid @RequestBody TorneoRequest request) {
        TorneoResponse creado = torneoService.crearTorneo(request);
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TorneoResponse>> listarTorneos(
            @RequestParam(defaultValue = "false") boolean incluirArchivados) {
        return ResponseEntity.ok(incluirArchivados ? torneoService.obtenerTodosLosTorneosIncluyendoArchivados()
                : torneoService.obtenerTodosLosTorneos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TorneoResponse> obtenerTorneoPorId(@PathVariable Long id) {
        return ResponseEntity.ok(torneoService.obtenerTorneoPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TorneoResponse> actualizarTorneo(@PathVariable Long id, @RequestBody TorneoRequest request) {
        return ResponseEntity.ok(torneoService.actualizarTorneo(id, request));
    }

    @PutMapping("/{id}/archivo")
    public ResponseEntity<TorneoResponse> cambiarArchivo(@PathVariable Long id,
            @RequestBody EstadoArchivoRequest request) {
        return ResponseEntity.ok(torneoService.cambiarEstadoArchivo(id, request.archivado()));
    }
}

