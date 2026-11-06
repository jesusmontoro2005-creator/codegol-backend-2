package com.codegol.api.modules.jugadores.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "jugadores")
@Getter
@Setter
@NoArgsConstructor
public class Jugador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "equipo_id", nullable = false)
    private Long equipoId;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(name = "apellido_paterno", nullable = false, length = 80)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 80)
    private String apellidoMaterno;

    @Column(columnDefinition = "CHAR(18)", unique = true)
    private String curp;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "numero_camiseta", columnDefinition = "TINYINT UNSIGNED")
    private Integer dorsal;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private PosicionJugador posicion;

    @Column(name = "foto_url", length = 255)
    private String fotoUrl;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private LocalDateTime creadoEn;
}
