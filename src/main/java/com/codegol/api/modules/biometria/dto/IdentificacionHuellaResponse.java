package com.codegol.api.modules.biometria.dto;

public record IdentificacionHuellaResponse(
        boolean identificado,
        String resultado,
        Long jugadorId,
        String jugador,
        String equipo) {
}
