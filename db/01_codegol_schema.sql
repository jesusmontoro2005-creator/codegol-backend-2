-- =====================================================================
--  CODEGOL - Esquema de base de datos (MySQL 8 / MariaDB 10.5+)
--  Equipo: Special Code
--  Cubre HU-01 a HU-06 de la Especificación de Requerimientos.
--  Los nombres (username, ROLE_*, EN_INSCRIPCION, delegado, telefono,
--  logo_url...) coinciden con lo que ya envía/espera el front React.
--
--  CÓMO CORRERLO EN DBEAVER
--   1. Conexión nueva -> MySQL (o MariaDB), usuario con permisos de CREATE.
--   2. Abrir este archivo en un SQL Editor y ejecutar COMO SCRIPT
--      (Alt+X / botón "Execute SQL Script"), no con Ctrl+Enter.
--   3. DBeaver entiende DELIMITER, así que los triggers/procedimientos
--      del final se crean sin cambios.
--   4. Después ejecutar 02_codegol_seed.sql (datos de prueba).
-- =====================================================================

DROP DATABASE IF EXISTS codegol;
CREATE DATABASE codegol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE codegol;

-- ---------------------------------------------------------------------
-- 1. USUARIOS (Administrador, Árbitro, Mesa de Control)
--    El Jugador/Aficionado NO tiene cuenta: consulta el portal sin login.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  -- utf8mb4_bin: el usuario se guarda y se compara EXACTAMENTE como se escribió ("Lesli" y "lesli" son distintos)
  username        VARCHAR(50)  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
  nombre_completo VARCHAR(100) NOT NULL,
  email           VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,          -- bcrypt desde Spring Security
  rol             ENUM('ROLE_ADMIN','ROLE_ARBITRO','ROLE_MESA_CONTROL') NOT NULL,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_username CHECK (username REGEXP '^[A-Za-z0-9._-]{4,50}$')
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. CATÁLOGOS Y TORNEOS (HU-04)
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,         -- Varonil, Femenil, Mixto, Libre
  descripcion VARCHAR(200) NULL,
  activa      TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE canchas (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  activa TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE torneos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  descripcion         VARCHAR(500) NULL,
  categoria_id        INT NOT NULL,                       -- un torneo = una categoría (así lo maneja el front)
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE NULL,
  estado              ENUM('EN_INSCRIPCION','EN_PROGRESO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'EN_INSCRIPCION',
  cuota_inscripcion   DECIMAL(10,2) NOT NULL DEFAULT 0,
  cuota_arbitraje     DECIMAL(10,2) NOT NULL DEFAULT 0,   -- por equipo y por partido
  puntos_victoria     TINYINT NOT NULL DEFAULT 3,
  puntos_empate       TINYINT NOT NULL DEFAULT 1,
  limite_amarillas    TINYINT NOT NULL DEFAULT 3,         -- amarillas acumuladas que generan suspensión
  creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB;
-- Nota: para varias categorías se crea un torneo por categoría
-- (ej. "Apertura 2026 Varonil" y "Apertura 2026 Femenil").

-- ---------------------------------------------------------------------
-- 3. EQUIPOS, INSCRIPCIONES Y JUGADORES (HU-01, HU-05)
-- ---------------------------------------------------------------------
CREATE TABLE equipos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL UNIQUE,
  logo_url           VARCHAR(255) NULL,
  delegado           VARCHAR(100) NULL,
  telefono           VARCHAR(20)  NULL,
  creado_en          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Un equipo se inscribe a una categoría de un torneo.
-- estado pasa a ACTIVO automáticamente al cubrir el pago de inscripción (HU-05 esc.1)
CREATE TABLE inscripciones (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  torneo_id INT NOT NULL,
  equipo_id           INT NOT NULL,
  estado              ENUM('PENDIENTE_PAGO','ACTIVO','BAJA') NOT NULL DEFAULT 'PENDIENTE_PAGO',
  fecha_inscripcion   DATE NOT NULL DEFAULT (CURRENT_DATE),
  UNIQUE KEY uq_inscripcion (torneo_id, equipo_id),
  FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)           REFERENCES equipos(id)
) ENGINE=InnoDB;

CREATE TABLE jugadores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id         INT NOT NULL,
  nombre            VARCHAR(80) NOT NULL,
  apellido_paterno  VARCHAR(80) NOT NULL,
  apellido_materno  VARCHAR(80) NULL,
  curp              CHAR(18) NULL UNIQUE,
  fecha_nacimiento  DATE NULL,
  numero_camiseta   TINYINT UNSIGNED NULL,
  posicion          ENUM('PORTERO','DEFENSA','MEDIO','DELANTERO') NULL,
  foto_url          VARCHAR(255) NULL,          -- se muestra al pasar lista (HU-01 esc.2)
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_camiseta_equipo (equipo_id, numero_camiseta),
  FOREIGN KEY (equipo_id) REFERENCES equipos(id)
) ENGINE=InnoDB;

