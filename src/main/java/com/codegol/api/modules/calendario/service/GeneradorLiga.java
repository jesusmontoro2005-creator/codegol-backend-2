package com.codegol.api.modules.calendario.service;

import java.util.ArrayList;
import java.util.List;

/** Algoritmo puro de círculo para construir una o dos vueltas todos-contra-todos. */
public final class GeneradorLiga {
    private GeneradorLiga() { }

    public static List<Encuentro> generar(List<Long> equipos, boolean dobleVuelta, int jornadaInicial) {
        List<Long> rueda = new ArrayList<>(equipos);
        if (rueda.size() % 2 != 0) rueda.add(null);
        int cantidadPorVuelta = rueda.size() - 1;
        List<List<Encuentro>> primeraVuelta = new ArrayList<>();

        for (int ronda = 0; ronda < cantidadPorVuelta; ronda++) {
            List<Encuentro> encuentros = new ArrayList<>();
            for (int pareja = 0; pareja < rueda.size() / 2; pareja++) {
                Long local = rueda.get(pareja);
                Long visitante = rueda.get(rueda.size() - 1 - pareja);
                if (local != null && visitante != null) {
                    if (ronda % 2 != 0) {
                        Long temporal = local;
                        local = visitante;
                        visitante = temporal;
                    }
                    encuentros.add(new Encuentro(jornadaInicial + ronda, local, visitante));
                }
            }
            primeraVuelta.add(encuentros);
            rueda.add(1, rueda.remove(rueda.size() - 1));
        }

        List<Encuentro> resultado = new ArrayList<>();
        primeraVuelta.forEach(resultado::addAll);
        if (dobleVuelta) {
            for (int ronda = 0; ronda < primeraVuelta.size(); ronda++) {
                for (Encuentro ida : primeraVuelta.get(ronda)) {
                    resultado.add(new Encuentro(jornadaInicial + cantidadPorVuelta + ronda, ida.visitanteId(), ida.localId()));
                }
            }
        }
        return resultado;
    }

    public record Encuentro(int jornada, Long localId, Long visitanteId) { }
}
