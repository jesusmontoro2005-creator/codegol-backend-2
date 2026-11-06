-- Cuenta administrativa local para recuperar el acceso al backend.
-- Ejecutar en phpMyAdmin seleccionando la base codegol.
-- Credenciales resultantes: admin / codegol123
-- Cambia la contraseña desde Configuración después de iniciar sesión.

USE `codegol`;

INSERT INTO `usuarios`
  (`username`, `password`, `nombre_completo`, `email`, `rol`, `activo`, `fecha_creacion`, `fecha_actualizacion`)
VALUES
  ('admin', '$2b$10$fjubxHqaKAT2CWt3WEHswOCj9hnIqNuVisjp5fHHi/1BJPCrXjYh6',
   'Administrador CODEGOL', 'admin-local@codegol.invalid', 'ROLE_ADMIN', b'1', NOW(), NULL)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `nombre_completo` = VALUES(`nombre_completo`),
  `rol` = 'ROLE_ADMIN',
  `activo` = b'1',
  `fecha_actualizacion` = NOW();

