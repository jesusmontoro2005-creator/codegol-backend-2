package com.codegol.api.modules.torneos.dto;



	import jakarta.validation.constraints.NotBlank;
	import jakarta.validation.constraints.NotNull;
	import jakarta.validation.constraints.Size;
	import jakarta.validation.constraints.Pattern;
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
	    @Size(min = 2, max = 100, message = "El nombre del equipo debe tener entre 2 y 100 caracteres")
	    @Pattern(regexp = "(?=.*\\p{L})[\\p{L}\\p{N}][\\p{L}\\p{N} .,&'\\-]*", message = "El nombre del equipo debe incluir letras y solo puede llevar letras, números, espacios y . , & ' -")
	    private String nombre;

	    @Size(max = 255, message = "La URL del logo no puede exceder 255 caracteres")
	    @Pattern(regexp = "|https?://.+", message = "El logo debe ser una URL http o https")
	    private String logoUrl;

	    @NotBlank(message = "El nombre del delegado es obligatorio")
	    @Size(min = 2, max = 100, message = "El nombre del delegado debe tener entre 2 y 100 caracteres")
	    @Pattern(regexp = "|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]*", message = "El nombre del delegado solo puede llevar letras y espacios")
	    private String delegado;

	    @NotBlank(message = "El teléfono del delegado es obligatorio")
	    @Size(max = 20, message = "El teléfono no debe exceder 20 caracteres")
	    @Pattern(regexp = "|[0-9() +\\-]+", message = "El teléfono contiene caracteres no válidos")
	    private String telefono;

	    private boolean pagoInscripcionCubierto;

	    @NotNull(message = "Debes indicar el ID del torneo")
	    private Long torneoId;
	}

