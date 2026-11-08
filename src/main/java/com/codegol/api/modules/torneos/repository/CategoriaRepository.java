package com.codegol.api.modules.torneos.repository;



import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.codegol.api.modules.torneos.model.Categoria;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    Optional<Categoria> findByNombre(String nombre);
    List<Categoria> findByActivaTrue();
    List<Categoria> findAllByOrderByNombreAsc();
    boolean existsByNombre(String nombre);

}
