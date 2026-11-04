# Nombre del proyecto: CODEGOL
***
## DESCRIPCION
CODEGOL es una solución tecnológica integral de gestión deportiva diseñada para digitalizar, automatizar y optimizar la administración completa de un complejo de canchas de fútbol. El sistema resuelve problemáticas comunes como el suplantamiento de identidad de jugadores ("cachirules"), el retraso en el cálculo manual de estadísticas de torneos y la falta de control financiero en caja y cobro de arbitrajes.

## OBJETIVO
Desarrollar una aplicación web para la gestión integral de complejos de fútbol que automatice las estadísticas de torneos, valide la identidad de los jugadores y optimice el control financiero de caja y arbitrajes.

## PILA TECNÓLOGICA
+ Frontend Web: React.js (HTML5, CSS3, JavaScript/TypeScript) para una interfaz dinámica y reactiva.
+ Backend / API: Java (Spring Boot) para una arquitectura de microservicios o API REST robusta, segura y escalable.
+ Aplicación Móvil: Kotlin (Android Studio) para la integración directa con SDKs de hardware biométrico IoT
+ Base de Datos: MySQL / MariaDB para almacenamiento relacional estructurado.
+ Lector Biométrico / Hardware: Lectores biométricos dactilares USB/OTG o integrados compatibles con SDK Android.

## FUNCIONALIDADES
- [ ] GESTION DE TORNEOS Y CALENDARIOS
- [ ] CONTROL DE ACCESO E IDENTIDAD BIOMETRICA
- [ ] CEDULA ARBITRAL EN VIVO Y ESTADISTICAS
- [ ] MODULO FINANCIERO Y PUNTO DE VENTA
- [ ] PORTAL PUBLICO WEB

## EQUIPO DE DESARROLLO
+ SM: Valverde Meneses Irving Emmanuel
+ DT1: Bautista Moreno Giovanna Sahori
+ DT2: Montoro Pérez Jesús
+ DT3:Zambrano Mendoza Leslie Itzel

## FECHA
* SPRINT 1: 2 de octubre 2026 - 16 de octubre 2026 
* SPRINT 2: 19 octubre 2026 - 2 de noviembre 2026
* SPRINT 3: 9 noviembre 2026 - 23 de noviembre 2026

---

## ESTADO DEL PROYECTO (SEGUNDO PARCIAL)
| Módulo | Responsable | Estado |
|---|---|---|
| Frontend web: panel administrativo y portal público (React + Vite + PrimeReact) | DT1 Giovanna Bautista | Terminado para el parcial. Funciona con el backend o en **modo demostración** (datos de ejemplo guardados en el navegador) cuando el backend aún no responde |
| Base de datos MySQL/MariaDB (`db/`) | Equipo | Esquema, datos de prueba y escenarios probados (ver abajo) |
| Backend / API Spring Boot | Equipo | En desarrollo. El contrato de endpoints está en `docs/CONTRATO_API.md` |
| APK Android con lector de huella | Equipo | En desarrollo (HU-01 y HU-02). El panel web ya muestra su resultado (pase de lista y cédula) |

## HISTORIAS DE USUARIO, TAREAS Y CRITERIOS DE ACEPTACIÓN
Las tareas llevan entre paréntesis sus story points. ✅ = hecha en el incremento actual · ⏳ = pendiente (backend/APK).

### HU-01 · Control de Acceso / Biometría IoT — Alta · 24 pts · Sprint 2 · Encargado: Jesús Montoro Pérez
**Como** administrador o mesa de control, **quiero** registrar y escanear la huella dactilar de un jugador al darlo de alta en su equipo, **para** asegurar su identidad real y evitar "cachirules".

**Criterios de aceptación**
1. *Registro exitoso:* dado que se da de alta a un jugador, cuando se escanea su huella, entonces el sistema asocia y guarda la plantilla única a su perfil.
2. *Validación y pase de lista:* dado que se pasa lista antes del partido, cuando un jugador autorizado coloca su huella, entonces se autentica en menos de 3 segundos y se muestran su foto y datos.
3. *Bloqueo:* cuando la huella no coincide o el jugador tiene suspensión vigente, entonces se emite una alerta visual y se impide su alineación.

**Tareas:** ⏳ 1. Integrar el SDK/driver del lector (8) · ✅ 2. Estructura de almacenamiento de plantillas en la BD, tabla `huellas_biometricas` (8) · ⏳ 3. Algoritmo de coincidencia <3 s (5) · ✅ 4. Bloqueo visual por suspensión o no coincidencia, visible en la cédula del panel (5) · ⏳ 5. Pruebas de campo con lector físico (3).

