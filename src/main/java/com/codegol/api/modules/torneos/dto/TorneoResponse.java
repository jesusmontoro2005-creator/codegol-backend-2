package com.codegol.api.modules.torneos.dto;




import java.time.LocalDate;
import com.codegol.api.modules.torneos.model.EstadoTorneo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TorneoResponse {

    private Long id;
    private String nombre;
    private String descripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private EstadoTorneo estado;
    private CategoriaDTO categoria;
}

