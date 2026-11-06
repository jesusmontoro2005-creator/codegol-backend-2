package com.codegol.api.modules.jugadores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CrearJugadorConHuellaRequest(
        @NotNull Long equipoId,
        @NotBlank @Size(max = 80) String nombre,
        @NotBlank @Size(max = 161) String apellidos,
        @Pattern(regexp = "|[0-9]{1,2}") String dorsal,
        @Pattern(regexp = "|[A-Za-z0-9]{18}") String curp,
        @Pattern(regexp = "PORTERO|DEFENSA|MEDIO|DELANTERO|Portero|Defensa|Medio|Delantero") String posicion,
        @Size(max = 255) @Pattern(regexp = "|https?://.+") String fotoUrl,
        @NotBlank @Pattern(regexp = "PULGAR_DER|INDICE_DER|MEDIO_DER|PULGAR_IZQ|INDICE_IZQ|MEDIO_IZQ") String dedo,
        @NotEmpty @Size(min = 3, max = 3) List<@NotBlank @Size(max = 700_000) String> imagenes) {
}
