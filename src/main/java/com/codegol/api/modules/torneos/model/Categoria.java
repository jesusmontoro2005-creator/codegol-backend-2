package com.codegol.api.modules.torneos.model;

import com.codegol.api.common.model.BaseEntity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categorias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Categoria extends BaseEntity {
	
	@Column(nullable = false, unique = true, length = 50)
    private String nombre; // Ej. Libres, Varonil, Femenil, Infantil

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false)
    private boolean activa = true;

}
