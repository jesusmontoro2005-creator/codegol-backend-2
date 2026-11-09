package com.codegol.api.modules.torneos.repository;




import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import com.codegol.api.modules.torneos.model.EstadoTorneo;
import com.codegol.api.modules.torneos.model.Torneo;

@Repository
public interface TorneoRepository extends JpaRepository<Torneo, Long> {
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);
    List<Torneo> findByEstado(EstadoTorneo estado);
    List<Torneo> findByCategoriaId(Long categoriaId);
    List<Torneo> findAllByArchivadoFalseOrderByFechaInicioDesc();
    List<Torneo> findAllByOrderByFechaInicioDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Torneo t where t.id = :id")
    java.util.Optional<Torneo> bloquearPorId(@Param("id") Long id);
}
