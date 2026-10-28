package com.codegol.api.modules.torneos.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipoResponse {
	
	private Long id;
    private String nombre;
    private String logoUrl;
    private String delegado;
    private String telefono;
    private boolean pagoInscripcionCubierto;
    private Long torneoId;
    private String torneoNombre;
}
