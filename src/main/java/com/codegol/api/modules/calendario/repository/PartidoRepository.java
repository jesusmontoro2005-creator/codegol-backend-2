package com.codegol.api.modules.calendario.repository;

import com.codegol.api.modules.calendario.model.EstadoPartido;
import com.codegol.api.modules.calendario.model.Partido;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PartidoRepository extends JpaRepository<Partido, Long> {
    @Query("select p from Partido p join fetch p.jornada j join fetch j.torneo join fetch p.cancha "
            + "join fetch p.equipoLocal join fetch p.equipoVisitante left join fetch p.arbitro "
            + "where (:torneoId is null or j.torneo.id = :torneoId) "
            + "order by p.fecha, p.horaInicio, p.cancha.id")
    List<Partido> listarCalendario(@Param("torneoId") Long torneoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Partido p join fetch p.jornada j join fetch j.torneo join fetch p.cancha "
            + "join fetch p.equipoLocal join fetch p.equipoVisitante left join fetch p.arbitro where p.id = :id")
    Optional<Partido> buscarParaActualizar(@Param("id") Long id);

    List<Partido> findByFechaAndEstadoNot(LocalDate fecha, EstadoPartido estado);
    List<Partido> findByJornadaTorneoId(Long torneoId);
    List<Partido> findByJornadaTorneoIdAndEstadoNot(Long torneoId, EstadoPartido estado);
    boolean existsByJornadaId(Long jornadaId);
}
