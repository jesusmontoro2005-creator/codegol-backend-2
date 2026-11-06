-- Copia segura de la base legacy codegol_db a codegol.
-- Requiere MariaDB y que codegol NO exista todavía.
-- No elimina ni modifica codegol_db. Ejecutar una sola vez desde phpMyAdmin.

CREATE DATABASE `codegol` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `codegol`.`categorias` LIKE `codegol_db`.`categorias`;
CREATE TABLE `codegol`.`torneos`   LIKE `codegol_db`.`torneos`;
CREATE TABLE `codegol`.`equipos`   LIKE `codegol_db`.`equipos`;
CREATE TABLE `codegol`.`usuarios`  LIKE `codegol_db`.`usuarios`;

INSERT INTO `codegol`.`categorias` SELECT * FROM `codegol_db`.`categorias`;
INSERT INTO `codegol`.`torneos`   SELECT * FROM `codegol_db`.`torneos`;
INSERT INTO `codegol`.`equipos`   SELECT * FROM `codegol_db`.`equipos`;
INSERT INTO `codegol`.`usuarios`  SELECT * FROM `codegol_db`.`usuarios`;

-- Mantiene los campos actuales y agrega los campos que el formulario del front requiere.
ALTER TABLE `codegol`.`torneos`
  MODIFY COLUMN `descripcion` VARCHAR(500) NULL,
  ADD COLUMN `cuota_inscripcion` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `cuota_arbitraje` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `puntos_victoria` TINYINT NOT NULL DEFAULT 3,
  ADD COLUMN `puntos_empate` TINYINT NOT NULL DEFAULT 1,
  ADD COLUMN `limite_amarillas` TINYINT NOT NULL DEFAULT 3;

-- Conserva los roles existentes y habilita el rol de Mesa de control usado por el front.
ALTER TABLE `codegol`.`usuarios`
  MODIFY COLUMN `rol` ENUM('ROLE_ADMIN','ROLE_ARBITRO','ROLE_JUGADOR','ROLE_MESA_CONTROL') NOT NULL;

-- CREATE TABLE LIKE copia columnas e índices, pero no las claves foráneas.
ALTER TABLE `codegol`.`torneos`
  ADD CONSTRAINT `fk_codegol_torneos_categoria`
  FOREIGN KEY (`categoria_id`) REFERENCES `codegol`.`categorias` (`id`);

ALTER TABLE `codegol`.`equipos`
  ADD CONSTRAINT `fk_codegol_equipos_torneo`
  FOREIGN KEY (`torneo_id`) REFERENCES `codegol`.`torneos` (`id`);

