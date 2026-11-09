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
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.AssertTrue;
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
	    @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
	    private String nombre;

	    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
	    private String descripcion;

	    @NotNull(message = "La fecha de inicio es obligatoria")
	    private LocalDate fechaInicio;

	    private LocalDate fechaFin;

	    private EstadoTorneo estado;

	    @NotNull(message = "Debes indicar el ID de la categoría")
	    private Long categoriaId;

        @DecimalMin(value = "0.00", message = "La cuota no puede ser negativa")
        @DecimalMax(value = "100000.00", message = "La cuota no puede exceder 100,000")
        @Digits(integer = 6, fraction = 2, message = "La cuota admite hasta dos decimales y un máximo de 100,000")
        private BigDecimal cuotaInscripcion;

        @DecimalMin(value = "0.00", message = "La cuota no puede ser negativa")
        @DecimalMax(value = "100000.00", message = "La cuota no puede exceder 100,000")
        @Digits(integer = 6, fraction = 2, message = "La cuota admite hasta dos decimales y un máximo de 100,000")
        private BigDecimal cuotaArbitraje;

        @Min(value = 1, message = "Las amarillas para suspensión deben ser al menos 1")
        @Max(value = 10, message = "Las amarillas para suspensión no pueden exceder 10")
        private Integer limiteAmarillas;

        @AssertTrue(message = "La fecha de cierre no puede ser anterior a la fecha de inicio")
        public boolean isRangoFechasValido() {
            return fechaInicio == null || fechaFin == null || !fechaFin.isBefore(fechaInicio);
        }
	}