### HU-02 · Cédula Arbitral Digital (APK) — Alta · 24 pts · Sprint 3 · Encargada: Leslie Zambrano Mendoza
**Como** árbitro o personal de mesa, **quiero** usar la APK en la cancha para registrar goles, tarjetas y faltas en tiempo real, **para** eliminar hojas de papel.

**Criterios de aceptación**
1. *Partidos asignados:* al iniciar sesión se muestran únicamente los partidos de su cancha en la fecha actual.
2. *Registro rápido:* con la cédula abierta, el evento (gol, tarjeta, falta, cambio) se registra con un toque en la cédula.
3. *Cierre y sincronización:* al cerrar la cédula se guarda el marcador definitivo y se sincroniza con el servidor web.

**Tareas:** ⏳ 1. Diseñar la arquitectura móvil Android/Kotlin de la APK (8) · ⏳ 2. Pantallas móviles para registrar goles, tarjetas y faltas con un toque (5) · ✅ 3. Filtro de partidos por cancha y fecha: el panel web ya muestra los partidos del día y el árbitro asignado (5) · ⏳ 4. Servicio de cierre de cédula y sincronización con el servidor; la vista web de la cédula ya se actualiza sola cada 15 s (3) · ⏳ 5. Pruebas de usabilidad en móviles y reconexión offline/online (3).

### HU-03 · Estadísticas y Sanciones Automáticas — Alta · 28 pts · Sprint 3 · Encargado: Irving Valverde Meneses
**Como** administrador, **quiero** que la tabla de posiciones y el goleo se actualicen automáticamente al cerrarse la cédula, **para** evitar cálculos manuales.

**Criterios de aceptación**
1. *Puntos:* al cerrar la cédula se suman 3 puntos al ganador (1 a cada uno en empate).
2. *Diferencia de goles:* se recalcula al procesar la cédula y se refleja en el portal público.
3. *Suspensión:* el jugador que acumula el límite de amarillas (configurable por torneo, 3 por defecto) o recibe roja directa queda bloqueado para la siguiente jornada.

**Tareas:** ✅ 1. Tablas de posiciones, tarjetas y goleo en la BD (vistas `v_tabla_general`, `v_goleadores`, `v_jugadores_suspendidos`) (8) · ✅ 2. Suma automática de puntos, procedimiento `sp_cerrar_cedula` (8) · ✅ 3. Diferencia de goles (columna generada `dg`) y vista en el panel y el portal (5) · ✅ 4. Suspensión automática por amarillas o roja (5) · ✅ 5. Pruebas de cálculo y reglas en `db/03_codegol_pruebas.sql` (3).

### HU-04 · Gestión de Torneos y Calendarios — Alta · 16 pts · Sprint 1 · Encargado: Jesús Montoro Pérez
**Como** administrador general, **quiero** crear torneos por categorías y generar automáticamente el rol de juegos con canchas y horarios, **para** evitar traslapes.

**Criterios de aceptación**
1. *Torneo y categorías:* el administrador define nombre, fecha de inicio y categoría (varonil, femenil, mixto, libre); el sistema crea el torneo y lo habilita para inscripción de equipos.
2. *Calendario automático:* con los equipos inscritos, "Generar calendario" distribuye los partidos por jornada respetando canchas y horarios.
3. *Traslapes:* si se asigna manualmente una cancha, horario o equipo ya ocupado, el sistema muestra una advertencia y no guarda.

**Tareas:** ✅ 1. Formularios de alta de torneos y categorías, inscripción de equipos con validaciones (5) · ✅ 2. Generación automática del rol de juegos por jornadas, ida o ida y vuelta (5) · ✅ 3. Validación y alertas de traslapes de cancha y de equipo (3) · ✅ 4. Pruebas de generación con varios torneos y canchas (3).

### HU-05 · Módulo Financiero y POS — Media · 21 pts · Sprint 4 · Encargada: Leslie Zambrano Mendoza
**Como** administrador general, **quiero** registrar los cobros de inscripciones y arbitrajes por jornada, **para** llevar un control contable transparente.

**Criterios de aceptación**
1. *Inscripción:* al ingresar el pago, el sistema emite un recibo digital (folio `CG-xxxxxx`) y el equipo pasa a "Inscrito/Activo".
2. *Arbitraje previo al juego:* la cédula solo puede iniciarse si el pago de arbitraje figura como "Cubierto" (ambos equipos pagaron).
3. *Reporte financiero:* al filtrar por fechas se muestra el resumen de ingresos por inscripciones, arbitrajes y multas (exportable a CSV).

**Tareas:** ✅ 1. Interfaz de cobros de inscripciones, arbitrajes y multas (8) · ✅ 2. Recibo digital imprimible / PDF (5) · ✅ 3. Regla: cédula habilitada solo con arbitraje pagado, regla en `sp_iniciar_cedula` y aviso en el panel (3) · ⏳ 4. Pruebas de integración con la APK (5).

