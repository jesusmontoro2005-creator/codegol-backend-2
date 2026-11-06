package com.codegol.api.modules.jugadores.controller;

import com.codegol.api.modules.jugadores.dto.CrearJugadorConHuellaRequest;
import com.codegol.api.modules.jugadores.dto.JugadorRequest;
import com.codegol.api.modules.jugadores.dto.JugadorResponse;
import com.codegol.api.modules.jugadores.service.JugadorService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/api/jugadores")
public class JugadorController {
    private final JugadorService jugadorService;

    public JugadorController(JugadorService jugadorService) { this.jugadorService = jugadorService; }

    @GetMapping
    public List<JugadorResponse> listar(@RequestParam(required = false) Long equipoId) {
        return jugadorService.listar(equipoId);
    }

    @PostMapping("/con-huella")
    public JugadorResponse crearConHuella(@Valid @RequestBody CrearJugadorConHuellaRequest request,
            Authentication authentication) {
        return jugadorService.crearConHuella(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public JugadorResponse editar(@PathVariable long id, @Valid @RequestBody JugadorRequest request) {
        return jugadorService.editar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable long id) { jugadorService.eliminar(id); }
}
