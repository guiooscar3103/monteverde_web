# Migraciones SQL Manuales — MonteVerde School

Este directorio contiene los scripts SQL manuales y versionados para la base de datos de producción (MySQL / MariaDB).

> **Nota para desarrollo y testing:**  
> En entornos de desarrollo local y pruebas unitarias/integración con SQLite, `db.create_all()` en `app.py` crea y sincroniza automáticamente las tablas necesarias.

---

## Orden de Ejecución en Producción:

1. **Esquema Base**:
   - Archivo: `database/monteverde_db.sql`
   - Tablas base iniciales: `usuarios`, `cursos`, `estudiantes`, `asistencia`, `calificaciones`, `mensajes`, `observaciones`.

2. **Migración 01 — Sistema de Evaluación por Bimestres e Indicadores**:
   - Archivo: `database/migrations/01_migracion_bimestres.sql`
   - Crea: `bimestres_config`, `indicadores_logro`, `calificaciones_bimestre`.

3. **Migración 02 — Módulo de Tareas Académicas y Entregas**:
   - Archivo: `database/migrations/02_migracion_tareas.sql`
   - Crea: `tareas`, `entregas`.
   - Claves foráneas:
     - `tareas.docente_id` -> `usuarios.id`
     - `tareas.curso_id` -> `cursos.id`
     - `tareas.materia_id` -> `materias.id`
     - `entregas.tarea_id` -> `tareas.id`
     - `entregas.estudiante_id` -> `estudiantes.id`
