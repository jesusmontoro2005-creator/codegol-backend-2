-- HU-04: alinea bases existentes con la validación de traslapes transaccional del backend.
-- Ejecutar una vez seleccionando la base `codegol`. No modifica partidos ni jornadas.
USE `codegol`;

SET @tiene_indice_horario = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'partidos'
    AND index_name = 'uq_cancha_horario'
);
SET @sql_calendario = IF(
  @tiene_indice_horario > 0,
  'ALTER TABLE `partidos` DROP INDEX `uq_cancha_horario`',
  'SELECT ''El índice uq_cancha_horario ya fue retirado.'''
);
PREPARE stmt_calendario FROM @sql_calendario;
EXECUTE stmt_calendario;
DEALLOCATE PREPARE stmt_calendario;

-- Índices que aceleran la detección de ocupación por fecha y recurso.
SET @tiene_indice_fecha = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'partidos' AND index_name = 'idx_partidos_fecha'
);
SET @sql_calendario = IF(@tiene_indice_fecha = 0,
  'CREATE INDEX `idx_partidos_fecha` ON `partidos` (`fecha`, `cancha_id`)',
  'SELECT ''idx_partidos_fecha ya existe.''');
PREPARE stmt_calendario FROM @sql_calendario;
EXECUTE stmt_calendario;
DEALLOCATE PREPARE stmt_calendario;

SET @tiene_indice_local = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'partidos' AND index_name = 'idx_partidos_local_fecha'
);
SET @sql_calendario = IF(@tiene_indice_local = 0,
  'CREATE INDEX `idx_partidos_local_fecha` ON `partidos` (`equipo_local_id`, `fecha`)',
  'SELECT ''idx_partidos_local_fecha ya existe.''');
PREPARE stmt_calendario FROM @sql_calendario;
EXECUTE stmt_calendario;
DEALLOCATE PREPARE stmt_calendario;

SET @tiene_indice_visitante = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'partidos' AND index_name = 'idx_partidos_visitante_fecha'
);
SET @sql_calendario = IF(@tiene_indice_visitante = 0,
  'CREATE INDEX `idx_partidos_visitante_fecha` ON `partidos` (`equipo_visitante_id`, `fecha`)',
  'SELECT ''idx_partidos_visitante_fecha ya existe.''');
PREPARE stmt_calendario FROM @sql_calendario;
EXECUTE stmt_calendario;
DEALLOCATE PREPARE stmt_calendario;
