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

INSERT INTO `asistencia` (`id`, `estudiante_id`, `fecha`, `estado`) VALUES
(1, 1, '2025-10-14', 'PRESENTE'),
(2, 1, '2025-10-13', 'PRESENTE'),
(3, 1, '2025-10-12', 'PRESENTE'),
(4, 2, '2025-10-14', 'TARDE'),
(5, 2, '2025-10-13', 'PRESENTE'),
(6, 2, '2025-10-12', 'AUSENTE'),
(7, 3, '2025-10-14', 'PRESENTE'),
(8, 3, '2025-10-13', 'JUSTIFICADO'),
(9, 3, '2025-10-12', 'PRESENTE'),
(10, 5, '2025-10-14', 'PRESENTE'),
(11, 5, '2025-10-13', 'PRESENTE'),
(12, 3, '2025-10-15', 'TARDE'),
(13, 1, '2025-10-15', 'PRESENTE'),
(14, 2, '2025-10-15', 'PRESENTE'),
(15, 3, '2025-10-16', 'TARDE'),
(16, 1, '2025-10-16', 'PRESENTE'),
(17, 2, '2025-10-16', 'PRESENTE'),
(18, 3, '2025-10-17', 'PRESENTE'),
(19, 1, '2025-10-17', 'TARDE'),
(20, 2, '2025-10-17', 'PRESENTE');

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

INSERT INTO `calificaciones` (`id`, `estudiante_id`, `asignatura`, `periodo`, `nota`, `fecha_registro`) VALUES
(10, 3, 'Matematicas', '2025-P1', 4.30, '2025-10-15 05:00:00'),
(11, 1, 'Matematicas', '2025-P1', 3.40, '2025-10-15 05:00:00'),
(12, 2, 'Matematicas', '2025-P1', 4.60, '2025-10-15 05:00:00'),
(13, 3, 'Lenguaje', '2025-P1', 4.00, '2025-10-15 05:00:00'),
(14, 1, 'Lenguaje', '2025-P1', 3.90, '2025-10-15 05:00:00'),
(15, 2, 'Lenguaje', '2025-P1', 4.60, '2025-10-15 05:00:00'),
(16, 3, 'Ciencias', '2025-P1', 4.70, '2025-10-15 05:00:00'),
(17, 1, 'Ciencias', '2025-P1', 3.60, '2025-10-15 05:00:00'),
(18, 2, 'Ciencias', '2025-P1', 4.60, '2025-10-15 05:00:00'),
(19, 3, 'Historia', '2025-P1', 4.50, '2025-10-15 05:00:00'),
(20, 1, 'Historia', '2025-P1', 3.20, '2025-10-15 05:00:00'),
(21, 2, 'Historia', '2025-P1', 4.00, '2025-10-15 05:00:00'),
(22, 3, 'Ingles', '2025-P1', 3.20, '2025-10-15 05:00:00'),
(23, 1, 'Ingles', '2025-P1', 3.40, '2025-10-15 05:00:00'),
(24, 2, 'Ingles', '2025-P1', 5.00, '2025-10-15 05:00:00'),
(25, 3, 'Educacion_Fisica', '2025-P1', 4.00, '2025-10-15 05:00:00'),
(26, 1, 'Educacion_Fisica', '2025-P1', 4.00, '2025-10-15 05:00:00'),
(27, 2, 'Educacion_Fisica', '2025-P1', 5.00, '2025-10-15 05:00:00'),
(28, 3, 'Matematicas', '2025-P2', 3.30, '2025-10-17 05:00:00'),
(29, 1, 'Matematicas', '2025-P2', 4.00, '2025-10-17 05:00:00'),
(30, 2, 'Matematicas', '2025-P2', 4.60, '2025-10-17 05:00:00');

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

INSERT INTO `observaciones` (`id`, `estudiante_id`, `docente_id`, `fecha`, `tipo`, `detalle`) VALUES
(1, 1, 2, '2025-10-10', 'POSITIVA', 'Santiago mostró excelente participación en matemáticas.'),
(2, 1, 2, '2025-10-12', 'POSITIVA', 'Ayudó a sus compañeros durante el trabajo grupal.'),
(3, 2, 2, '2025-10-11', 'NEUTRAL', 'Valentina necesita mejorar su atención en clase.'),
(4, 3, 2, '2025-10-08', 'POSITIVA', 'Matías demostró liderazgo en el proyecto de ciencias.'),
(5, 5, 2, '2025-10-09', 'POSITIVA', 'Lucas mejoró notablemente en lectura.');

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
(1, 'admin', 'Administrador Sistema', 'admin@monteverde.com', 'admin123', NULL),
(2, 'docente', 'María García López', 'docente@monteverde.com', 'docente123', NULL),
(4, 'familia', 'Familia González', 'familia@monteverde.com', 'familia123', 1);

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
