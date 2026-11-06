# Contrato API del calendario (HU-04)

Todos los endpoints usan el prefijo `/api`. Las mutaciones requieren un token de administrador; el listado de partidos es público para la consulta de torneos.

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/canchas` | Canchas activas disponibles para programar |
| `GET` | `/partidos?torneoId={id}` | Partidos de un torneo, enriquecidos con nombres y cobertura de arbitraje |
| `POST` | `/partidos` | Crear un partido manual |
| `PUT` | `/partidos/{id}` | Reprogramar o asignar/quitar árbitro de un partido programado |
| `DELETE` | `/partidos/{id}` | Eliminar un partido programado sin pagos asociados |
| `POST` | `/torneos/{id}/calendario` | Reemplazar el calendario programado por una o dos vueltas |
| `DELETE` | `/torneos/{id}/calendario` | Quitar partidos programados sin pagos asociados |
| `POST` | `/jugadores/{id}/huella` | Administrador registra o reemplaza tres capturas PNG del dedo seleccionado |
| `POST` | `/jugadores/con-huella` | Administrador crea perfil y registra huella en una transacción |
| `POST` | `/biometria/identificar` | Administrador, árbitro o mesa identifica una muestra PNG contra las huellas registradas |

La generación recibe `fechaInicio`, `diasEntreJornadas`, `horarios` (`HH:mm`), `duracionMin`, `canchaIds` y `dobleVuelta`; `jornadaInicial` es opcional y por defecto es 1. Devuelve `{ creados, sinLugar }`, donde `sinLugar` identifica cruces que no cupieron en los horarios/canchas elegidos.

El servidor valida torneo abierto y fechas, cancha activa, equipos del torneo con inscripción pagada, partidos con horas válidas y ausencia de traslapes de cancha/equipo. Las escrituras bloquean el torneo y los recursos involucrados en orden estable dentro de una transacción para evitar dobles reservas simultáneas. Los partidos cancelados liberan su horario. Los partidos con pagos asociados no se eliminan ni se reemplazan.

Para bases ya preparadas con `03_migrar_codegol_db_a_codegol.sql` y `04_extender_codegol_para_front.sql`, ejecutar una sola vez `db/06_calendario_indices.sql`. En una base nueva creada con `01_codegol_schema.sql`, los índices necesarios ya están definidos y el script 06 es idempotente.
