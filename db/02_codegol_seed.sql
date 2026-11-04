-- =====================================================================
--  CODEGOL - Datos de prueba (ejecutar DESPUÉS de 01_codegol_schema.sql)
--  Contraseña de los 3 usuarios de prueba: codegol123
--  Mismas cuentas, equipos y torneos que el "modo demostración" del front.
--  Fechas pensadas para el 2-nov-2026: jornada 1 ya jugada, jornada 2 es HOY.
-- =====================================================================
USE codegol;

INSERT INTO usuarios (username, nombre_completo, email, password_hash, rol) VALUES
 ('admin',   'Administrador General', 'admin@codegol.mx',   '$2b$10$fjubxHqaKAT2CWt3WEHswOCj9hnIqNuVisjp5fHHi/1BJPCrXjYh6', 'ROLE_ADMIN'),
 ('arbitro', 'Carlos Árbitro',        'arbitro@codegol.mx', '$2b$10$fjubxHqaKAT2CWt3WEHswOCj9hnIqNuVisjp5fHHi/1BJPCrXjYh6', 'ROLE_ARBITRO'),
 ('mesa',    'Mesa de Control',       'mesa@codegol.mx',    '$2b$10$fjubxHqaKAT2CWt3WEHswOCj9hnIqNuVisjp5fHHi/1BJPCrXjYh6', 'ROLE_MESA_CONTROL');

INSERT INTO categorias (nombre, descripcion) VALUES
 ('Varonil','Equipos varoniles'), ('Femenil','Equipos femeniles'), ('Mixto','Equipos mixtos'), ('Libre','Categoría libre');
INSERT INTO canchas (nombre) VALUES ('Cancha 1'), ('Cancha 2'), ('Cancha 3');

-- Varonil=1, Femenil=2, Mixto=3, Libre=4
INSERT INTO torneos (nombre, descripcion, categoria_id, fecha_inicio, fecha_fin, estado, cuota_inscripcion, cuota_arbitraje, limite_amarillas)
VALUES ('Apertura 2026 Varonil', 'Torneo de liga a una vuelta', 1, '2026-10-26', '2027-01-16', 'EN_PROGRESO', 1500.00, 150.00, 3),
       ('Apertura 2026 Femenil', 'Inscripciones abiertas',       2, '2026-11-16', '2027-02-06', 'EN_INSCRIPCION', 1200.00, 150.00, 3);

INSERT INTO equipos (nombre, delegado, telefono) VALUES
 ('Tigres del Norte',  'Luis Ramírez',  '5512345601'),
 ('Águilas FC',        'Mario Soto',    '5512345602'),
 ('Deportivo Neza',    'Pedro Cruz',    '5512345603'),
 ('Halcones United',   'Jorge Díaz',    '5512345604'),
 ('Pantera Rosa FC',   'Sofía Mena',    '5512345605'),
 ('Las Guerreras',     'Ana López',     '5512345606'),
 ('Neza Queens',       'Paola Ruiz',    '5512345607');

-- Torneo 1 (Varonil): 4 equipos. Torneo 2 (Femenil): 3 equipos, solo Pantera Rosa ya pagó.
INSERT INTO inscripciones (torneo_id, equipo_id) VALUES (1,1),(1,2),(1,3),(1,4),(2,5),(2,6),(2,7);

INSERT INTO pagos (equipo_id, concepto, inscripcion_id, monto, metodo_pago, estado, fecha_pago, cobrado_por) VALUES
 (1,'INSCRIPCION',1,1500,'EFECTIVO','CUBIERTO','2026-10-21 11:00:00',1),
 (2,'INSCRIPCION',2,1500,'TRANSFERENCIA','CUBIERTO','2026-10-21 12:30:00',1),
 (3,'INSCRIPCION',3,1500,'EFECTIVO','CUBIERTO','2026-10-22 10:15:00',1),
 (4,'INSCRIPCION',4,1500,'TARJETA','CUBIERTO','2026-10-22 16:40:00',1),
 (5,'INSCRIPCION',5,1200,'EFECTIVO','CUBIERTO','2026-11-02 09:30:00',1);
-- Las Guerreras y Neza Queens quedan PENDIENTE_PAGO: sirven para probar el cobro de inscripción.

-- 5 jugadores por equipo varonil (ids 1-5 Tigres, 6-10 Águilas, 11-15 Neza, 16-20 Halcones)
INSERT INTO jugadores (equipo_id, nombre, apellido_paterno, apellido_materno, numero_camiseta, posicion) VALUES
 (1,'Andrés','Vega','Lara',1,'PORTERO'),(1,'Iván','Torres','Mena',4,'DEFENSA'),(1,'Diego','Núñez','Rosas',8,'MEDIO'),(1,'Raúl','Pineda','Gil',9,'DELANTERO'),(1,'Omar','Salas','Ibarra',11,'DELANTERO'),
 (2,'Hugo','Mora','Páez',1,'PORTERO'),(2,'Sergio','Lara','Cano',3,'DEFENSA'),(2,'Esteban','Rojas','Vidal',6,'MEDIO'),(2,'Kevin','Ortiz','Luna',10,'DELANTERO'),(2,'Aldo','Reyes','Mejía',7,'DELANTERO'),
 (3,'Tomás','Báez','Ruiz',1,'PORTERO'),(3,'Joel','Campos','Ávila',5,'DEFENSA'),(3,'Mauro','Silva','Peña',8,'MEDIO'),(3,'Erik','Duarte','Soto',9,'DELANTERO'),(3,'Fabián','Ponce','Vera',10,'DELANTERO'),
 (4,'Nicolás','Herrera','Cruz',1,'PORTERO'),(4,'Bruno','Aguilar','Mata',2,'DEFENSA'),(4,'Leo','Cortés','Nava',6,'MEDIO'),(4,'Ramiro','Zamora','Tapia',9,'DELANTERO'),(4,'Gael','Pacheco','Ríos',11,'DELANTERO');
