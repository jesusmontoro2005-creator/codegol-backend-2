package com.codegol.api.modules.calendario.repository;

import com.codegol.api.modules.calendario.model.Cancha;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CanchaRepository extends JpaRepository<Cancha, Long> {
    List<Cancha> findByActivaTrueOrderByIdAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cancha c where c.id in :ids order by c.id")
    List<Cancha> bloquearPorIds(@Param("ids") Collection<Long> ids);
}
