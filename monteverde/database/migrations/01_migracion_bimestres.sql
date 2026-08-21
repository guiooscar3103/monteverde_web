-- ============================================================
-- Migración 01: Sistema de evaluación por indicadores y bimestres
-- Versión: 1.0 — Monteverde School
-- ============================================================

-- Tabla de bimestres académicos
CREATE TABLE IF NOT EXISTS `bimestres_config` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `anio` INT(4) NOT NULL,
  `orden` INT(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bimestre_anio_orden` (`anio`, `orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Datos iniciales para el año en curso
INSERT IGNORE INTO `bimestres_config` (`nombre`, `anio`, `orden`) VALUES
  ('Bimestre 1', YEAR(NOW()), 1),
  ('Bimestre 2', YEAR(NOW()), 2),
  ('Bimestre 3', YEAR(NOW()), 3),
  ('Bimestre 4', YEAR(NOW()), 4);

-- Tabla de indicadores de logro
CREATE TABLE IF NOT EXISTS `indicadores_logro` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `docente_id` INT(11) NOT NULL,
  `curso_id` INT(11) NOT NULL,
  `materia_id` INT(11) NOT NULL,
  `bimestre_id` INT(11) NOT NULL,
  `numero` TINYINT(1) NOT NULL COMMENT '1 o 2',
  `descripcion` VARCHAR(500) NOT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_indicador_docente_curso_materia_bimestre_num`
    (`docente_id`, `curso_id`, `materia_id`, `bimestre_id`, `numero`),
  CONSTRAINT `ck_indicador_numero` CHECK (`numero` IN (1, 2)),
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bimestre_id`) REFERENCES `bimestres_config` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla de notas parciales por indicador
CREATE TABLE IF NOT EXISTS `calificaciones_bimestre` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` INT(11) NOT NULL,
  `docente_id` INT(11) NOT NULL,
  `indicador_id` INT(11) NOT NULL,
  `numero_nota` TINYINT(1) NOT NULL COMMENT '1, 2 o 3',
  `nota` DECIMAL(3,2) NOT NULL,
  `fecha_registro` TIMESTAMP NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_calif_bimestre_estudiante_indicador_nota`
    (`estudiante_id`, `indicador_id`, `numero_nota`),
  CONSTRAINT `ck_numero_nota` CHECK (`numero_nota` IN (1, 2, 3)),
  CONSTRAINT `ck_nota_rango`  CHECK (`nota` >= 0.00 AND `nota` <= 5.00),
  FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`docente_id`)    REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`indicador_id`)  REFERENCES `indicadores_logro` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
