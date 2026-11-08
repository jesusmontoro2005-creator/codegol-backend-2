package com.codegol.api.modules.torneos.service;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.codegol.api.modules.torneos.dto.CategoriaDTO;
import com.codegol.api.modules.torneos.dto.TorneoRequest;
import com.codegol.api.modules.torneos.dto.TorneoResponse;
import com.codegol.api.modules.torneos.model.Categoria;
import com.codegol.api.modules.torneos.model.EstadoTorneo;
import com.codegol.api.modules.torneos.model.Torneo;
import com.codegol.api.modules.torneos.repository.CategoriaRepository;
import com.codegol.api.modules.torneos.repository.TorneoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TorneoService {

    private final TorneoRepository torneoRepository;
    private final CategoriaRepository categoriaRepository;

    // --- MÉTODOS DE CATEGORÍAS ---

    @Transactional
    public CategoriaDTO crearCategoria(CategoriaDTO dto) {
        if (categoriaRepository.existsByNombre(dto.getNombre())) {
            throw new IllegalArgumentException("Ya existe una categoría con el nombre: " + dto.getNombre());
        }

        Categoria categoria = new Categoria();
        categoria.setNombre(dto.getNombre());
        categoria.setDescripcion(dto.getDescripcion());
        categoria.setActiva(true);

        Categoria guardada = categoriaRepository.save(categoria);
        return mapToCategoriaDTO(guardada);
    }

    public List<CategoriaDTO> obtenerCategoriasActivas() {
        return categoriaRepository.findByActivaTrue().stream()
                .map(this::mapToCategoriaDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoriaDTO> obtenerTodasLasCategorias() {
        return categoriaRepository.findAllByOrderByNombreAsc().stream().map(this::mapToCategoriaDTO).toList();
    }

    @Transactional
    public CategoriaDTO cambiarEstadoCategoria(Long id, boolean activa) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada."));
        categoria.setActiva(activa);
        return mapToCategoriaDTO(categoriaRepository.save(categoria));
    }

    // --- MÉTODOS DE TORNEOS ---

    @Transactional
    public TorneoResponse crearTorneo(TorneoRequest request) {
        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + request.getCategoriaId()));
        if (!categoria.isActiva())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se pueden crear torneos con una categoría desactivada.");

        Torneo torneo = new Torneo();
        torneo.setNombre(request.getNombre());
        torneo.setDescripcion(request.getDescripcion());
        torneo.setFechaInicio(request.getFechaInicio());
        torneo.setFechaFin(request.getFechaFin());
        torneo.setEstado(request.getEstado() != null ? request.getEstado() : EstadoTorneo.EN_INSCRIPCION);
        torneo.setCategoria(categoria);
        torneo.setCuotaInscripcion(request.getCuotaInscripcion() != null ? request.getCuotaInscripcion() : java.math.BigDecimal.ZERO);
        torneo.setCuotaArbitraje(request.getCuotaArbitraje() != null ? request.getCuotaArbitraje() : java.math.BigDecimal.ZERO);
        torneo.setLimiteAmarillas((byte) (request.getLimiteAmarillas() != null ? request.getLimiteAmarillas() : 3));

        Torneo guardado = torneoRepository.save(torneo);
        return mapToTorneoResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<TorneoResponse> obtenerTodosLosTorneos() {
        return torneoRepository.findAllByArchivadoFalseOrderByFechaInicioDesc().stream()
                .map(this::mapToTorneoResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TorneoResponse> obtenerTodosLosTorneosIncluyendoArchivados() {
        return torneoRepository.findAllByOrderByFechaInicioDesc().stream()
                .map(this::mapToTorneoResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TorneoResponse cambiarEstadoArchivo(Long id, boolean archivado) {
        Torneo torneo = torneoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Torneo no encontrado."));
        if (archivado && torneo.getEstado() == EstadoTorneo.EN_PROGRESO)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Finaliza o cancela el torneo antes de archivarlo.");
        torneo.setArchivado(archivado);
        return mapToTorneoResponse(torneoRepository.save(torneo));
    }

    @Transactional(readOnly = true)
    public TorneoResponse obtenerTorneoPorId(Long id) {
        Torneo torneo = torneoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Torneo no encontrado con ID: " + id));
        return mapToTorneoResponse(torneo);
    }

    @Transactional
    public TorneoResponse actualizarTorneo(Long id, TorneoRequest request) {
        Torneo torneo = torneoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Torneo no encontrado con ID: " + id));
        if (request.getNombre() != null) torneo.setNombre(request.getNombre());
        if (request.getDescripcion() != null) torneo.setDescripcion(request.getDescripcion());
        if (request.getFechaInicio() != null) torneo.setFechaInicio(request.getFechaInicio());
        if (request.getFechaFin() != null) torneo.setFechaFin(request.getFechaFin());
        if (request.getEstado() != null) torneo.setEstado(request.getEstado());
        if (request.getCategoriaId() != null) {
            torneo.setCategoria(categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + request.getCategoriaId())));
        }
        if (request.getCuotaInscripcion() != null) torneo.setCuotaInscripcion(request.getCuotaInscripcion());
        if (request.getCuotaArbitraje() != null) torneo.setCuotaArbitraje(request.getCuotaArbitraje());
        if (request.getLimiteAmarillas() != null) torneo.setLimiteAmarillas(request.getLimiteAmarillas().byteValue());
        return mapToTorneoResponse(torneoRepository.save(torneo));
    }

    // Mapeadores auxiliares
    private CategoriaDTO mapToCategoriaDTO(Categoria cat) {
        return CategoriaDTO.builder()
                .id(cat.getId())
                .nombre(cat.getNombre())
                .descripcion(cat.getDescripcion())
                .activa(cat.isActiva())
                .build();
    }

    private TorneoResponse mapToTorneoResponse(Torneo t) {
        return TorneoResponse.builder()
                .id(t.getId())
                .nombre(t.getNombre())
                .descripcion(t.getDescripcion())
                .fechaInicio(t.getFechaInicio())
                .fechaFin(t.getFechaFin())
                .estado(t.getEstado())
                .archivado(t.isArchivado())
                .cuotaInscripcion(t.getCuotaInscripcion())
                .cuotaArbitraje(t.getCuotaArbitraje())
                .limiteAmarillas((int) t.getLimiteAmarillas())
                .categoria(mapToCategoriaDTO(t.getCategoria()))
                .build();
    }
}

