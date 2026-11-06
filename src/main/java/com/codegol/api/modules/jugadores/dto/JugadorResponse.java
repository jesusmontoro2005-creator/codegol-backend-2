package com.codegol.api.modules.jugadores.dto;

public record JugadorResponse(
        Long id,
        Long equipoId,
        String nombre,
        String apellidos,
        String dorsal,
        String curp,
        String fotoUrl,
        String equipo,
        String posicion,
        boolean huella) {
}
