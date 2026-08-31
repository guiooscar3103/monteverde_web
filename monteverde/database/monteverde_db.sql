-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-10-2025 a las 02:20:09
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `monteverde_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia`
--

CREATE TABLE `asistencia` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('PRESENTE','AUSENTE','TARDE','JUSTIFICADO') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asistencia`
--

SET @PRESENTE = 'PRESENTE';
SET @TARDE = 'TARDE';
SET @AUSENTE = 'AUSENTE';
SET @JUSTIFICADO = 'JUSTIFICADO';

SET @FECHA_12 = '2025-10-12';
SET @FECHA_13 = '2025-10-13';
SET @FECHA_14 = '2025-10-14';
SET @FECHA_15 = '2025-10-15';
SET @FECHA_16 = '2025-10-16';
SET @FECHA_17 = '2025-10-17';

INSERT INTO `asistencia` (`id`, `estudiante_id`, `fecha`, `estado`) VALUES
(1, 1, @FECHA_14, @PRESENTE),
(2, 1, @FECHA_13, @PRESENTE),
(3, 1, @FECHA_12, @PRESENTE),
(4, 2, @FECHA_14, @TARDE),
(5, 2, @FECHA_13, @PRESENTE),
(6, 2, @FECHA_12, @AUSENTE),
(7, 3, @FECHA_14, @PRESENTE),
(8, 3, @FECHA_13, @JUSTIFICADO),
(9, 3, @FECHA_12, @PRESENTE),
(10, 5, @FECHA_14, @PRESENTE),
(11, 5, @FECHA_13, @PRESENTE),
(12, 3, @FECHA_15, @TARDE),
(13, 1, @FECHA_15, @PRESENTE),
(14, 2, @FECHA_15, @PRESENTE),
(15, 3, @FECHA_16, @TARDE),
(16, 1, @FECHA_16, @PRESENTE),
(17, 2, @FECHA_16, @PRESENTE),
(18, 3, @FECHA_17, @PRESENTE),
(19, 1, @FECHA_17, @TARDE),
(20, 2, @FECHA_17, @PRESENTE);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificaciones`
--

CREATE TABLE `calificaciones` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `asignatura` varchar(50) NOT NULL,
  `periodo` varchar(20) NOT NULL,
  `nota` decimal(3,2) NOT NULL CHECK (`nota` >= 0.00 and `nota` <= 5.00),
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `calificaciones`
--

SET @P1 = '2025-P1';
SET @P2 = '2025-P2';

SET @FECHA_REG_15 = '2025-10-15 05:00:00';
SET @FECHA_REG_17 = '2025-10-17 05:00:00';

SET @MAT = 'Matematicas';
SET @LEN = 'Lenguaje';
SET @CIE = 'Ciencias';
SET @HIS = 'Historia';
SET @ING = 'Ingles';
SET @EDF = 'Educacion_Fisica';

