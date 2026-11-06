package com.codegol.api.modules.calendario.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Data;

@Data
public class CrearPartidoRequest {
    @NotNull(message = "El torneo es obligatorio.")
    @Positive(message = "El torneo no es válido.")
    private Long torneoId;

    @NotNull(message = "La jornada es obligatoria.")
    @Positive(message = "La jornada debe ser mayor que cero.")
    private Integer jornada;

    @NotNull(message = "La fecha del partido es obligatoria.")
    private LocalDate fecha;

    @NotNull(message = "La hora de inicio es obligatoria.")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaInicio;

    @NotNull(message = "La hora de fin es obligatoria.")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaFin;

    @NotNull(message = "La cancha es obligatoria.")
    @Positive(message = "La cancha no es válida.")
    private Long canchaId;

    @NotNull(message = "El equipo local es obligatorio.")
    @Positive(message = "El equipo local no es válido.")
    private Long localId;

    @NotNull(message = "El equipo visitante es obligatorio.")
    @Positive(message = "El equipo visitante no es válido.")
    private Long visitanteId;
}
