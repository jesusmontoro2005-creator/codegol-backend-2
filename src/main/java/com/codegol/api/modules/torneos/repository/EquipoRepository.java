package com.codegol.api.modules.torneos.repository;
import com.codegol.api.modules.torneos.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long>{
	List<Equipo> findByTorneoId(Long torneoId);
    boolean existsByNombreAndTorneoId(String nombre, Long torneoId);

}
