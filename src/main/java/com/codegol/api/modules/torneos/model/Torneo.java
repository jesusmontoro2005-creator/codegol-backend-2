package com.codegol.api.modules.torneos.model;

import com.codegol.api.common.model.BaseEntity;
import java.time.LocalDate;
import java.math.BigDecimal;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "torneos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Torneo extends BaseEntity{
	@Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoTorneo estado = EstadoTorneo.EN_INSCRIPCION;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(name = "cuota_inscripcion", nullable = false, precision = 10, scale = 2)
    private BigDecimal cuotaInscripcion = BigDecimal.ZERO;

    @Column(name = "cuota_arbitraje", nullable = false, precision = 10, scale = 2)
    private BigDecimal cuotaArbitraje = BigDecimal.ZERO;

    @Column(name = "puntos_victoria", nullable = false)
    private byte puntosVictoria = 3;

    @Column(name = "puntos_empate", nullable = false)
    private byte puntosEmpate = 1;

    @Column(name = "limite_amarillas", nullable = false)
    private byte limiteAmarillas = 3;

	

}
