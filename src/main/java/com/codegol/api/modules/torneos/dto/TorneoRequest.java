package com.codegol.api.modules.torneos.dto;



	import java.time.LocalDate;
	import java.math.BigDecimal;
	import com.codegol.api.modules.torneos.model.EstadoTorneo;
	import jakarta.validation.constraints.NotBlank;
	import jakarta.validation.constraints.NotNull;
	import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
	import lombok.AllArgsConstructor;
	import lombok.Builder;
	import lombok.Data;
	import lombok.NoArgsConstructor;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public class TorneoRequest {

	    @NotBlank(message = "El nombre del torneo es obligatorio")
	    @Size(max = 100, message = "El nombre no debe exceder 100 caracteres")
	    private String nombre;

	    @Size(max = 500)
	    private String descripcion;

	    @NotNull(message = "La fecha de inicio es obligatoria")
	    private LocalDate fechaInicio;

	    private LocalDate fechaFin;

	    private EstadoTorneo estado;

	    @NotNull(message = "Debes indicar el ID de la categoría")
	    private Long categoriaId;

        @DecimalMin("0.00")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal cuotaInscripcion;

        @DecimalMin("0.00")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal cuotaArbitraje;

        @Min(1)
        @Max(10)
        private Integer limiteAmarillas;
	}