INSERT INTO `calificaciones` (`id`, `estudiante_id`, `asignatura`, `periodo`, `nota`, `fecha_registro`) VALUES
(10, 3, @MAT, @P1, 4.30, @FECHA_REG_15),
(11, 1, @MAT, @P1, 3.40, @FECHA_REG_15),
(12, 2, @MAT, @P1, 4.60, @FECHA_REG_15),
(13, 3, @LEN, @P1, 4.00, @FECHA_REG_15),
(14, 1, @LEN, @P1, 3.90, @FECHA_REG_15),
(15, 2, @LEN, @P1, 4.60, @FECHA_REG_15),
(16, 3, @CIE, @P1, 4.70, @FECHA_REG_15),
(17, 1, @CIE, @P1, 3.60, @FECHA_REG_15),
(18, 2, @CIE, @P1, 4.60, @FECHA_REG_15),
(19, 3, @HIS, @P1, 4.50, @FECHA_REG_15),
(20, 1, @HIS, @P1, 3.20, @FECHA_REG_15),
(21, 2, @HIS, @P1, 4.00, @FECHA_REG_15),
(22, 3, @ING, @P1, 3.20, @FECHA_REG_15),
(23, 1, @ING, @P1, 3.40, @FECHA_REG_15),
(24, 2, @ING, @P1, 5.00, @FECHA_REG_15),
(25, 3, @EDF, @P1, 4.00, @FECHA_REG_15),
(26, 1, @EDF, @P1, 4.00, @FECHA_REG_15),
(27, 2, @EDF, @P1, 5.00, @FECHA_REG_15),
(28, 3, @MAT, @P2, 3.30, @FECHA_REG_17),
(29, 1, @MAT, @P2, 4.00, @FECHA_REG_17),
(30, 2, @MAT, @P2, 4.60, @FECHA_REG_17);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `nivel` varchar(10) DEFAULT NULL,
  `letra` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id`, `nombre`, `nivel`, `letra`) VALUES
(1, 'Primero A', '1°', 'A'),
(2, 'Primero B', '1°', 'B'),
(3, 'Segundo A', '2°', 'A'),
(4, 'Tercero A', '3°', 'A'),
(5, 'Cuarto A', '4°', 'A'),
(6, 'Quinto A', '5°', 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `curso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `nombre`, `curso_id`) VALUES
(1, 'Santiago González Pérez', 1),
(2, 'Valentina López García', 1),
(3, 'Matías Rodríguez Silva', 1),
(4, 'Isabella Martínez Torres', 2),
(5, 'Lucas Jiménez Castro', 2),
(6, 'Sofía Hernández Ruiz', 3),
(7, 'Diego Santos Díaz', 3),
(8, 'Camila Torres Moreno', 4),
(9, 'Alejandro Vargas Lima', 5),
(10, 'Martina Castro Rojas', 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

CREATE TABLE `mensajes` (
  `id` int(11) NOT NULL,
  `emisor_id` int(11) NOT NULL,
  `receptor_id` int(11) NOT NULL,
  `asunto` varchar(100) NOT NULL,
  `cuerpo` text NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `leido` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes`
--

INSERT INTO `mensajes` (`id`, `emisor_id`, `receptor_id`, `asunto`, `cuerpo`, `fecha`, `leido`) VALUES
(1, 2, 4, 'Progreso Santiago', 'Santiago ha mostrado excelente progreso en matemáticas.', '2025-10-12 10:30:00', 1),
(2, 4, 2, 'Gracias por el reporte', 'Nos alegra saber del buen progreso de Santiago.', '2025-10-12 15:45:00', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `observaciones`
--

CREATE TABLE `observaciones` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `tipo` varchar(20) NOT NULL,
  `detalle` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `observaciones`
--

SET @POSITIVA = 'POSITIVA';
SET @NEUTRAL = 'NEUTRAL';

INSERT INTO `observaciones` (`id`, `estudiante_id`, `docente_id`, `fecha`, `tipo`, `detalle`) VALUES
(1, 1, 2, '2025-10-10', @POSITIVA, 'Santiago mostró excelente participación en matemáticas.'),
(2, 1, 2, '2025-10-12', @POSITIVA, 'Ayudó a sus compañeros durante el trabajo grupal.'),
(3, 2, 2, '2025-10-11', @NEUTRAL, 'Valentina necesita mejorar su atención en clase.'),
(4, 3, 2, '2025-10-08', @POSITIVA, 'Matías demostró liderazgo en el proyecto de ciencias.'),
(5, 5, 2, '2025-10-09', @POSITIVA, 'Lucas mejoró notablemente en lectura.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `rol` enum('docente','familia','admin') NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estudiante_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `rol`, `nombre`, `email`, `password`, `estudiante_id`) VALUES
(1, 'admin', 'Administrador Sistema', 'admin@monteverde.com', 'scrypt:32768:8:1$Gq7YToC5z1p7Tnz8$0a8965595cd54770a5f326a0af871f1fc98f444cccbfee4fc43ec7a39eb8261b2e10a0174c20a0cfbe78cea24ff5d0907749ea9b5a9e8890f83fbfef6ca77901', NULL),
(2, 'docente', 'María García López', 'docente@monteverde.com', 'scrypt:32768:8:1$mCEs0hmEDRVumogk$b5861d9b14aa5a760df2ae65524df275769c38c15190507b6f148bfe16b1a46a984498f10b9db016be98821f6ea20719c8239793afefdd88d58f248608396678', NULL),
(4, 'familia', 'Familia González', 'familia@monteverde.com', 'scrypt:32768:8:1$u8jutB3ErAH1DeD4$57124e0b8adbd030f39764d449875d1f7f170d0c2c89958ee775607227db344f4adefea93ba91d54ff748ba7b2d42df01bcf877061077b2069321adfb478aa27', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `estudiante_id` (`estudiante_id`,`fecha`);

--
-- Indices de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `estudiante_id` (`estudiante_id`,`asignatura`,`periodo`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emisor_id` (`emisor_id`),
  ADD KEY `receptor_id` (`receptor_id`);

--
-- Indices de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estudiante_id` (`estudiante_id`),
  ADD KEY `docente_id` (`docente_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `estudiante_id` (`estudiante_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`emisor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `mensajes_ibfk_2` FOREIGN KEY (`receptor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD CONSTRAINT `observaciones_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `observaciones_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_evaluacion`
--

CREATE TABLE IF NOT EXISTS `configuracion_evaluacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anio_academico` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL DEFAULT 'Configuración Académica Estándar',
  `tipo_periodo` varchar(50) NOT NULL DEFAULT 'Bimestre',
  `numero_periodos` int(11) NOT NULL DEFAULT 4,
  `indicadores_por_periodo` int(11) NOT NULL DEFAULT 2,
  `notas_por_indicador` int(11) NOT NULL DEFAULT 3,
  `tipo_escala` varchar(50) NOT NULL DEFAULT 'NUMERICA_CINCO',
  `escala_minima` decimal(5,2) NOT NULL DEFAULT 1.00,
  `escala_maxima` decimal(5,2) NOT NULL DEFAULT 5.00,
  `nota_aprobatoria` decimal(5,2) NOT NULL DEFAULT 3.00,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usuario_actualizo_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_config_eval_anio` (`anio_academico`),
  KEY `fk_config_eval_usuario` (`usuario_actualizo_id`),
  CONSTRAINT `fk_config_eval_usuario` FOREIGN KEY (`usuario_actualizo_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `configuracion_evaluacion` 
  (`id`, `anio_academico`, `nombre`, `tipo_periodo`, `numero_periodos`, `indicadores_por_periodo`, `notas_por_indicador`, `tipo_escala`, `escala_minima`, `escala_maxima`, `nota_aprobatoria`, `activa`)
VALUES
  (1, 2026, 'Configuración Académica 2026', 'Bimestre', 4, 2, 3, 'NUMERICA_CINCO', 1.00, 5.00, 3.00, 1)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE IF NOT EXISTS `materias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `intensidad_horaria` int(11) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materia_nombre` (`nombre`),
  UNIQUE KEY `uq_materia_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `materias` (`id`, `nombre`, `codigo`, `descripcion`, `area`, `intensidad_horaria`, `activo`) VALUES
(1, 'Matemáticas', 'MAT', 'Materia de cálculo, álgebra y geometría', 'Matemáticas', 5, 1),
(2, 'Lenguaje', 'LEN', 'Materia de comprensión lectora y expresión escrita', 'Humanidades y Lengua Castellana', 5, 1),
(3, 'Ciencias Naturales', 'CNAT', 'Materia de ciencias y biología', 'Ciencias Naturales', 4, 1),
(4, 'Ciencias Sociales', 'CSOC', 'Materia de historia y geografía', 'Ciencias Sociales', 4, 1),
(5, 'Inglés', 'ING', 'Materia de idioma extranjero', 'Idiomas Extranjeros', 3, 1),
(6, 'Educación Física', 'EDF', 'Materia de deporte y actividad física', 'Educación Física', 2, 1)
ON DUPLICATE KEY UPDATE `codigo` = VALUES(`codigo`), `area` = VALUES(`area`);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `curso_materia`
--

CREATE TABLE IF NOT EXISTS `curso_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `intensidad_horaria` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curso_materia` (`curso_id`, `materia_id`),
  KEY `fk_cm_curso` (`curso_id`),
  KEY `fk_cm_materia` (`materia_id`),
  CONSTRAINT `fk_cm_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cm_materia` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `docente_asignacion`
--

CREATE TABLE IF NOT EXISTS `docente_asignacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `docente_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_docente_curso_materia` (`docente_id`, `curso_id`, `materia_id`),
  KEY `fk_da_docente` (`docente_id`),
  KEY `fk_da_curso` (`curso_id`),
  KEY `fk_da_materia` (`materia_id`),
  CONSTRAINT `fk_da_docente` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_da_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_da_materia` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

