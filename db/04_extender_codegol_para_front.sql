-- Extiende el clon codegol con las tablas que consumen las pantallas React.
-- No borra tablas ni datos. Ejecutar DESPUÉS de 03_migrar_codegol_db_a_codegol.sql.
USE `codegol`;

CREATE TABLE IF NOT EXISTS canchas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  activa TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscripciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  torneo_id BIGINT NOT NULL,
  equipo_id BIGINT NOT NULL,
  estado ENUM('PENDIENTE_PAGO','ACTIVO','BAJA') NOT NULL DEFAULT 'PENDIENTE_PAGO',
  fecha_inscripcion DATE NOT NULL DEFAULT (CURRENT_DATE),
  UNIQUE KEY uq_inscripcion (torneo_id, equipo_id),
  CONSTRAINT fk_codegol_insc_torneo FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_insc_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jugadores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  equipo_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  apellido_paterno VARCHAR(80) NOT NULL DEFAULT '',
  apellido_materno VARCHAR(80) NULL,
  curp CHAR(18) NULL UNIQUE,
  fecha_nacimiento DATE NULL,
  numero_camiseta TINYINT UNSIGNED NULL,
  posicion ENUM('PORTERO','DEFENSA','MEDIO','DELANTERO') NULL,
  foto_url VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_camiseta_equipo (equipo_id, numero_camiseta),
  CONSTRAINT fk_codegol_jugador_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS huellas_biometricas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  jugador_id BIGINT NOT NULL UNIQUE,
  plantilla MEDIUMBLOB NOT NULL,
  motor VARCHAR(40) NOT NULL DEFAULT 'LEGACY',
  dedo ENUM('PULGAR_DER','INDICE_DER','MEDIO_DER','PULGAR_IZQ','INDICE_IZQ','MEDIO_IZQ') NOT NULL DEFAULT 'INDICE_DER',
  registrado_por BIGINT NULL,
  registrado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_codegol_huella_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_huella_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jornadas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  torneo_id BIGINT NOT NULL,
  numero SMALLINT NOT NULL,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  UNIQUE KEY uq_jornada (torneo_id, numero),
  CONSTRAINT fk_codegol_jornada_torneo FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS partidos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  jornada_id BIGINT NOT NULL,
  cancha_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  equipo_local_id BIGINT NOT NULL,
  equipo_visitante_id BIGINT NOT NULL,
  arbitro_id BIGINT NULL,
  goles_local SMALLINT NOT NULL DEFAULT 0,
  goles_visitante SMALLINT NOT NULL DEFAULT 0,
  estado ENUM('PROGRAMADO','EN_CURSO','FINALIZADO','SUSPENDIDO','CANCELADO') NOT NULL DEFAULT 'PROGRAMADO',
  cedula_cerrada_en DATETIME NULL,
  KEY idx_partidos_fecha (fecha, cancha_id),
  CONSTRAINT fk_codegol_partido_jornada FOREIGN KEY (jornada_id) REFERENCES jornadas(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_partido_cancha FOREIGN KEY (cancha_id) REFERENCES canchas(id),
  CONSTRAINT fk_codegol_partido_local FOREIGN KEY (equipo_local_id) REFERENCES equipos(id),
  CONSTRAINT fk_codegol_partido_visitante FOREIGN KEY (equipo_visitante_id) REFERENCES equipos(id),
  CONSTRAINT fk_codegol_partido_arbitro FOREIGN KEY (arbitro_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pase_lista (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  partido_id BIGINT NOT NULL,
  jugador_id BIGINT NOT NULL,
  equipo_id BIGINT NOT NULL,
  resultado ENUM('AUTORIZADO','HUELLA_NO_COINCIDE','SUSPENDIDO') NOT NULL,
  metodo ENUM('HUELLA','MANUAL') NOT NULL DEFAULT 'HUELLA',
  tiempo_ms INT NULL,
  validado_por BIGINT NULL,
  validado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pase (partido_id, jugador_id),
  CONSTRAINT fk_codegol_pase_partido FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_pase_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores(id),
  CONSTRAINT fk_codegol_pase_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  CONSTRAINT fk_codegol_pase_usuario FOREIGN KEY (validado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS eventos_partido (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  partido_id BIGINT NOT NULL,
  equipo_id BIGINT NOT NULL,
  jugador_id BIGINT NOT NULL,
  tipo ENUM('GOL','GOL_PROPIO','AMARILLA','ROJA','FALTA','CAMBIO') NOT NULL,
  jugador_entra_id BIGINT NULL,
  minuto TINYINT UNSIGNED NULL,
  sync_uuid CHAR(36) NULL UNIQUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_eventos_partido (partido_id, tipo),
  KEY idx_eventos_jugador (jugador_id, tipo),
  CONSTRAINT fk_codegol_evento_partido FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_evento_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  CONSTRAINT fk_codegol_evento_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores(id),
  CONSTRAINT fk_codegol_evento_cambio FOREIGN KEY (jugador_entra_id) REFERENCES jugadores(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tabla_posiciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  torneo_id BIGINT NOT NULL,
  equipo_id BIGINT NOT NULL,
  pj SMALLINT NOT NULL DEFAULT 0,
  pg SMALLINT NOT NULL DEFAULT 0,
  pe SMALLINT NOT NULL DEFAULT 0,
  pp SMALLINT NOT NULL DEFAULT 0,
  gf SMALLINT NOT NULL DEFAULT 0,
  gc SMALLINT NOT NULL DEFAULT 0,
  dg SMALLINT AS (gf - gc) STORED,
  pts SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_tabla (torneo_id, equipo_id),
  CONSTRAINT fk_codegol_tabla_torneo FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_tabla_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suspensiones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  jugador_id BIGINT NOT NULL,
  torneo_id BIGINT NOT NULL,
  partido_origen_id BIGINT NULL,
  motivo ENUM('ACUMULACION_AMARILLAS','ROJA_DIRECTA','DISCIPLINARIA') NOT NULL,
  partidos_restantes TINYINT NOT NULL DEFAULT 1,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  observaciones VARCHAR(255) NULL,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_codegol_susp_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores(id),
  CONSTRAINT fk_codegol_susp_torneo FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  CONSTRAINT fk_codegol_susp_partido FOREIGN KEY (partido_origen_id) REFERENCES partidos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  equipo_id BIGINT NOT NULL,
  concepto ENUM('INSCRIPCION','ARBITRAJE','MULTA') NOT NULL,
  inscripcion_id BIGINT NULL,
  partido_id BIGINT NULL,
  descripcion VARCHAR(200) NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('EFECTIVO','TARJETA','TRANSFERENCIA') NOT NULL DEFAULT 'EFECTIVO',
  estado ENUM('PENDIENTE','CUBIERTO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  fecha_pago DATETIME NULL,
  cobrado_por BIGINT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pagos_fecha (fecha_pago, concepto),
  KEY idx_pagos_partido (partido_id, estado),
  CONSTRAINT fk_codegol_pago_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  CONSTRAINT fk_codegol_pago_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE SET NULL,
  CONSTRAINT fk_codegol_pago_partido FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE SET NULL,
  CONSTRAINT fk_codegol_pago_usuario FOREIGN KEY (cobrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recibos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pago_id BIGINT NOT NULL UNIQUE,
  folio VARCHAR(20) NOT NULL UNIQUE,
  emitido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_codegol_recibo_pago FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Inicializa inscripciones a partir de los equipos que ya existían en codegol_db.
INSERT IGNORE INTO inscripciones (torneo_id, equipo_id, estado)
SELECT torneo_id, id,
       IF(pago_inscripcion_cubierto, 'ACTIVO', 'PENDIENTE_PAGO')
FROM equipos;

INSERT IGNORE INTO canchas (nombre) VALUES ('Cancha 1'), ('Cancha 2'), ('Cancha 3');
