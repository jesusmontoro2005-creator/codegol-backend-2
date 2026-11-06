package com.codegol.api.modules.biometria.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IdentificarHuellaRequest(@NotBlank @Size(max = 700_000) String imagen) {
}
