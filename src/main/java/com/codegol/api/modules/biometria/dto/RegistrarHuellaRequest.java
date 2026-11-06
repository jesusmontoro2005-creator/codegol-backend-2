package com.codegol.api.modules.biometria.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RegistrarHuellaRequest(
        @NotBlank
        @Pattern(regexp = "PULGAR_DER|INDICE_DER|MEDIO_DER|PULGAR_IZQ|INDICE_IZQ|MEDIO_IZQ")
        String dedo,
        @NotEmpty @Size(min = 3, max = 3)
        List<@NotBlank @Size(max = 700_000) String> imagenes) {
}