### HU-06 · Portal Público Web — Media · 26 pts · Sprint 4 · Encargada: Giovanna Bautista Moreno
**Como** jugador o aficionado, **quiero** consultar la tabla general, el rol de juegos y el goleo desde la web pública, **para** estar informado sin iniciar sesión.

**Criterios de aceptación**
1. *Navegación libre:* al elegir torneo y categoría se muestra la tabla de posiciones sin pedir credenciales.
2. *Próximos partidos:* en la pestaña Calendario se ven los partidos por jornada con fecha, hora y cancha.
3. *Goleo:* en la pestaña Goleadores se ve el ranking de jugadores con más goles, actualizado automáticamente cada 30 s.

**Tareas:** ✅ 1. Maquetado responsive del portal público, con modo claro y oscuro (8) · ✅ 2. Consumo de la API pública de tablas y categorías sin login (5) · ✅ 3. Vista de próximos partidos por jornada con cancha y hora (5) · ✅ 4. Ranking de goleadores con actualización periódica (5) · ✅ 5. Pruebas de interfaz y usabilidad pública (3).

## CÓMO EJECUTAR EL PROYECTO
**1. Base de datos** (XAMPP + phpMyAdmin, o DBeaver). Ejecutar en este orden los scripts de la carpeta `db/`:
1. `01_codegol_schema.sql` crea la base `codegol`, tablas, vistas, triggers y procedimientos (requiere MySQL 8 o MariaDB 10.4 o superior).
2. `02_codegol_seed.sql` carga los datos de prueba.
3. `03_codegol_pruebas.sql` ejecuta los escenarios de prueba. El caso del traslape de cancha **debe** terminar en error: así se comprueba la regla.

**2. Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # versión de producción en frontend/dist
```
El front busca la API en `/api` (proxy a `http://localhost:8080`, ver `vite.config.js`). Si el backend no está encendido, el panel entra en **modo demostración** y avisa con un banner azul.

**Cuentas de prueba**
| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `codegol123` | Administrador (entra al panel web) |
| `arbitro` | `codegol123` | Árbitro (opera en la APK) |
| `mesa` | `codegol123` | Mesa de control (opera en la APK) |
| `123` | `123` | Solo modo demostración, como Administrador |

Solo el rol Administrador entra al panel web; desde **Configuración › Usuarios y permisos** se cambia el rol de cualquier cuenta. El nombre de usuario se respeta exactamente como se escribe (distingue mayúsculas y minúsculas).

## REGLAS DE NEGOCIO IMPLEMENTADAS
* Victoria = 3 puntos, empate = 1. La diferencia de goles se calcula sola.
* Suspensión automática por tarjeta roja o por alcanzar el límite de amarillas del torneo.
* No se pueden programar dos partidos en la misma cancha y horario, ni al mismo equipo en dos partidos al mismo tiempo.
* Solo entran al calendario los equipos con la inscripción pagada.
* La cédula arbitral se habilita únicamente cuando los dos equipos pagaron el arbitraje del partido.
* Cada cobro genera un recibo digital con folio.

## VALIDACIONES DEL FRONTEND
Nombres solo con letras; nombre de equipo con letras y números (no solo números); teléfono de 10 dígitos; correo con formato válido; contraseña con letras y números (mínimo 6) y confirmación; usuario de 4 a 50 caracteres sin espacios; fechas no pasadas para partidos; montos entre 0 y 100,000; direcciones web válidas para logos y fotos. Los mensajes de error aparecen junto al botón y se llevan a la vista.

## ESTRUCTURA DEL REPOSITORIO
```
codegol/
├── README.md
├── db/                  scripts SQL (esquema, datos de prueba, escenarios)
├── docs/                contrato de la API, trazabilidad HU→pantallas y capturas (docs/capturas)
└── frontend/            React + Vite (src/pages: torneos, equipos, jugadores, calendario, partidos, estadisticas,
                         arbitros, finanzas, configuracion, registro, login, public-home, consulta-publica)
```

## CAPTURAS DEL INCREMENTO
Están en `docs/capturas/`: acceso (`01`), portal público (`02`–`05`), dashboard (`06`), torneos y equipos (`07`–`08`), jugadores con huella (`09`), calendario (`10`), cédula arbitral (`11`–`12`), estadísticas (`13`), árbitros (`14`), finanzas, recibo y reporte (`15`, `19`, `20`), usuarios y permisos (`16`–`17`) y validaciones (`18`).

## LIMITACIONES CONOCIDAS
* El backend (Spring Boot) y la APK Android con lector de huella siguen en desarrollo; el panel web ya está listo para consumirlos según `docs/CONTRATO_API.md`.
* El portal público no incluye una sección de reglamento porque la documentación no la pide.
