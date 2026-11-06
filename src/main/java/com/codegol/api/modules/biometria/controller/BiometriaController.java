package com.codegol.api.modules.biometria.controller;

import com.codegol.api.modules.biometria.dto.IdentificarHuellaRequest;
import com.codegol.api.modules.biometria.dto.IdentificacionHuellaResponse;
import com.codegol.api.modules.biometria.dto.RegistrarHuellaRequest;
import com.codegol.api.modules.biometria.service.MotorHuellasService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BiometriaController {
    private final MotorHuellasService motor;

    public BiometriaController(MotorHuellasService motor) { this.motor = motor; }

    @PostMapping("/jugadores/{jugadorId}/huella")
    public Map<String, Object> registrar(@PathVariable long jugadorId,
            @Valid @RequestBody RegistrarHuellaRequest request, Authentication authentication) {
        return motor.registrar(jugadorId, request, authentication.getName());
    }

    @PostMapping("/biometria/identificar")
    public IdentificacionHuellaResponse identificar(@Valid @RequestBody IdentificarHuellaRequest request) {
        return motor.identificar(request.imagen());
    }
}