-- Plantilla biométrica única por jugador (HU-01 esc.1)
CREATE TABLE huellas_biometricas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id     INT NOT NULL UNIQUE,
  plantilla      MEDIUMBLOB NOT NULL,            -- template del SDK del lector
  dedo           ENUM('PULGAR_DER','INDICE_DER','MEDIO_DER','PULGAR_IZQ','INDICE_IZQ','MEDIO_IZQ') NOT NULL DEFAULT 'INDICE_DER',
  registrado_por INT NULL,
  registrado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jugador_id)     REFERENCES jugadores(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. CALENDARIO (HU-04)
-- ---------------------------------------------------------------------
CREATE TABLE jornadas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  torneo_id INT NOT NULL,
  numero              SMALLINT NOT NULL,
  fecha_inicio        DATE NULL,
  fecha_fin           DATE NULL,
  UNIQUE KEY uq_jornada (torneo_id, numero),
  FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE partidos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  jornada_id          INT NOT NULL,
  cancha_id           INT NOT NULL,
  fecha               DATE NOT NULL,
  hora_inicio         TIME NOT NULL,
  hora_fin            TIME NOT NULL,
  equipo_local_id     INT NOT NULL,
  equipo_visitante_id INT NOT NULL,
  arbitro_id          INT NULL,                               -- usuario con rol ARBITRO
  goles_local         SMALLINT NOT NULL DEFAULT 0,
  goles_visitante     SMALLINT NOT NULL DEFAULT 0,
  estado              ENUM('PROGRAMADO','EN_CURSO','FINALIZADO','SUSPENDIDO','CANCELADO') NOT NULL DEFAULT 'PROGRAMADO',
  cedula_cerrada_en   DATETIME NULL,
  CHECK (equipo_local_id <> equipo_visitante_id),
  CHECK (hora_fin > hora_inicio),
  UNIQUE KEY uq_cancha_horario (cancha_id, fecha, hora_inicio),   -- primera barrera anti-traslape
  KEY idx_partidos_fecha (fecha, cancha_id),
  FOREIGN KEY (jornada_id)          REFERENCES jornadas(id) ON DELETE CASCADE,
  FOREIGN KEY (cancha_id)           REFERENCES canchas(id),
  FOREIGN KEY (equipo_local_id)     REFERENCES equipos(id),
  FOREIGN KEY (equipo_visitante_id) REFERENCES equipos(id),
  FOREIGN KEY (arbitro_id)          REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. PASE DE LISTA BIOMÉTRICO Y CÉDULA ARBITRAL (HU-01, HU-02)
-- ---------------------------------------------------------------------
CREATE TABLE pase_lista (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  partido_id    INT NOT NULL,
  jugador_id    INT NOT NULL,
  equipo_id     INT NOT NULL,
  resultado     ENUM('AUTORIZADO','HUELLA_NO_COINCIDE','SUSPENDIDO') NOT NULL,
  metodo        ENUM('HUELLA','MANUAL') NOT NULL DEFAULT 'HUELLA',
  tiempo_ms     INT NULL,                                    -- tiempo de autenticación (<3000 ms)
  validado_por  INT NULL,
  validado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pase (partido_id, jugador_id),
  FOREIGN KEY (partido_id)   REFERENCES partidos(id)  ON DELETE CASCADE,
  FOREIGN KEY (jugador_id)   REFERENCES jugadores(id),
  FOREIGN KEY (equipo_id)    REFERENCES equipos(id),
  FOREIGN KEY (validado_por) REFERENCES usuarios(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE eventos_partido (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  partido_id       INT NOT NULL,
  equipo_id        INT NOT NULL,
  jugador_id       INT NOT NULL,
  tipo             ENUM('GOL','GOL_PROPIO','AMARILLA','ROJA','FALTA','CAMBIO') NOT NULL,
  jugador_entra_id INT NULL,                                 -- solo para CAMBIO
  minuto           TINYINT UNSIGNED NULL,
  sync_uuid        CHAR(36) NULL UNIQUE,                     -- evita duplicados al reconectar la APK offline
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_eventos_partido (partido_id, tipo),
  KEY idx_eventos_jugador (jugador_id, tipo),
  FOREIGN KEY (partido_id)       REFERENCES partidos(id)  ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)        REFERENCES equipos(id),
  FOREIGN KEY (jugador_id)       REFERENCES jugadores(id),
  FOREIGN KEY (jugador_entra_id) REFERENCES jugadores(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. ESTADÍSTICAS Y SANCIONES (HU-03)
-- ---------------------------------------------------------------------
CREATE TABLE tabla_posiciones (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  torneo_id INT NOT NULL,
  equipo_id           INT NOT NULL,
  pj  SMALLINT NOT NULL DEFAULT 0,
  pg  SMALLINT NOT NULL DEFAULT 0,
  pe  SMALLINT NOT NULL DEFAULT 0,
  pp  SMALLINT NOT NULL DEFAULT 0,
  gf  SMALLINT NOT NULL DEFAULT 0,
  gc  SMALLINT NOT NULL DEFAULT 0,
  dg  SMALLINT AS (gf - gc) STORED,
  pts SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_tabla (torneo_id, equipo_id),
  KEY idx_orden (torneo_id, pts, dg, gf),
  FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)           REFERENCES equipos(id)
) ENGINE=InnoDB;

CREATE TABLE suspensiones (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id          INT NOT NULL,
  torneo_id INT NOT NULL,
  partido_origen_id   INT NULL,
  motivo              ENUM('ACUMULACION_AMARILLAS','ROJA_DIRECTA','DISCIPLINARIA') NOT NULL,
  partidos_restantes  TINYINT NOT NULL DEFAULT 1,
  activa              TINYINT(1) NOT NULL DEFAULT 1,
  observaciones       VARCHAR(255) NULL,
  creada_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_susp_jugador (jugador_id, activa),
  FOREIGN KEY (jugador_id)          REFERENCES jugadores(id),
  FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
  FOREIGN KEY (partido_origen_id)   REFERENCES partidos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. FINANZAS / POS (HU-05)
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id      INT NOT NULL,
  concepto       ENUM('INSCRIPCION','ARBITRAJE','MULTA') NOT NULL,
  inscripcion_id INT NULL,                         -- si concepto = INSCRIPCION
  partido_id     INT NULL,                         -- si concepto = ARBITRAJE
  descripcion    VARCHAR(200) NULL,                -- motivo de la multa, notas
  monto          DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  metodo_pago    ENUM('EFECTIVO','TARJETA','TRANSFERENCIA') NOT NULL DEFAULT 'EFECTIVO',
  estado         ENUM('PENDIENTE','CUBIERTO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  fecha_pago     DATETIME NULL,
  cobrado_por    INT NULL,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pagos_fecha (fecha_pago, concepto),
  KEY idx_pagos_partido (partido_id, estado),
  FOREIGN KEY (equipo_id)      REFERENCES equipos(id),
  FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE SET NULL,
  FOREIGN KEY (partido_id)     REFERENCES partidos(id)      ON DELETE SET NULL,
  FOREIGN KEY (cobrado_por)    REFERENCES usuarios(id)      ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE recibos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  pago_id    INT NOT NULL UNIQUE,
  folio      VARCHAR(20) NOT NULL UNIQUE,          -- CG-000001
  emitido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
--  VISTAS (las consume el portal público y el panel admin)
-- =====================================================================

-- GET equipos/torneo/{id}: equipos inscritos + si ya pagaron la inscripción
CREATE VIEW v_equipos_torneo AS
SELECT e.id, e.nombre, e.logo_url AS logoUrl, e.delegado, e.telefono,
       i.torneo_id AS torneoId, t.nombre AS torneoNombre, i.estado AS estadoInscripcion,
       (i.estado = 'ACTIVO') AS pagoInscripcionCubierto
FROM inscripciones i
JOIN equipos e ON e.id = i.equipo_id
JOIN torneos t ON t.id = i.torneo_id
WHERE i.estado <> 'BAJA';

-- HU-06 esc.1: tabla general ordenada (puntos, diferencia, goles a favor)
CREATE VIEW v_tabla_general AS
SELECT t.id AS torneo_id, t.nombre AS torneo, c.nombre AS categoria,
       e.id AS equipo_id, e.nombre AS equipo, e.logo_url,
       tp.pj, tp.pg, tp.pe, tp.pp, tp.gf, tp.gc, tp.dg, tp.pts,
       RANK() OVER (PARTITION BY tp.torneo_id ORDER BY tp.pts DESC, tp.dg DESC, tp.gf DESC) AS posicion
FROM tabla_posiciones tp
JOIN torneos t     ON t.id = tp.torneo_id
JOIN categorias c  ON c.id = t.categoria_id
JOIN equipos e     ON e.id = tp.equipo_id;

-- HU-06 esc.3: ranking de goleadores (los goles en propia puerta no cuentan)
CREATE VIEW v_goleadores AS
SELECT t.id AS torneo_id, t.nombre AS torneo, c.nombre AS categoria,
       j.id AS jugador_id, CONCAT(j.nombre,' ',j.apellido_paterno) AS jugador,
       e.nombre AS equipo, COUNT(*) AS goles
FROM eventos_partido ev
JOIN partidos p ON p.id = ev.partido_id
JOIN jornadas jo ON jo.id = p.jornada_id
JOIN torneos t ON t.id = jo.torneo_id
JOIN categorias c ON c.id = t.categoria_id
JOIN jugadores j ON j.id = ev.jugador_id
JOIN equipos e ON e.id = ev.equipo_id
WHERE ev.tipo = 'GOL'
GROUP BY t.id, t.nombre, c.nombre, j.id, j.nombre, j.apellido_paterno, e.nombre;

-- HU-06 esc.2: rol de juegos con fecha, hora y cancha
CREATE VIEW v_calendario AS
SELECT p.id AS partido_id, t.id AS torneo_id, t.nombre AS torneo, c.nombre AS categoria,
       jo.numero AS jornada, p.fecha, p.hora_inicio, p.hora_fin, ca.nombre AS cancha,
       el.nombre AS local, ev.nombre AS visitante,
       p.goles_local, p.goles_visitante, p.estado, p.arbitro_id
FROM partidos p
JOIN jornadas jo ON jo.id = p.jornada_id
JOIN torneos t ON t.id = jo.torneo_id
JOIN categorias c ON c.id = t.categoria_id
JOIN canchas ca ON ca.id = p.cancha_id
JOIN equipos el ON el.id = p.equipo_local_id
JOIN equipos ev ON ev.id = p.equipo_visitante_id;

-- Arbitraje cubierto por partido (HU-05 esc.2): ambos equipos deben tener su pago CUBIERTO
CREATE VIEW v_arbitraje_partido AS
SELECT p.id AS partido_id,
       SUM(pg.estado = 'CUBIERTO' AND pg.concepto = 'ARBITRAJE') AS equipos_pagados,
       IF(SUM(pg.estado = 'CUBIERTO' AND pg.concepto = 'ARBITRAJE') >= 2, 'CUBIERTO', 'PENDIENTE') AS estado_arbitraje
FROM partidos p
LEFT JOIN pagos pg ON pg.partido_id = p.id
GROUP BY p.id;

-- HU-05 esc.3: ingresos por día y concepto (filtrar por fechas en el WHERE)
CREATE VIEW v_ingresos AS
SELECT DATE(fecha_pago) AS dia, concepto, COUNT(*) AS num_pagos, SUM(monto) AS total
FROM pagos
WHERE estado = 'CUBIERTO'
GROUP BY DATE(fecha_pago), concepto;

-- Jugadores suspendidos hoy (la APK los bloquea al pasar lista)
CREATE VIEW v_jugadores_suspendidos AS
SELECT s.id, s.jugador_id, CONCAT(j.nombre,' ',j.apellido_paterno) AS jugador, e.nombre AS equipo,
       s.motivo, s.partidos_restantes, s.torneo_id
FROM suspensiones s
JOIN jugadores j ON j.id = s.jugador_id
JOIN equipos e ON e.id = j.equipo_id
WHERE s.activa = 1;

-- =====================================================================
--  TRIGGERS Y PROCEDIMIENTOS (reglas de negocio en la BD)
-- =====================================================================
DELIMITER $$

-- HU-04 esc.3: impedir traslape de cancha o de equipo en el mismo horario
CREATE TRIGGER trg_partidos_traslape_ins BEFORE INSERT ON partidos
FOR EACH ROW
BEGIN
  IF NEW.estado <> 'CANCELADO' THEN
    IF EXISTS (SELECT 1 FROM partidos x
               WHERE x.cancha_id = NEW.cancha_id AND x.fecha = NEW.fecha AND x.estado <> 'CANCELADO'
                 AND NEW.hora_inicio < x.hora_fin AND NEW.hora_fin > x.hora_inicio) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Traslape: la cancha ya está ocupada en ese horario';
    END IF;
    IF EXISTS (SELECT 1 FROM partidos x
               WHERE x.fecha = NEW.fecha AND x.estado <> 'CANCELADO'
                 AND NEW.hora_inicio < x.hora_fin AND NEW.hora_fin > x.hora_inicio
                 AND (x.equipo_local_id IN (NEW.equipo_local_id, NEW.equipo_visitante_id)
                   OR x.equipo_visitante_id IN (NEW.equipo_local_id, NEW.equipo_visitante_id))) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Traslape: un equipo ya juega en ese horario';
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_partidos_traslape_upd BEFORE UPDATE ON partidos
FOR EACH ROW
BEGIN
  IF NEW.estado <> 'CANCELADO'
     AND (NEW.cancha_id <> OLD.cancha_id OR NEW.fecha <> OLD.fecha OR NEW.hora_inicio <> OLD.hora_inicio
          OR NEW.hora_fin <> OLD.hora_fin OR NEW.equipo_local_id <> OLD.equipo_local_id
          OR NEW.equipo_visitante_id <> OLD.equipo_visitante_id) THEN
    IF EXISTS (SELECT 1 FROM partidos x
               WHERE x.id <> NEW.id AND x.cancha_id = NEW.cancha_id AND x.fecha = NEW.fecha AND x.estado <> 'CANCELADO'
                 AND NEW.hora_inicio < x.hora_fin AND NEW.hora_fin > x.hora_inicio) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Traslape: la cancha ya está ocupada en ese horario';
    END IF;
    IF EXISTS (SELECT 1 FROM partidos x
               WHERE x.id <> NEW.id AND x.fecha = NEW.fecha AND x.estado <> 'CANCELADO'
                 AND NEW.hora_inicio < x.hora_fin AND NEW.hora_fin > x.hora_inicio
                 AND (x.equipo_local_id IN (NEW.equipo_local_id, NEW.equipo_visitante_id)
                   OR x.equipo_visitante_id IN (NEW.equipo_local_id, NEW.equipo_visitante_id))) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Traslape: un equipo ya juega en ese horario';
    END IF;
  END IF;
END$$

-- HU-01 esc.3: si el jugador tiene suspensión vigente, el pase de lista queda SUSPENDIDO
CREATE TRIGGER trg_pase_lista_suspension BEFORE INSERT ON pase_lista
FOR EACH ROW
BEGIN
  IF NEW.resultado = 'AUTORIZADO'
     AND EXISTS (SELECT 1 FROM suspensiones s WHERE s.jugador_id = NEW.jugador_id AND s.activa = 1) THEN
    SET NEW.resultado = 'SUSPENDIDO';
  END IF;
END$$

-- Solo se capturan eventos con el partido EN_CURSO y jugador que pasó lista
CREATE TRIGGER trg_eventos_validar BEFORE INSERT ON eventos_partido
FOR EACH ROW
BEGIN
  DECLARE v_estado VARCHAR(20); DECLARE v_local INT; DECLARE v_visit INT; DECLARE v_equipo_jug INT;
  SELECT estado, equipo_local_id, equipo_visitante_id INTO v_estado, v_local, v_visit FROM partidos WHERE id = NEW.partido_id;
  IF v_estado <> 'EN_CURSO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cédula no está abierta (partido no EN_CURSO)';
  END IF;
  IF NEW.equipo_id NOT IN (v_local, v_visit) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El equipo del evento no juega este partido';
  END IF;
  SELECT equipo_id INTO v_equipo_jug FROM jugadores WHERE id = NEW.jugador_id;
  IF v_equipo_jug <> NEW.equipo_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El jugador no pertenece al equipo del evento';
  END IF;
END$$

-- HU-05 esc.1: al cubrir pago de inscripción -> inscripción ACTIVO + recibo digital
-- (los recibos de arbitraje y multa también se generan al cubrirse el pago)
CREATE TRIGGER trg_pago_cubierto_upd AFTER UPDATE ON pagos
FOR EACH ROW
BEGIN
  IF NEW.estado = 'CUBIERTO' AND OLD.estado <> 'CUBIERTO' THEN
    IF NEW.concepto = 'INSCRIPCION' AND NEW.inscripcion_id IS NOT NULL THEN
      UPDATE inscripciones SET estado = 'ACTIVO' WHERE id = NEW.inscripcion_id;
    END IF;
    INSERT IGNORE INTO recibos (pago_id, folio) VALUES (NEW.id, CONCAT('CG-', LPAD(NEW.id, 6, '0')));
  END IF;
END$$

CREATE TRIGGER trg_pago_cubierto_ins AFTER INSERT ON pagos
FOR EACH ROW
BEGIN
  IF NEW.estado = 'CUBIERTO' THEN
    IF NEW.concepto = 'INSCRIPCION' AND NEW.inscripcion_id IS NOT NULL THEN
      UPDATE inscripciones SET estado = 'ACTIVO' WHERE id = NEW.inscripcion_id;
    END IF;
    INSERT IGNORE INTO recibos (pago_id, folio) VALUES (NEW.id, CONCAT('CG-', LPAD(NEW.id, 6, '0')));
  END IF;
END$$

-- Al activarse una inscripción, se crea su renglón en la tabla de posiciones
CREATE TRIGGER trg_inscripcion_activa AFTER UPDATE ON inscripciones
FOR EACH ROW
BEGIN
  IF NEW.estado = 'ACTIVO' AND OLD.estado <> 'ACTIVO' THEN
    INSERT IGNORE INTO tabla_posiciones (torneo_id, equipo_id) VALUES (NEW.torneo_id, NEW.equipo_id);
  END IF;
END$$

-- HU-02 / HU-05 esc.2: abrir cédula SOLO si el arbitraje está CUBIERTO
CREATE PROCEDURE sp_iniciar_cedula(IN p_partido_id INT)
BEGIN
  DECLARE v_estado VARCHAR(20);
  DECLARE v_arb VARCHAR(20);
  SELECT estado INTO v_estado FROM partidos WHERE id = p_partido_id;
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Partido inexistente';
  END IF;
  IF v_estado <> 'PROGRAMADO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El partido no está en estado PROGRAMADO';
  END IF;
  SELECT estado_arbitraje INTO v_arb FROM v_arbitraje_partido WHERE partido_id = p_partido_id;
  IF v_arb <> 'CUBIERTO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Arbitraje pendiente de pago: no se puede abrir la cédula';
  END IF;
  UPDATE partidos SET estado = 'EN_CURSO' WHERE id = p_partido_id;
END$$

-- Recalcula una fila de la tabla de posiciones desde los partidos FINALIZADOS (idempotente)
CREATE PROCEDURE sp_recalcular_posicion(IN p_torneo INT, IN p_equipo INT)
BEGIN
  DECLARE v_pv TINYINT; DECLARE v_pe TINYINT;
  SELECT t.puntos_victoria, t.puntos_empate INTO v_pv, v_pe
    FROM torneos t WHERE t.id = p_torneo;

  INSERT INTO tabla_posiciones (torneo_id, equipo_id, pj, pg, pe, pp, gf, gc, pts)
  SELECT p_torneo, p_equipo,
         COUNT(*),
         COALESCE(SUM(m.gf > m.gc), 0), COALESCE(SUM(m.gf = m.gc), 0), COALESCE(SUM(m.gf < m.gc), 0),
         COALESCE(SUM(m.gf), 0), COALESCE(SUM(m.gc), 0),
         COALESCE(SUM(IF(m.gf > m.gc, v_pv, IF(m.gf = m.gc, v_pe, 0))), 0)
  FROM (
    SELECT IF(p.equipo_local_id = p_equipo, p.goles_local, p.goles_visitante) AS gf,
           IF(p.equipo_local_id = p_equipo, p.goles_visitante, p.goles_local) AS gc
    FROM partidos p JOIN jornadas j ON j.id = p.jornada_id
    WHERE j.torneo_id = p_torneo AND p.estado = 'FINALIZADO'
      AND p_equipo IN (p.equipo_local_id, p.equipo_visitante_id)
  ) m
  ON DUPLICATE KEY UPDATE pj = VALUES(pj), pg = VALUES(pg), pe = VALUES(pe), pp = VALUES(pp),
                          gf = VALUES(gf), gc = VALUES(gc), pts = VALUES(pts);
END$$

-- HU-02 esc.3 + HU-03: cerrar cédula -> marcador, puntos, DG y suspensiones automáticas
CREATE PROCEDURE sp_cerrar_cedula(IN p_partido_id INT)
BEGIN
  DECLARE v_estado VARCHAR(20);
  DECLARE v_local INT; DECLARE v_visit INT; DECLARE v_torneo INT;
  DECLARE v_gl INT; DECLARE v_gv INT; DECLARE v_lim TINYINT;

  SELECT p.estado, p.equipo_local_id, p.equipo_visitante_id, j.torneo_id
    INTO v_estado, v_local, v_visit, v_torneo
    FROM partidos p JOIN jornadas j ON j.id = p.jornada_id WHERE p.id = p_partido_id;
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Partido inexistente';
  END IF;
  IF v_estado <> 'EN_CURSO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se puede cerrar una cédula EN_CURSO';
  END IF;

  -- marcador definitivo (GOL suma al equipo del jugador; GOL_PROPIO suma al rival)
  SELECT COALESCE(SUM((tipo='GOL' AND equipo_id=v_local) OR (tipo='GOL_PROPIO' AND equipo_id=v_visit)),0),
         COALESCE(SUM((tipo='GOL' AND equipo_id=v_visit) OR (tipo='GOL_PROPIO' AND equipo_id=v_local)),0)
    INTO v_gl, v_gv
    FROM eventos_partido WHERE partido_id = p_partido_id;

  UPDATE partidos SET goles_local = v_gl, goles_visitante = v_gv,
                      estado = 'FINALIZADO', cedula_cerrada_en = NOW()
   WHERE id = p_partido_id;

  CALL sp_recalcular_posicion(v_torneo, v_local);
  CALL sp_recalcular_posicion(v_torneo, v_visit);

  -- cumplir suspensiones previas de jugadores de ambos equipos (este partido cuenta como 1 cumplido)
  UPDATE suspensiones s JOIN jugadores j ON j.id = s.jugador_id
     SET s.partidos_restantes = s.partidos_restantes - 1,
         s.activa = IF(s.partidos_restantes - 1 <= 0, 0, 1)
   WHERE s.activa = 1 AND s.torneo_id = v_torneo
     AND j.equipo_id IN (v_local, v_visit)
     AND (s.partido_origen_id IS NULL OR s.partido_origen_id <> p_partido_id);

  -- roja directa
  INSERT INTO suspensiones (jugador_id, torneo_id, partido_origen_id, motivo, partidos_restantes)
  SELECT DISTINCT ev.jugador_id, v_torneo, p_partido_id, 'ROJA_DIRECTA', 1
    FROM eventos_partido ev WHERE ev.partido_id = p_partido_id AND ev.tipo = 'ROJA';

  -- acumulación de amarillas: una suspensión por cada múltiplo del límite alcanzado
  SELECT t.limite_amarillas INTO v_lim
    FROM torneos t WHERE t.id = v_torneo;

  INSERT INTO suspensiones (jugador_id, torneo_id, partido_origen_id, motivo, partidos_restantes)
  SELECT a.jugador_id, v_torneo, p_partido_id, 'ACUMULACION_AMARILLAS', 1
  FROM (
    SELECT ev.jugador_id, COUNT(*) AS total
    FROM eventos_partido ev
    JOIN partidos p ON p.id = ev.partido_id
    JOIN jornadas j ON j.id = p.jornada_id
    WHERE ev.tipo = 'AMARILLA' AND j.torneo_id = v_torneo AND p.estado = 'FINALIZADO'
      AND ev.jugador_id IN (SELECT jugador_id FROM eventos_partido WHERE partido_id = p_partido_id AND tipo = 'AMARILLA')
    GROUP BY ev.jugador_id
  ) a
  WHERE a.total DIV v_lim > (SELECT COUNT(*) FROM suspensiones s
                              WHERE s.jugador_id = a.jugador_id AND s.torneo_id = v_torneo
                                AND s.motivo = 'ACUMULACION_AMARILLAS');
END$$

DELIMITER ;
