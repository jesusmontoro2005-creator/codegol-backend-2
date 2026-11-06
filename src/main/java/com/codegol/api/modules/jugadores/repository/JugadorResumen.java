package com.codegol.api.modules.jugadores.repository;

public interface JugadorResumen {
    Long getId();
    Long getEquipoId();
    String getNombre();
    String getApellidos();
    Integer getDorsal();
    String getCurp();
    String getFotoUrl();
    String getEquipo();
    String getPosicion();
    Boolean getHuella();
}
