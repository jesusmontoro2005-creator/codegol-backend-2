package com.codegol.api.modules.calendario.dto;

import com.codegol.api.modules.calendario.model.EstadoPartido;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Builder;

@Builder
public record PartidoResponse(
        Long id,
        Long torneoId,
        String torneo,
        Integer jornada,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        Long canchaId,
        String cancha,
        Long localId,
        String local,
        Long visitanteId,
        String visitante,
        Integer golesLocal,
        Integer golesVisitante,
        EstadoPartido estado,
        Long arbitroId,
        String arbitro,
        boolean arbitrajeCubierto,
        int equiposPagados) { }
