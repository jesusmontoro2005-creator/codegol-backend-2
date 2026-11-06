package com.codegol.api.modules.torneos.model;

	import com.codegol.api.common.model.BaseEntity;
	import jakarta.persistence.Column;
	import jakarta.persistence.Entity;
	import jakarta.persistence.Table;
	import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
	import lombok.NoArgsConstructor;
	import lombok.Setter;

	@Entity
	@Table(name = "equipos")
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public class Equipo extends BaseEntity {

		@Column(nullable = false, length = 100)
	    private String nombre;

	    @Column(name = "logo_url", length = 255)
	    private String logoUrl;

	    @Column(name = "delegado", length = 100)
	    private String delegado;

	    @Column(name = "nombre_representante", length = 100)
	    private String nombreRepresentante;

	    @Column(name = "telefono", length = 20)
	    private String telefono;

	    @Column(name = "telefono_contacto", length = 20)
	    private String telefonoContacto;

	    @Column(name = "pago_inscripcion_cubierto", nullable = false)
	    @Builder.Default
	    private boolean pagoInscripcionCubierto = false;

	    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
	    @jakarta.persistence.JoinColumn(name = "torneo_id", nullable = false)
	    private Torneo torneo;
	}

