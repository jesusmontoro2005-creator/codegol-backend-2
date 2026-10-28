package com.codegol.api.modules.torneos.dto;



	import jakarta.validation.constraints.NotBlank;
	import jakarta.validation.constraints.NotNull;
	import jakarta.validation.constraints.Size;
	import lombok.AllArgsConstructor;
	import lombok.Builder;
	import lombok.Data;
	import lombok.NoArgsConstructor;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public class EquipoRequest {

	    @NotBlank(message = "El nombre del equipo es obligatorio")
	    @Size(max = 100, message = "El nombre no debe exceder 100 caracteres")
	    private String nombre;

	    private String logoUrl;

	    @Size(max = 100, message = "El nombre del delegado no debe exceder 100 caracteres")
	    private String delegado;

	    @Size(max = 20, message = "El teléfono no debe exceder 20 caracteres")
	    private String telefono;

	    private boolean pagoInscripcionCubierto;

	    @NotNull(message = "Debes indicar el ID del torneo")
	    private Long torneoId;
	}

