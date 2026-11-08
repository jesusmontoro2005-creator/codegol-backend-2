-- Agrega el estado de archivo sin modificar los torneos ni su historial.
USE `codegol`;

ALTER TABLE torneos
  ADD COLUMN archivado TINYINT(1) NOT NULL DEFAULT 0 AFTER estado;
