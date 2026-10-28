# ⚽ CODEGOL - Sistema Integral de Gestión para Torneos de Fútbol

Plataforma multiplataforma diseñada para la administración de torneos deportivos, control financiero, arbitraje en tiempo real y validación biométrica de jugadores mediante IoT. Proyecto desarrollado para la **Universidad Tecnológica de Nezahualcóyotl (UTN)**[cite: 1].

---

## 🚀 Arquitectura y Tecnologías del Sistema

El sistema está compuesto por una arquitectura modular dividida en tres flancos principales:
- **Backend (API REST Centralizada):** Java 17+, Spring Boot 3.x, Spring Security + JWT, Spring Data JPA (Hibernate)[cite: 1].
- **Frontend Web / Panel Administrativo:** React.js (Vite) para gestión de torneos, control de caja y portal público de estadísticas[cite: 1].
- **Aplicación Móvil (Árbitros / Mesa de Control):** Kotlin (Android) con lectura biométrica dactilar (anti-cachirules) y cédula arbitral en vivo[cite: 1].
- **Base de Datos Relacional:** MySQL / MariaDB[cite: 1].

---

## 📂 Estructura del Proyecto (Backend)

El backend sigue una arquitectura limpia orientada a dominios funcionales:
```text
src/main/java/com/codegol/api/
├── common/             # Excepciones globales, entidades base de auditoría y DTOs generales
├── config/             # Configuraciones de seguridad (SecurityConfig), CORS y Swagger
└── modules/            # Módulos de dominio de la aplicación:
    ├── auth/           # Autenticación, Usuarios y Roles (ADMINISTRADOR, ARBITRO, JUGADOR)
    ├── torneos/        # Gestión de Torneos, Categorías y Equipos (HU-04)
    ├── jugadores/      # Registro y validación biométrica (HU-01)
    ├── partidos/       # Cédula arbitral en vivo (HU-02)
    ├── estadisticas/   # Tablas generales, goleo y recálculo automático (HU-03 & HU-06)
    └── finanzas/       # Control de pagos de inscripción y arbitraje (HU-05)