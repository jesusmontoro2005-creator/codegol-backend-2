package com.codegol.api.modules.calendario.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class GenerarCalendarioRequest {
    @NotNull(message = "La fecha de inicio es obligatoria.")
    private LocalDate fechaInicio;

    @NotNull(message = "Indica los días entre jornadas.")
    @Min(value = 1, message = "Los días entre jornadas deben ser al menos 1.")
    @Max(value = 30, message = "Los días entre jornadas no pueden exceder 30.")
    private Integer diasEntreJornadas = 7;

    @NotEmpty(message = "Elige al menos un horario.")
    @Size(max = 24, message = "Puedes elegir hasta 24 horarios.")
    private List<@NotNull @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Usa horarios en formato HH:mm.") String> horarios;

    @NotNull(message = "Indica la duración del partido.")
    @Min(value = 1, message = "La duración debe ser mayor que cero.")
    @Max(value = 180, message = "La duración no puede exceder 180 minutos.")
    private Integer duracionMin = 60;

    @NotEmpty(message = "Elige al menos una cancha.")
    @Size(max = 32, message = "Puedes elegir hasta 32 canchas.")
    private List<@NotNull Long> canchaIds;

    private boolean dobleVuelta;

    @Min(value = 1, message = "La primera jornada debe ser mayor que cero.")
    private Integer jornadaInicial = 1;
}
