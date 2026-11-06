-- HU-01: distingue plantillas biométricas reales de registros antiguos o de demostración.
-- Ejecutar una vez en `codegol`; no borra ni modifica las plantillas existentes.
USE `codegol`;

SET @tiene_motor_huella = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'huellas_biometricas' AND column_name = 'motor'
);
SET @sql_huella = IF(@tiene_motor_huella = 0,
  'ALTER TABLE `huellas_biometricas` ADD COLUMN `motor` VARCHAR(40) NOT NULL DEFAULT ''LEGACY'' AFTER `plantilla`',
  'SELECT ''La columna motor ya existe.''');
PREPARE stmt_huella FROM @sql_huella;
EXECUTE stmt_huella;
DEALLOCATE PREPARE stmt_huella;
