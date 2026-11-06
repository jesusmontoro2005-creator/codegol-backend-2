package com.codegol.api.modules.calendario.repository;

import com.codegol.api.modules.calendario.model.Jornada;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JornadaRepository extends JpaRepository<Jornada, Long> {
    Optional<Jornada> findByTorneoIdAndNumero(Long torneoId, short numero);
    List<Jornada> findByTorneoIdOrderByNumeroAsc(Long torneoId);
}
