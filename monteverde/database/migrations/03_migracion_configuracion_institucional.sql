-- =============================================================================
-- Migración 03: Persistencia de Configuración Institucional en Base de Datos
-- Proyecto: Sistema de Gestión Académica MonteVerde
-- Motor: MySQL / MariaDB
-- =============================================================================

START TRANSACTION;

-- 1. Crear tabla configuracion_institucional si no existe
CREATE TABLE IF NOT EXISTS `configuracion_institucional` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `institucion_id` VARCHAR(50) NOT NULL DEFAULT 'MONTEVERDE_DEFAULT',
  `nombre_institucion` VARCHAR(150) NOT NULL DEFAULT 'Colegio MonteVerde',
  `director` VARCHAR(150) NOT NULL DEFAULT 'Fernando MonteVerde',
  `anio_escolar` VARCHAR(20) NOT NULL DEFAULT '2026',
  `periodo_actual` VARCHAR(50) NOT NULL DEFAULT 'Primer Trimestre',
  `direccion` VARCHAR(255) NULL DEFAULT 'Calle de la Arboleda #45, Ciudad Jardín',
  `telefono` VARCHAR(50) NULL DEFAULT '+57 (601) 456-7890',
  `email_contacto` VARCHAR(150) NULL DEFAULT 'contacto@monteverde.edu.co',
  `activa` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `usuario_actualizo_id` INT NULL,
  CONSTRAINT `uq_config_institucion_id` UNIQUE (`institucion_id`),
  CONSTRAINT `fk_config_usuario_actualizo` FOREIGN KEY (`usuario_actualizo_id`) 
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Sembrado inicial idempotente: insertar únicamente si no existe registro
INSERT INTO `configuracion_institucional` 
  (`institucion_id`, `nombre_institucion`, `director`, `anio_escolar`, `periodo_actual`, `direccion`, `telefono`, `email_contacto`, `activa`)
SELECT 
  'MONTEVERDE_DEFAULT', 
  'Colegio MonteVerde', 
  'Fernando MonteVerde', 
  '2026', 
  'Primer Trimestre', 
  'Calle de la Arboleda #45, Ciudad Jardín', 
  '+57 (601) 456-7890', 
  'contacto@monteverde.edu.co', 
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `configuracion_institucional` WHERE `institucion_id` = 'MONTEVERDE_DEFAULT'
);

COMMIT;
