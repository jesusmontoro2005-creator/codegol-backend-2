package com.codegol.api.modules.jugadores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JugadorRequest(
        @NotNull(message = "El equipo del jugador es obligatorio") Long equipoId,
        @NotBlank(message = "El nombre del jugador es obligatorio") @Size(min = 2, max = 80, message = "El nombre debe tener entre 2 y 80 caracteres") @Pattern(regexp = "[\\p{L}][\\p{L}' .-]*", message = "El nombre solo puede llevar letras y espacios") String nombre,
        @NotBlank(message = "Los apellidos del jugador son obligatorios") @Size(min = 2, max = 161, message = "Los apellidos deben tener entre 2 y 161 caracteres") @Pattern(regexp = "[\\p{L}][\\p{L}' .-]*", message = "Los apellidos solo pueden llevar letras y espacios") String apellidos,
        @Pattern(regexp = "|[0-9]{1,2}", message = "El dorsal debe tener uno o dos dígitos") String dorsal,
        @Pattern(regexp = "|(?i)[A-Z]{4}[0-9]{6}[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9][0-9]", message = "La CURP no tiene un formato válido") String curp,
        @Pattern(regexp = "PORTERO|DEFENSA|MEDIO|DELANTERO|Portero|Defensa|Medio|Delantero") String posicion,
        @Size(max = 255) @Pattern(regexp = "|https?://.+") String fotoUrl) {
}
