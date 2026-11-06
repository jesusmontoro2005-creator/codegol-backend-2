package com.codegol.api.modules.auth.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.codegol.api.modules.auth.model.Usuario;
import com.codegol.api.modules.auth.model.Rol;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
	Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<Usuario> findByRolAndActivoTrueOrderByNombreCompletoAsc(Rol rol);
    Optional<Usuario> findByIdAndRol(Long id, Rol rol);

}