-- Plantilla femenil (ids 21-26), todavía sin huella
INSERT INTO jugadores (equipo_id, nombre, apellido_paterno, apellido_materno, numero_camiseta, posicion) VALUES
 (5,'Valeria','Cruz','Ortega',1,'PORTERO'),(5,'Daniela','Soto','Ramos',7,'DELANTERO'),(5,'Karen','Lugo','Pérez',10,'MEDIO'),
 (6,'Mariana','Díaz','Flores',1,'PORTERO'),(6,'Fernanda','Ríos','Salas',9,'DELANTERO'),(7,'Ximena','Torres','Gil',5,'DEFENSA');

-- Huellas registradas (jugadores 1-4, 6-9, 11-14, 16-19; el 5, 10, 15 y 20 quedan "sin huella")
INSERT INTO huellas_biometricas (jugador_id, plantilla, registrado_por)
SELECT id, UNHEX(SHA2(CONCAT('demo-', id), 256)), 1 FROM jugadores WHERE id <= 20 AND id NOT IN (5,10,15,20);

-- Calendario Varonil, todos contra todos: J1 ya jugada (26-oct), J2 es HOY (2-nov), J3 el 9-nov
INSERT INTO jornadas (torneo_id, numero, fecha_inicio, fecha_fin) VALUES
 (1,1,'2026-10-26','2026-10-26'),(1,2,'2026-11-02','2026-11-02'),(1,3,'2026-11-09','2026-11-09');

INSERT INTO partidos (jornada_id, cancha_id, fecha, hora_inicio, hora_fin, equipo_local_id, equipo_visitante_id, arbitro_id) VALUES
 (1,1,'2026-10-26','10:00','11:00',1,2,2),
 (1,2,'2026-10-26','10:00','11:00',3,4,2),
 (2,1,'2026-11-02','10:00','11:00',1,3,2),
 (2,2,'2026-11-02','10:00','11:00',2,4,2),
 (3,1,'2026-11-09','10:00','11:00',1,4,2),
 (3,2,'2026-11-09','10:00','11:00',2,3,2);

-- Arbitrajes: J1 pagada por ambos equipos; J2: partido 3 con 1/2 pagos (cédula BLOQUEADA) y partido 4 con 2/2 (listo para abrir)
INSERT INTO pagos (equipo_id, concepto, partido_id, monto, estado, fecha_pago, cobrado_por) VALUES
 (1,'ARBITRAJE',1,150,'CUBIERTO','2026-10-26 09:30:00',1),(2,'ARBITRAJE',1,150,'CUBIERTO','2026-10-26 09:32:00',1),
 (3,'ARBITRAJE',2,150,'CUBIERTO','2026-10-26 09:35:00',1),(4,'ARBITRAJE',2,150,'CUBIERTO','2026-10-26 09:40:00',1),
 (1,'ARBITRAJE',3,150,'CUBIERTO','2026-11-02 09:15:00',1),
 (2,'ARBITRAJE',4,150,'CUBIERTO','2026-11-02 09:20:00',1),(4,'ARBITRAJE',4,150,'CUBIERTO','2026-11-02 09:22:00',1);
INSERT INTO pagos (equipo_id, concepto, descripcion, monto, estado, fecha_pago, cobrado_por)
VALUES (4,'MULTA','Retardo en presentación del equipo',100,'CUBIERTO','2026-10-26 10:15:00',1);

-- Pase de lista biométrico de la jornada 1 (HU-01). Los 4 sin huella no coinciden y quedan bloqueados.
INSERT INTO pase_lista (partido_id, jugador_id, equipo_id, resultado, metodo, tiempo_ms, validado_por, validado_en)
SELECT p.id, j.id, j.equipo_id,
       IF(j.id IN (5,10,15,20), 'HUELLA_NO_COINCIDE', 'AUTORIZADO'), 'HUELLA',
       900 + (j.id * 137) % 1700, 3, CONCAT(p.fecha, ' 09:45:00')
FROM partidos p JOIN jugadores j ON j.equipo_id IN (p.equipo_local_id, p.equipo_visitante_id)
WHERE p.id IN (1, 2);

-- Jornada 1 jugada de verdad pasando por los procedimientos (así se calculan solos tabla y suspensiones)
CALL sp_iniciar_cedula(1);
INSERT INTO eventos_partido (partido_id, equipo_id, jugador_id, tipo, minuto) VALUES
 (1,1,4,'GOL',12),(1,1,4,'GOL',33),(1,2,9,'GOL',45),(1,1,3,'AMARILLA',20),(1,2,8,'AMARILLA',50);
CALL sp_cerrar_cedula(1);

CALL sp_iniciar_cedula(2);
INSERT INTO eventos_partido (partido_id, equipo_id, jugador_id, tipo, minuto) VALUES
 (2,3,14,'GOL',8),(2,4,19,'GOL',22),(2,4,19,'GOL',40),(2,3,12,'ROJA',55);
CALL sp_cerrar_cedula(2);
-- Resultado: Tigres 2-1 Águilas, Halcones 2-1 Neza; Joel Campos (Neza) suspendido por roja.
-- Ver 03_codegol_pruebas.sql para probar el resto de las reglas.
