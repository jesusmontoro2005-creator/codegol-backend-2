package com.codegol.api.modules.jugadores.repository;

import com.codegol.api.modules.jugadores.model.Jugador;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JugadorRepository extends JpaRepository<Jugador, Long> {
    @Query(value = "SELECT j.id AS id,j.equipo_id AS equipoId,j.nombre,TRIM(CONCAT(COALESCE(j.apellido_paterno,''),' ',COALESCE(j.apellido_materno,''))) AS apellidos,"
            + "j.numero_camiseta AS dorsal,j.curp,j.foto_url AS fotoUrl,e.nombre AS equipo,"
            + "CASE j.posicion WHEN 'PORTERO' THEN 'Portero' WHEN 'DEFENSA' THEN 'Defensa' WHEN 'MEDIO' THEN 'Medio' WHEN 'DELANTERO' THEN 'Delantero' ELSE 'Delantero' END AS posicion,"
            + "EXISTS(SELECT 1 FROM huellas_biometricas h WHERE h.jugador_id=j.id AND h.motor='SOURCEAFIS') AS huella "
            + "FROM jugadores j JOIN equipos e ON e.id=j.equipo_id WHERE j.activo=1 AND (:equipoId IS NULL OR j.equipo_id=:equipoId) ORDER BY j.apellido_paterno,j.nombre", nativeQuery = true)
    List<JugadorResumen> listarResumen(@Param("equipoId") Long equipoId);

    @Query(value = "SELECT j.id AS id,j.equipo_id AS equipoId,j.nombre,TRIM(CONCAT(COALESCE(j.apellido_paterno,''),' ',COALESCE(j.apellido_materno,''))) AS apellidos,"
            + "j.numero_camiseta AS dorsal,j.curp,j.foto_url AS fotoUrl,e.nombre AS equipo,"
            + "CASE j.posicion WHEN 'PORTERO' THEN 'Portero' WHEN 'DEFENSA' THEN 'Defensa' WHEN 'MEDIO' THEN 'Medio' WHEN 'DELANTERO' THEN 'Delantero' ELSE 'Delantero' END AS posicion,"
            + "EXISTS(SELECT 1 FROM huellas_biometricas h WHERE h.jugador_id=j.id AND h.motor='SOURCEAFIS') AS huella "
            + "FROM jugadores j JOIN equipos e ON e.id=j.equipo_id WHERE j.id=:id AND j.activo=1", nativeQuery = true)
    Optional<JugadorResumen> resumenPorId(@Param("id") Long id);

    boolean existsByCurpIgnoreCase(String curp);
    boolean existsByCurpIgnoreCaseAndIdNot(String curp, Long id);
    boolean existsByDorsalAndEquipoId(Integer dorsal, Long equipoId);
    boolean existsByDorsalAndEquipoIdAndIdNot(Integer dorsal, Long equipoId, Long id);

    @Query(value = "SELECT (EXISTS(SELECT 1 FROM pase_lista WHERE jugador_id=:id) OR EXISTS(SELECT 1 FROM eventos_partido WHERE jugador_id=:id))", nativeQuery = true)
    Integer tieneHistorialDePartido(@Param("id") Long id);
}
