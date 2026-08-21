-- ============================================================
-- Migración 02: Módulo de Tareas Académicas y Entregas
-- Versión: 1.0 — MonteVerde School
-- Ejecutar en producción (MySQL/MariaDB).
-- En desarrollo/testing, db.create_all() crea estas tablas automáticamente.
-- ============================================================

-- Tabla de Tareas
CREATE TABLE IF NOT EXISTS `tareas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_vencimiento` DATETIME NOT NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'PUBLICADA',
  `docente_id` INT(11) NOT NULL,
  `curso_id` INT(11) NOT NULL,
  `materia_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tarea_docente_curso_materia` (`docente_id`, `curso_id`, `materia_id`),
  INDEX `idx_tarea_vencimiento` (`fecha_vencimiento`),
  INDEX `idx_tarea_estado` (`estado`),
  CONSTRAINT `ck_tarea_estado` CHECK (`estado` IN ('BORRADOR', 'PUBLICADA', 'CERRADA')),
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla de Entregas
CREATE TABLE IF NOT EXISTS `entregas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` INT(11) NOT NULL,
  `estudiante_id` INT(11) NOT NULL,
  `fecha_entrega` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `archivo_url` VARCHAR(255) NULL,
  `contenido` TEXT NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  `calificacion` DECIMAL(3,2) NULL,
  `comentarios` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tarea_estudiante` (`tarea_id`, `estudiante_id`),
  INDEX `idx_entrega_tarea_estudiante` (`tarea_id`, `estudiante_id`),
  INDEX `idx_entrega_estado` (`estado`),
  CONSTRAINT `ck_entrega_estado` CHECK (`estado` IN ('PENDIENTE', 'ENTREGADA', 'CALIFICADA')),
  CONSTRAINT `ck_entrega_calificacion` CHECK (`calificacion` IS NULL OR (`calificacion` >= 0.00 AND `calificacion` <= 5.00)),
  FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
