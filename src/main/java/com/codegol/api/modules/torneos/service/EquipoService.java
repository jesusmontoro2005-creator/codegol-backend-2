package com.codegol.api.modules.torneos.service;


import com.codegol.api.modules.torneos.dto.EquipoRequest;
import com.codegol.api.modules.torneos.dto.EquipoResponse;
import com.codegol.api.modules.torneos.model.Equipo;
import com.codegol.api.modules.torneos.model.Torneo;
import com.codegol.api.modules.torneos.repository.EquipoRepository;
import com.codegol.api.modules.torneos.repository.TorneoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipoService {
	private final EquipoRepository equipoRepository;
    private final TorneoRepository torneoRepository;

    @Transactional
    public EquipoResponse registrarEquipo(EquipoRequest request) {
        Torneo torneo = torneoRepository.findById(request.getTorneoId())
                .orElseThrow(() -> new IllegalArgumentException("Torneo no encontrado con ID: " + request.getTorneoId()));
        
        if (equipoRepository.existsByNombreAndTorneoId(request.getNombre(), request.getTorneoId())) {
            throw new IllegalArgumentException("Ya existe un equipo con ese nombre en este torneo");
        }

        Equipo equipo = new Equipo();
        equipo.setNombre(request.getNombre());
        equipo.setLogoUrl(request.getLogoUrl());
        equipo.setNombreRepresentante(request.getDelegado());
        equipo.setTelefonoContacto(request.getTelefono());
        equipo.setPagoInscripcionCubierto(request.isPagoInscripcionCubierto());
        equipo.setTorneo(torneo);

        Equipo guardado = equipoRepository.save(equipo);
        return mapToResponse(guardado);
    }

    public List<EquipoResponse> listarEquiposPorTorneo(Long torneoId) {
        return equipoRepository.findByTorneoId(torneoId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<EquipoResponse> listarTodosLosEquipos() {
        return equipoRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EquipoResponse mapToResponse(Equipo e) {
        return EquipoResponse.builder()
                .id(e.getId())
                .nombre(e.getNombre())
                .logoUrl(e.getLogoUrl())
                .delegado(e.getNombreRepresentante())
                .telefono(e.getTelefonoContacto())
                .pagoInscripcionCubierto(e.isPagoInscripcionCubierto())
                .torneoId(e.getTorneo() != null ? e.getTorneo().getId() : null)
                .torneoNombre(e.getTorneo() != null ? e.getTorneo().getNombre() : null)
                .build();

}
}
