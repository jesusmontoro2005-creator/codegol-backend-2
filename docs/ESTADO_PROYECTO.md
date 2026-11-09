# Estado del proyecto CODEGOL

Nota de continuidad para retomar el trabajo en sesiones posteriores. Actualizada el 7 de noviembre de 2026.

## Ubicación y entorno

- Repositorio de trabajo: `api/` (Spring Boot) con el frontend React/Vite en `api/frontend/`.
- Backend: Spring Boot 3.3, Java 21, Hibernate/JPA y MariaDB/MySQL.
- Frontend compilado dentro de `src/main/resources/static`; desde `frontend`, ejecutar `npm run build` después de cambios del front.
- Entorno del lector: Windows 10 x64 y DigitalPersona U.are.U 4500. El driver HID Non-WBF está instalado y Windows detecta el lector. El navegador también requiere HID Authentication Device Client para la comunicación local.

## Funcionalidad implementada

### Acceso y panel

- Inicio de sesión y registro de usuarios con roles.
- Panel administrativo con módulos de torneos, equipos, jugadores, calendario, partidos, estadísticas y finanzas.

### Torneos, categorías y equipos

- Las categorías pueden desactivarse y reactivarse; los torneos existentes se conservan y una categoría inactiva no se puede usar al crear torneos.
- Los torneos pueden archivarse y restaurarse. Los archivados se ocultan de las listas operativas y no admiten nuevas inscripciones ni modificaciones de calendario. No se puede archivar un torneo `EN_PROGRESO`; primero debe finalizarse o cancelarse.
- Los equipos se pueden borrar junto con sus jugadores si no tienen partidos, estadísticas ni pagos asociados. Si existe historial financiero o deportivo, la API bloquea el borrado para conservarlo.
- La base existente necesita la migración `db/08_archivo_torneos.sql`, que debe ejecutarse una sola vez si aún no se ha aplicado.

### Jugadores y huellas

- El módulo Jugadores tiene entidad, repositorio, servicio, DTOs y controlador propios.
- El alta de jugador y huella se guarda en una transacción. El front captura tres muestras del mismo dedo con el Web SDK de DigitalPersona.
- Si se elimina un jugador sin historial, se borra físicamente. Si ya tiene pases de lista o eventos, se desactiva y se excluye de plantillas activas; el historial queda conservado y se elimina la plantilla biométrica. También se liberan dorsal y CURP para la plantilla activa.
- El último error durante esta operación fue un tipo incorrecto de retorno: una consulta `EXISTS` de MySQL devuelve `0/1` como `Integer`, no `Boolean`. El repositorio ya expone `Integer` y el servicio compara con `1`.
- La biometría usa SourceAFIS en backend. Las plantillas generadas se guardan cifradas con AES-256-GCM; las imágenes originales no se persisten.
- La clave debe configurarse como variable de entorno `CODEGOL_BIOMETRIA_KEY`, Base64 de 32 bytes, y Eclipse debe reiniciarse para heredarla.
- Endpoint de identificación: `POST /api/biometria/identificar`, protegido con token de administrador, árbitro o mesa de control. La APK enviará la muestra a este endpoint; no descargará la base biométrica.

## Estado de la comparación biométrica

- Ya existe identificación 1:N desde el backend contra plantillas de jugadores activos.
- Umbral inicial `40` y margen `10` configurados como parámetros de arranque; aún no están calibrados con datos representativos del lector/población de CODEGOL.
- **Pendiente recomendado:** verificar capturas duplicadas durante el alta comparándolas con jugadores activos. Si aparece una coincidencia probable, pedir una segunda captura/revisión antes de rechazar, hasta medir falsos avisos.
- **Pendiente antes de uso operativo:** reunir muestras voluntarias y medir falsos positivos y falsos rechazos; luego ajustar umbral/margen y probar tiempos de identificación.
- La APK todavía no forma parte del repositorio/proyecto actual.

## Migraciones y arranque

Para una base ya migrada y extendida, seguir `db/LEEME_MIGRACION.md`; las migraciones biométricas y de archivo son `07_huellas_sourceafis.sql` y `08_archivo_torneos.sql`. No volver a ejecutar scripts iniciales que recrean la base.

No usar `spring.jpa.hibernate.ddl-auto=create` ni `create-drop`; el proyecto valida el esquema. Antes de iniciar desde Eclipse, confirmar que las migraciones requeridas estén aplicadas y que `CODEGOL_BIOMETRIA_KEY` esté disponible.

## Verificación reciente

- Backend: `mvn -DskipTests compile` terminó correctamente después de los cambios de gestión y de eliminación de jugadores.
- Frontend: `npm run build --cache .npm-cache` terminó correctamente después de los cambios de interfaz.
- No se ejecutaron pruebas de integración ni se validó el flujo con un lector conectado en esta sesión.

## Siguiente punto sugerido

Implementar la detección de duplicados biométricos al registrar un jugador, con respuesta clara para revisión y sin exponer puntajes biométricos al cliente. Después preparar un conjunto voluntario de pruebas para calibrar 1:1 y 1:N antes de conectar la APK.

Más detalle de integración y endpoints: `docs/BIOMETRIA.md` y `docs/CONTRATO_API.md`.
