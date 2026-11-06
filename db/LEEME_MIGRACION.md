# Preparar `codegol` en MariaDB

La base `codegol_db` se conserva intacta. Los siguientes pasos crean una copia llamada `codegol` y luego agregan las tablas que requiere el front.

## Antes de importar

1. En phpMyAdmin exporta un respaldo de `codegol_db`.
2. Confirma que `codegol` todavía no exista. El primer script es de una sola ejecución y fallará si ya existe; no borres una base existente para volver a correrlo.
3. En phpMyAdmin selecciona la pestaña **SQL** del servidor (sin seleccionar una base) y ejecuta `03_migrar_codegol_db_a_codegol.sql`.
4. Selecciona la nueva base `codegol`, abre la pestaña **SQL** y ejecuta `04_extender_codegol_para_front.sql`.
5. Ejecuta `06_calendario_indices.sql` sobre `codegol`. Es idempotente y no cambia los partidos ni sus resultados; retira un índice antiguo que impedía reutilizar horarios cancelados y crea índices de consulta.
6. Ejecuta `07_huellas_sourceafis.sql` sobre `codegol`. Es idempotente; marca los registros biométricos anteriores como heredados para que no se confundan con plantillas capturadas por el motor actual.
7. Revisa que `codegol` tenga al menos las 16 tablas: `categorias`, `torneos`, `equipos`, `usuarios`, `canchas`, `inscripciones`, `jugadores`, `huellas_biometricas`, `jornadas`, `partidos`, `pase_lista`, `eventos_partido`, `tabla_posiciones`, `suspensiones`, `pagos` y `recibos`.

El clon mantiene las columnas originales de `categorias`, `torneos`, `equipos` y `usuarios`. La migración añade a `torneos` las cuotas, el límite de amarillas y la descripción de hasta 500 caracteres, y habilita el rol `ROLE_MESA_CONTROL`. Los valores copiados se conservan. Las tablas operativas nuevas empiezan vacías, salvo las inscripciones de los equipos ya existentes y tres canchas de ejemplo.

## Configurar y arrancar

En `src/main/resources/application.properties`, configura usuario y contraseña de MariaDB en `spring.datasource.username` y `spring.datasource.password`. La URL actual apunta a `localhost:3306/codegol`. No uses `spring.jpa.hibernate.ddl-auto=create` ni `create-drop`.

Después inicia Spring Boot desde Eclipse. La compilación del front ya está configurada para dejar la página en los recursos estáticos de Spring; si cambias el front, desde `frontend` ejecuta `npm run build`. Con Spring activo, abre `http://localhost:8080/`.

El calendario consume `/api/canchas`, `/api/partidos` y `/api/torneos/{id}/calendario`. La lectura de partidos es pública para el portal; crear, reprogramar, eliminar y generar calendarios requiere iniciar sesión como administrador. Consulta `docs/CONTRATO_API.md` para el contrato de las operaciones.

En **Jugadores**, un administrador puede capturar tres muestras PNG por jugador con el lector U.are.U 4500. La comparación 1:N corre en el backend con SourceAFIS; la identificación requiere un token de administrador, árbitro o mesa de control. Consulta `docs/BIOMETRIA.md`; el umbral inicial debe calibrarse con muestras reales del torneo antes de usar la respuesta como única decisión de acceso.

El primer registro de usuario debe ser el administrador inicial. Los siguientes usuarios se crean con sesión administrativa. Para probar funciones del panel y guardar datos, inicia sesión contra el backend y verifica que no aparezca el indicador de modo demostración.

Si no puedes iniciar sesión con una cuenta de `codegol`, ejecuta opcionalmente `05_crear_o_restablecer_admin.sql` desde phpMyAdmin seleccionando `codegol`. Crea o restablece `admin` / `codegol123`; cambia esa contraseña después de entrar.

## Alcance operativo

Jugadores, equipos, torneos, calendario, cobros y reportes se guardan/leen por la API y MariaDB. El registro biométrico real requiere el lector y la APK de campo; el navegador solo muestra las huellas y eventos que dicha terminal sincronice. La sincronización del marcador/eventos desde la APK requiere que esa aplicación use la API correspondiente.

