package com.codegol.api.modules.calendario.dto;

import java.util.List;

public record CalendarioGeneradoResponse(int creados, List<PartidoNoAsignado> sinLugar) {
    public record PartidoNoAsignado(Integer jornada, Long localId, Long visitanteId) { }
}
