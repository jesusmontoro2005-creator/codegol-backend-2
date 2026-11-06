package com.codegol.api.modules.calendario.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActualizarPartidoRequest {
    private LocalDate fecha;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaInicio;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaFin;

    private Long canchaId;
    private Long arbitroId;

    @JsonIgnore
    private boolean arbitroIdPresente;

    @JsonSetter("arbitroId")
    public void setArbitroId(Long arbitroId) {
        this.arbitroId = arbitroId;
        this.arbitroIdPresente = true;
    }
}
