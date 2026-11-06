package com.codegol.api.modules.torneos.repository;

import com.codegol.api.modules.torneos.model.Inscripcion;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    Optional<Inscripcion> findByTorneoIdAndEquipoId(Long torneoId, Long equipoId);
}
