package com.codegol.api.modules.calendario.repository;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CoberturaArbitrajeRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public CoberturaArbitrajeRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<Long, Set<Long>> equiposConArbitrajePagado(Collection<Long> partidoIds) {
        if (partidoIds.isEmpty()) return Map.of();
        String sql = "select partido_id, equipo_id from pagos "
                + "where concepto = 'ARBITRAJE' and estado = 'CUBIERTO' and partido_id in (:partidoIds)";
        Map<Long, Set<Long>> resultado = new HashMap<>();
        jdbc.query(sql, new MapSqlParameterSource("partidoIds", partidoIds), rs -> {
            resultado.computeIfAbsent(rs.getLong("partido_id"), ignored -> new HashSet<>())
                    .add(rs.getLong("equipo_id"));
        });
        return resultado;
    }

    public Set<Long> partidosConPagosAsociados(Collection<Long> partidoIds) {
        if (partidoIds.isEmpty()) return Set.of();
        String sql = "select distinct partido_id from pagos where partido_id in (:partidoIds)";
        return new HashSet<>(jdbc.query(sql, new MapSqlParameterSource("partidoIds", partidoIds),
                (rs, rowNum) -> rs.getLong("partido_id")));
    }
}
