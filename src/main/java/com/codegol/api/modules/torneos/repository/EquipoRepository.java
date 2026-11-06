package com.codegol.api.modules.torneos.repository;
import com.codegol.api.modules.torneos.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long>{
	List<Equipo> findByTorneoId(Long torneoId);
    boolean existsByNombreAndTorneoId(String nombre, Long torneoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Equipo e where e.id in :ids order by e.id")
    List<Equipo> bloquearPorIds(@Param("ids") Collection<Long> ids);

}
