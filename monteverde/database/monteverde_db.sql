-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-09-2026 a las 02:12:02
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

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
-- Estructura de tabla para la tabla `actividad_admin`
--

CREATE TABLE `actividad_admin` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `detalles` text DEFAULT NULL,
  `fecha` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `actividad_admin`
--

INSERT INTO `actividad_admin` (`id`, `usuario_id`, `accion`, `detalles`, `fecha`) VALUES
(1, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero A\' (1°°A) del docente María García López', '2026-09-03 18:59:38'),
(2, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero A\' (1°°A) del docente María García López', '2026-09-03 18:59:40'),
(3, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero A\' (1°°A) del docente María García López', '2026-09-03 18:59:44'),
(4, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero B\' (1°°B) del docente María García López', '2026-09-03 18:59:46'),
(5, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero B\' (1°°B) del docente María García López', '2026-09-03 18:59:50'),
(6, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Segundo A\' (2°°A) del docente María García López', '2026-09-03 18:59:51'),
(7, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero A\' (1°°A) del docente Profesor Carlos Ruiz', '2026-09-03 18:59:55'),
(8, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero A\' (1°°A) del docente Profesor Carlos Ruiz', '2026-09-03 18:59:57'),
(9, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero A\' (1°°A) del docente Profesor Carlos Ruiz', '2026-09-03 19:00:01'),
(10, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero B\' (1°°B) del docente Profesor Carlos Ruiz', '2026-09-03 19:00:03'),
(11, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Primero B\' (1°°B) del docente Profesor Carlos Ruiz', '2026-09-03 19:00:07'),
(12, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó el curso \'Segundo A\' (2°°A) del docente Profesor Carlos Ruiz', '2026-09-03 19:00:09'),
(13, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Matemáticas\' del curso \'Primero A\' (1°A) del docente María García López', '2026-09-03 19:00:50'),
(14, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Lenguaje\' del curso \'Primero A\' (1°A) del docente María García López', '2026-09-03 19:00:52'),
(15, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Ciencias Naturales\' del curso \'Primero A\' (1°A) del docente María García López', '2026-09-03 19:00:55'),
(16, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Matemáticas\' del curso \'Primero B\' (1°B) del docente María García López', '2026-09-03 19:00:58'),
(17, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Lenguaje\' del curso \'Primero B\' (1°B) del docente María García López', '2026-09-03 19:01:01'),
(18, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Matemáticas\' del curso \'Segundo A\' (2°A) del docente María García López', '2026-09-03 19:01:03'),
(19, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Ciencias Sociales\' del curso \'Primero A\' (1°A) del docente Profesor Carlos Ruiz', '2026-09-03 19:01:06'),
(20, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Inglés\' del curso \'Primero A\' (1°A) del docente Profesor Carlos Ruiz', '2026-09-03 19:01:08'),
(21, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Educación Física\' del curso \'Primero A\' (1°A) del docente Profesor Carlos Ruiz', '2026-09-03 19:01:11'),
(22, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Ciencias Naturales\' del curso \'Primero B\' (1°B) del docente Profesor Carlos Ruiz', '2026-09-03 19:01:13'),
(23, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Ciencias Sociales\' del curso \'Primero B\' (1°B) del docente Profesor Carlos Ruiz', '2026-09-03 19:01:15'),
(24, 10, 'DESASIGNAR_ASIGNACION', 'Se desasignó \'Ciencias Naturales\' del curso \'Segundo A\' (2°A) del docente Profesor Carlos Ruiz', '2026-09-03 19:01:18'),
(25, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Matemáticas\' en el curso \'Primero A\' (1°A) al docente María García López (docente@monteverde.com)', '2026-09-03 19:01:26'),
(26, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Lenguaje\' en el curso \'Primero A\' (1°A) al docente María García López (docente@monteverde.com)', '2026-09-03 19:01:32'),
(27, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Ciencias Naturales\' en el curso \'Primero A\' (1°A) al docente María García López (docente@monteverde.com)', '2026-09-03 19:01:38'),
(28, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Ciencias Sociales\' en el curso \'Primero A\' (1°A) al docente María García López (docente@monteverde.com)', '2026-09-03 19:01:47'),
(29, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Educación Física\' en el curso \'Primero A\' (1°A) al docente Profesor Carlos Ruiz (carlos.docente@monteverde.edu.co)', '2026-09-03 19:01:54'),
(30, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Educación Física\' en el curso \'Primero B\' (1°B) al docente Profesor Carlos Ruiz (carlos.docente@monteverde.edu.co)', '2026-09-03 19:01:59'),
(31, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Educación Física\' en el curso \'Segundo A\' (2°A) al docente Profesor Carlos Ruiz (carlos.docente@monteverde.edu.co)', '2026-09-03 19:02:06'),
(32, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Educación Física\' en el curso \'Tercero A\' (3°A) al docente Profesor Carlos Ruiz (carlos.docente@monteverde.edu.co)', '2026-09-03 19:02:16'),
(33, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Educación Física\' en el curso \'Cuarto A\' (4°A) al docente Profesor Carlos Ruiz (carlos.docente@monteverde.edu.co)', '2026-09-03 19:02:23'),
(34, 10, 'ASIGNAR_CURSO_MATERIA', 'Se asignó \'Educación Artística\' en el curso \'Quinto A\' (5°A) al docente Profesor Carlos Ruiz (carlos.docente@monteverde.edu.co)', '2026-09-03 19:02:28');

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
(20, 2, '2025-10-17', 'PRESENTE'),
(121, 1, '2026-09-03', 'PRESENTE'),
(122, 2, '2026-09-03', 'PRESENTE'),
(123, 3, '2026-09-03', 'PRESENTE'),
(124, 4, '2026-09-03', 'PRESENTE'),
(125, 5, '2026-09-03', 'PRESENTE'),
(126, 1, '2026-09-02', 'PRESENTE'),
(127, 2, '2026-09-02', 'PRESENTE'),
(128, 3, '2026-09-02', 'PRESENTE'),
(129, 4, '2026-09-02', 'PRESENTE'),
(130, 5, '2026-09-02', 'PRESENTE'),
(131, 1, '2026-09-01', 'PRESENTE'),
(132, 2, '2026-09-01', 'PRESENTE'),
(133, 3, '2026-09-01', 'PRESENTE'),
(134, 4, '2026-09-01', 'PRESENTE'),
(135, 5, '2026-09-01', 'AUSENTE'),
(136, 1, '2026-08-31', 'PRESENTE'),
(137, 2, '2026-08-31', 'PRESENTE'),
(138, 3, '2026-08-31', 'PRESENTE'),
(139, 4, '2026-08-31', 'PRESENTE'),
(140, 5, '2026-08-31', 'PRESENTE'),
(141, 1, '2026-08-28', 'PRESENTE'),
(142, 2, '2026-08-28', 'PRESENTE'),
(143, 3, '2026-08-28', 'TARDE'),
(144, 4, '2026-08-28', 'PRESENTE'),
(145, 5, '2026-08-28', 'PRESENTE'),
(146, 1, '2026-08-27', 'PRESENTE'),
(147, 2, '2026-08-27', 'PRESENTE'),
(148, 3, '2026-08-27', 'PRESENTE'),
(149, 4, '2026-08-27', 'PRESENTE'),
(150, 5, '2026-08-27', 'PRESENTE'),
(151, 1, '2026-08-26', 'PRESENTE'),
(152, 2, '2026-08-26', 'PRESENTE'),
(153, 3, '2026-08-26', 'PRESENTE'),
(154, 4, '2026-08-26', 'PRESENTE'),
(155, 5, '2026-08-26', 'PRESENTE'),
(156, 1, '2026-08-25', 'PRESENTE'),
(157, 2, '2026-08-25', 'PRESENTE'),
(158, 3, '2026-08-25', 'PRESENTE'),
(159, 4, '2026-08-25', 'PRESENTE'),
(160, 5, '2026-08-25', 'AUSENTE'),
(161, 1, '2026-08-24', 'PRESENTE'),
(162, 2, '2026-08-24', 'PRESENTE'),
(163, 3, '2026-08-24', 'PRESENTE'),
(164, 4, '2026-08-24', 'PRESENTE'),
(165, 5, '2026-08-24', 'PRESENTE'),
(166, 1, '2026-08-21', 'PRESENTE'),
(167, 2, '2026-08-21', 'PRESENTE'),
(168, 3, '2026-08-21', 'PRESENTE'),
(169, 4, '2026-08-21', 'PRESENTE'),
(170, 5, '2026-08-21', 'PRESENTE'),
(171, 1, '2026-08-20', 'JUSTIFICADO'),
(172, 2, '2026-08-20', 'PRESENTE'),
(173, 3, '2026-08-20', 'PRESENTE'),
(174, 4, '2026-08-20', 'PRESENTE'),
(175, 5, '2026-08-20', 'PRESENTE'),
(176, 1, '2026-08-19', 'PRESENTE'),
(177, 2, '2026-08-19', 'PRESENTE'),
(178, 3, '2026-08-19', 'PRESENTE'),
(179, 4, '2026-08-19', 'PRESENTE'),
(180, 5, '2026-08-19', 'PRESENTE'),
(181, 1, '2026-08-18', 'PRESENTE'),
(182, 2, '2026-08-18', 'PRESENTE'),
(183, 3, '2026-08-18', 'PRESENTE'),
(184, 4, '2026-08-18', 'PRESENTE'),
(185, 5, '2026-08-18', 'PRESENTE'),
(186, 1, '2026-08-17', 'PRESENTE'),
(187, 2, '2026-08-17', 'PRESENTE'),
(188, 3, '2026-08-17', 'PRESENTE'),
(189, 4, '2026-08-17', 'PRESENTE'),
(190, 5, '2026-08-17', 'PRESENTE'),
(191, 1, '2026-08-14', 'PRESENTE'),
(192, 2, '2026-08-14', 'PRESENTE'),
(193, 3, '2026-08-14', 'PRESENTE'),
(194, 4, '2026-08-14', 'PRESENTE'),
(195, 5, '2026-08-14', 'PRESENTE'),
(196, 1, '2026-08-13', 'PRESENTE'),
(197, 2, '2026-08-13', 'PRESENTE'),
(198, 3, '2026-08-13', 'PRESENTE'),
(199, 4, '2026-08-13', 'PRESENTE'),
(200, 5, '2026-08-13', 'PRESENTE'),
(201, 1, '2026-08-12', 'PRESENTE'),
(202, 2, '2026-08-12', 'PRESENTE'),
(203, 3, '2026-08-12', 'PRESENTE'),
(204, 4, '2026-08-12', 'PRESENTE'),
(205, 5, '2026-08-12', 'PRESENTE'),
(206, 1, '2026-08-11', 'PRESENTE'),
(207, 2, '2026-08-11', 'PRESENTE'),
(208, 3, '2026-08-11', 'PRESENTE'),
(209, 4, '2026-08-11', 'PRESENTE'),
(210, 5, '2026-08-11', 'PRESENTE'),
(211, 1, '2026-08-10', 'PRESENTE'),
(212, 2, '2026-08-10', 'PRESENTE'),
(213, 3, '2026-08-10', 'PRESENTE'),
(214, 4, '2026-08-10', 'PRESENTE'),
(215, 5, '2026-08-10', 'PRESENTE'),
(216, 1, '2026-08-07', 'PRESENTE'),
(217, 2, '2026-08-07', 'PRESENTE'),
(218, 3, '2026-08-07', 'PRESENTE'),
(219, 4, '2026-08-07', 'PRESENTE'),
(220, 5, '2026-08-07', 'PRESENTE');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bimestres_config`
--

CREATE TABLE `bimestres_config` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `anio` int(4) NOT NULL,
  `orden` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bimestres_config`
--

INSERT INTO `bimestres_config` (`id`, `nombre`, `anio`, `orden`) VALUES
(1, 'Bimestre 1', 2026, 1),
(2, 'Bimestre 2', 2026, 2),
(3, 'Bimestre 3', 2026, 3),
(4, 'Bimestre 4', 2026, 4);

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
(30, 2, 'Matematicas', '2025-P2', 4.60, '2025-10-17 05:00:00'),
(46, 1, 'Matematicas', '2026-P1', 4.50, '2026-09-03 23:49:03'),
(47, 1, 'Lenguaje', '2026-P1', 4.37, '2026-09-03 23:49:03'),
(48, 1, 'Ciencias', '2026-P1', 4.37, '2026-09-03 23:49:03'),
(49, 2, 'Matematicas', '2026-P1', 4.93, '2026-09-03 23:49:03'),
(50, 2, 'Lenguaje', '2026-P1', 4.83, '2026-09-03 23:49:03'),
(51, 2, 'Ciencias', '2026-P1', 4.90, '2026-09-03 23:49:03'),
(52, 3, 'Matematicas', '2026-P1', 4.00, '2026-09-03 23:49:03'),
(53, 3, 'Lenguaje', '2026-P1', 4.07, '2026-09-03 23:49:03'),
(54, 3, 'Ciencias', '2026-P1', 4.27, '2026-09-03 23:49:03'),
(55, 4, 'Matematicas', '2026-P1', 4.23, '2026-09-03 23:49:03'),
(56, 4, 'Lenguaje', '2026-P1', 4.40, '2026-09-03 23:49:03'),
(57, 4, 'Ciencias', '2026-P1', 4.23, '2026-09-03 23:49:03'),
(58, 5, 'Matematicas', '2026-P1', 2.83, '2026-09-03 23:49:03'),
(59, 5, 'Lenguaje', '2026-P1', 3.07, '2026-09-03 23:49:03'),
(60, 5, 'Ciencias', '2026-P1', 3.00, '2026-09-03 23:49:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificaciones_bimestre`
--

CREATE TABLE `calificaciones_bimestre` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `indicador_id` int(11) NOT NULL,
  `numero_nota` tinyint(1) NOT NULL COMMENT '1, 2 o 3',
  `nota` decimal(5,2) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tarea_id` int(11) DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `calificaciones_bimestre`
--

INSERT INTO `calificaciones_bimestre` (`id`, `estudiante_id`, `docente_id`, `indicador_id`, `numero_nota`, `nota`, `fecha_registro`, `tarea_id`) VALUES
(91, 1, 2, 7, 1, 4.50, '2026-09-03 23:49:03', NULL),
(92, 1, 2, 7, 2, 4.20, '2026-09-03 23:49:03', NULL),
(93, 1, 2, 7, 3, 4.80, '2026-09-03 23:49:03', NULL),
(94, 1, 2, 8, 1, 4.50, '2026-09-03 23:49:03', NULL),
(95, 1, 2, 8, 2, 4.20, '2026-09-03 23:49:03', NULL),
(96, 1, 2, 8, 3, 4.80, '2026-09-03 23:49:03', NULL),
(97, 1, 2, 9, 1, 4.00, '2026-09-03 23:49:03', NULL),
(98, 1, 2, 9, 2, 4.50, '2026-09-03 23:49:03', NULL),
(99, 1, 2, 9, 3, 4.60, '2026-09-03 23:49:03', NULL),
(100, 1, 2, 10, 1, 4.00, '2026-09-03 23:49:03', NULL),
(101, 1, 2, 10, 2, 4.50, '2026-09-03 23:49:03', NULL),
(102, 1, 2, 10, 3, 4.60, '2026-09-03 23:49:03', NULL),
(103, 1, 2, 11, 1, 4.20, '2026-09-03 23:49:03', NULL),
(104, 1, 2, 11, 2, 4.40, '2026-09-03 23:49:03', NULL),
(105, 1, 2, 11, 3, 4.50, '2026-09-03 23:49:03', NULL),
(106, 1, 2, 12, 1, 4.20, '2026-09-03 23:49:03', NULL),
(107, 1, 2, 12, 2, 4.40, '2026-09-03 23:49:03', NULL),
(108, 1, 2, 12, 3, 4.50, '2026-09-03 23:49:03', NULL),
(109, 2, 2, 7, 1, 5.00, '2026-09-03 23:49:03', NULL),
(110, 2, 2, 7, 2, 4.80, '2026-09-03 23:49:03', NULL),
(111, 2, 2, 7, 3, 5.00, '2026-09-03 23:49:03', NULL),
(112, 2, 2, 8, 1, 5.00, '2026-09-03 23:49:03', NULL),
(113, 2, 2, 8, 2, 4.80, '2026-09-03 23:49:03', NULL),
(114, 2, 2, 8, 3, 5.00, '2026-09-03 23:49:03', NULL),
(115, 2, 2, 9, 1, 4.80, '2026-09-03 23:49:03', NULL),
(116, 2, 2, 9, 2, 5.00, '2026-09-03 23:49:03', NULL),
(117, 2, 2, 9, 3, 4.70, '2026-09-03 23:49:03', NULL),
(118, 2, 2, 10, 1, 4.80, '2026-09-03 23:49:03', NULL),
(119, 2, 2, 10, 2, 5.00, '2026-09-03 23:49:03', NULL),
(120, 2, 2, 10, 3, 4.70, '2026-09-03 23:49:03', NULL),
(121, 2, 2, 11, 1, 4.90, '2026-09-03 23:49:03', NULL),
(122, 2, 2, 11, 2, 5.00, '2026-09-03 23:49:03', NULL),
(123, 2, 2, 11, 3, 4.80, '2026-09-03 23:49:03', NULL),
(124, 2, 2, 12, 1, 4.90, '2026-09-03 23:49:03', NULL),
(125, 2, 2, 12, 2, 5.00, '2026-09-03 23:49:03', NULL),
(126, 2, 2, 12, 3, 4.80, '2026-09-03 23:49:03', NULL),
(127, 3, 2, 7, 1, 3.80, '2026-09-03 23:49:03', NULL),
(128, 3, 2, 7, 2, 4.00, '2026-09-03 23:49:03', NULL),
(129, 3, 2, 7, 3, 4.20, '2026-09-03 23:49:03', NULL),
(130, 3, 2, 8, 1, 3.80, '2026-09-03 23:49:03', NULL),
(131, 3, 2, 8, 2, 4.00, '2026-09-03 23:49:03', NULL),
(132, 3, 2, 8, 3, 4.20, '2026-09-03 23:49:03', NULL),
(133, 3, 2, 9, 1, 4.20, '2026-09-03 23:49:03', NULL),
(134, 3, 2, 9, 2, 3.90, '2026-09-03 23:49:03', NULL),
(135, 3, 2, 9, 3, 4.10, '2026-09-03 23:49:03', NULL),
(136, 3, 2, 10, 1, 4.20, '2026-09-03 23:49:03', NULL),
(137, 3, 2, 10, 2, 3.90, '2026-09-03 23:49:03', NULL),
(138, 3, 2, 10, 3, 4.10, '2026-09-03 23:49:03', NULL),
(139, 3, 2, 11, 1, 4.50, '2026-09-03 23:49:03', NULL),
(140, 3, 2, 11, 2, 4.00, '2026-09-03 23:49:03', NULL),
(141, 3, 2, 11, 3, 4.30, '2026-09-03 23:49:03', NULL),
(142, 3, 2, 12, 1, 4.50, '2026-09-03 23:49:03', NULL),
(143, 3, 2, 12, 2, 4.00, '2026-09-03 23:49:03', NULL),
(144, 3, 2, 12, 3, 4.30, '2026-09-03 23:49:03', NULL),
(145, 4, 2, 7, 1, 4.20, '2026-09-03 23:49:03', NULL),
(146, 4, 2, 7, 2, 4.50, '2026-09-03 23:49:03', NULL),
(147, 4, 2, 7, 3, 4.00, '2026-09-03 23:49:03', NULL),
(148, 4, 2, 8, 1, 4.20, '2026-09-03 23:49:03', NULL),
(149, 4, 2, 8, 2, 4.50, '2026-09-03 23:49:03', NULL),
(150, 4, 2, 8, 3, 4.00, '2026-09-03 23:49:03', NULL),
(151, 4, 2, 9, 1, 4.40, '2026-09-03 23:49:03', NULL),
(152, 4, 2, 9, 2, 4.60, '2026-09-03 23:49:03', NULL),
(153, 4, 2, 9, 3, 4.20, '2026-09-03 23:49:03', NULL),
(154, 4, 2, 10, 1, 4.40, '2026-09-03 23:49:03', NULL),
(155, 4, 2, 10, 2, 4.60, '2026-09-03 23:49:03', NULL),
(156, 4, 2, 10, 3, 4.20, '2026-09-03 23:49:03', NULL),
(157, 4, 2, 11, 1, 4.00, '2026-09-03 23:49:03', NULL),
(158, 4, 2, 11, 2, 4.30, '2026-09-03 23:49:03', NULL),
(159, 4, 2, 11, 3, 4.40, '2026-09-03 23:49:03', NULL),
(160, 4, 2, 12, 1, 4.00, '2026-09-03 23:49:03', NULL),
(161, 4, 2, 12, 2, 4.30, '2026-09-03 23:49:03', NULL),
(162, 4, 2, 12, 3, 4.40, '2026-09-03 23:49:03', NULL),
(163, 5, 2, 7, 1, 2.80, '2026-09-03 23:49:03', NULL),
(164, 5, 2, 7, 2, 3.00, '2026-09-03 23:49:03', NULL),
(165, 5, 2, 7, 3, 2.70, '2026-09-03 23:49:03', NULL),
(166, 5, 2, 8, 1, 2.80, '2026-09-03 23:49:03', NULL),
(167, 5, 2, 8, 2, 3.00, '2026-09-03 23:49:03', NULL),
(168, 5, 2, 8, 3, 2.70, '2026-09-03 23:49:03', NULL),
(169, 5, 2, 9, 1, 3.20, '2026-09-03 23:49:03', NULL),
(170, 5, 2, 9, 2, 2.90, '2026-09-03 23:49:03', NULL),
(171, 5, 2, 9, 3, 3.10, '2026-09-03 23:49:03', NULL),
(172, 5, 2, 10, 1, 3.20, '2026-09-03 23:49:03', NULL),
(173, 5, 2, 10, 2, 2.90, '2026-09-03 23:49:03', NULL),
(174, 5, 2, 10, 3, 3.10, '2026-09-03 23:49:03', NULL),
(175, 5, 2, 11, 1, 3.00, '2026-09-03 23:49:03', NULL),
(176, 5, 2, 11, 2, 3.20, '2026-09-03 23:49:03', NULL),
(177, 5, 2, 11, 3, 2.80, '2026-09-03 23:49:03', NULL),
(178, 5, 2, 12, 1, 3.00, '2026-09-03 23:49:03', NULL),
(179, 5, 2, 12, 2, 3.20, '2026-09-03 23:49:03', NULL),
(180, 5, 2, 12, 3, 2.80, '2026-09-03 23:49:03', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `circulares`
--

CREATE TABLE `circulares` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_publicacion` datetime NOT NULL,
  `autor_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `circulares`
--

INSERT INTO `circulares` (`id`, `titulo`, `contenido`, `fecha_publicacion`, `autor_id`) VALUES
(4, 'Bienvenida al Año Escolar 2026 - Colegio MonteVerde', 'Estimada comunidad educativa: Les damos la más calurosa bienvenida a este nuevo ciclo escolar 2026. Renovamos nuestro compromiso pedagógico y humano para acompañar el crecimiento integral de cada estudiante con excelencia académica y calidez.', '2026-08-19 18:49:03', 1),
(5, 'Cronograma de Evaluaciones del Primer Bimestre', 'Informamos a las familias y docentes que del 15 al 20 de este mes se llevará a cabo el cierre y consolidación del Primer Bimestre. Los invitamos a consultar el portal web para el seguimiento de entregas y retroalimentaciones.', '2026-08-29 18:49:03', 1),
(6, 'Jornada Cultural y Deportiva Intercolegiada', 'Este próximo viernes celebraremos nuestra tradicional jornada deportiva y de talentos artísticos. Los estudiantes podrán asistir con su uniforme deportivo institucional y compartir en comunidad.', '2026-09-01 18:49:03', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_evaluacion`
--

CREATE TABLE `configuracion_evaluacion` (
  `id` int(11) NOT NULL,
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
  `usuario_actualizo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuracion_evaluacion`
--

INSERT INTO `configuracion_evaluacion` (`id`, `anio_academico`, `nombre`, `tipo_periodo`, `numero_periodos`, `indicadores_por_periodo`, `notas_por_indicador`, `tipo_escala`, `escala_minima`, `escala_maxima`, `nota_aprobatoria`, `activa`, `created_at`, `updated_at`, `usuario_actualizo_id`) VALUES
(1, 2026, 'Configuración Académica 2026', 'Bimestre', 4, 2, 3, 'NUMERICA_CINCO', 1.00, 5.00, 3.00, 1, '2026-09-03 23:42:23', '2026-09-03 23:42:23', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_institucional`
--

CREATE TABLE `configuracion_institucional` (
  `id` int(11) NOT NULL,
  `institucion_id` varchar(50) NOT NULL DEFAULT 'MONTEVERDE_DEFAULT',
  `nombre_institucion` varchar(150) NOT NULL DEFAULT 'Colegio MonteVerde',
  `director` varchar(150) NOT NULL DEFAULT 'Fernando MonteVerde',
  `anio_escolar` varchar(20) NOT NULL DEFAULT '2026',
  `periodo_actual` varchar(50) NOT NULL DEFAULT 'Primer Trimestre',
  `direccion` varchar(255) DEFAULT 'Calle de la Arboleda #45, Ciudad Jardín',
  `telefono` varchar(50) DEFAULT '+57 (601) 456-7890',
  `email_contacto` varchar(150) DEFAULT 'contacto@monteverde.edu.co',
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usuario_actualizo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuracion_institucional`
--

INSERT INTO `configuracion_institucional` (`id`, `institucion_id`, `nombre_institucion`, `director`, `anio_escolar`, `periodo_actual`, `direccion`, `telefono`, `email_contacto`, `activa`, `created_at`, `updated_at`, `usuario_actualizo_id`) VALUES
(1, 'MONTEVERDE_DEFAULT', 'Colegio MonteVerde', 'Fernando MonteVerde', '2026', 'Primer Trimestre', 'Calle de la Arboleda #45, Ciudad Jardín', '+57 (601) 456-7890', 'contacto@monteverde.edu.co', 1, '2026-09-03 18:43:09', '2026-09-03 18:43:09', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conversaciones_archivadas`
--

CREATE TABLE `conversaciones_archivadas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `contacto_id` int(11) NOT NULL,
  `fecha_archivado` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `nivel` varchar(10) DEFAULT NULL,
  `letra` varchar(10) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id`, `nombre`, `nivel`, `letra`, `descripcion`) VALUES
(1, 'Primero A', '1', 'A', 'Curso de primer grado grupo A'),
(2, 'Primero B', '1', 'B', 'Curso de primer grado grupo B'),
(3, 'Segundo A', '2', 'A', 'Curso de segundo grado grupo A'),
(4, 'Tercero A', '3', 'A', 'Curso de tercer grado grupo A'),
(5, 'Cuarto A', '4', 'A', 'Curso de cuarto grado grupo A'),
(6, 'Quinto A', '5', 'A', 'Curso de quinto grado grupo A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `curso_materia`
--

CREATE TABLE `curso_materia` (
  `id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `intensidad_horaria` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `curso_materia`
--

INSERT INTO `curso_materia` (`id`, `curso_id`, `materia_id`, `intensidad_horaria`, `activo`, `created_at`) VALUES
(1, 1, 1, 5, 1, '2026-09-03 18:46:43'),
(2, 1, 2, 5, 1, '2026-09-03 18:46:43'),
(3, 1, 3, 4, 1, '2026-09-03 18:46:43'),
(4, 1, 4, 4, 1, '2026-09-03 18:46:43'),
(5, 1, 5, 3, 1, '2026-09-03 18:46:43'),
(6, 1, 6, 2, 1, '2026-09-03 18:46:43'),
(7, 2, 1, 5, 1, '2026-09-03 18:46:43'),
(8, 2, 2, 5, 1, '2026-09-03 18:46:43'),
(9, 2, 3, 4, 1, '2026-09-03 18:46:43'),
(10, 2, 4, 4, 1, '2026-09-03 18:46:43'),
(11, 2, 5, 3, 1, '2026-09-03 18:46:43'),
(12, 2, 6, 2, 1, '2026-09-03 18:46:43'),
(13, 3, 1, 5, 1, '2026-09-03 18:46:43'),
(14, 3, 2, 5, 1, '2026-09-03 18:46:43'),
(15, 3, 3, 4, 1, '2026-09-03 18:46:43'),
(16, 3, 4, 4, 1, '2026-09-03 18:46:43'),
(17, 3, 5, 3, 1, '2026-09-03 18:46:43'),
(18, 3, 6, 2, 1, '2026-09-03 18:46:43'),
(19, 4, 1, 5, 1, '2026-09-03 18:46:43'),
(20, 4, 2, 5, 1, '2026-09-03 18:46:43'),
(21, 4, 3, 4, 1, '2026-09-03 18:46:43'),
(22, 4, 4, 4, 1, '2026-09-03 18:46:43'),
(23, 4, 5, 3, 1, '2026-09-03 18:46:43'),
(24, 4, 6, 2, 1, '2026-09-03 18:46:43'),
(25, 5, 1, 5, 1, '2026-09-03 18:46:43'),
(26, 5, 2, 5, 1, '2026-09-03 18:46:43'),
(27, 5, 3, 4, 1, '2026-09-03 18:46:43'),
(28, 5, 4, 4, 1, '2026-09-03 18:46:43'),
(29, 5, 5, 3, 1, '2026-09-03 18:46:43'),
(30, 5, 6, 2, 1, '2026-09-03 18:46:43'),
(31, 6, 1, 5, 1, '2026-09-03 18:46:43'),
(32, 6, 2, 5, 1, '2026-09-03 18:46:43'),
(33, 6, 3, 4, 1, '2026-09-03 18:46:43'),
(34, 6, 4, 4, 1, '2026-09-03 18:46:43'),
(35, 6, 5, 3, 1, '2026-09-03 18:46:43'),
(36, 6, 6, 2, 1, '2026-09-03 18:46:43'),
(85, 1, 7, 2, 1, '2026-09-03 18:49:03'),
(92, 2, 7, 2, 1, '2026-09-03 18:49:03'),
(99, 3, 7, 2, 1, '2026-09-03 18:49:03'),
(106, 4, 7, 2, 1, '2026-09-03 18:49:03'),
(113, 5, 7, 2, 1, '2026-09-03 18:49:03'),
(120, 6, 7, 2, 1, '2026-09-03 18:49:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `docente_asignacion`
--

CREATE TABLE `docente_asignacion` (
  `id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `docente_asignacion`
--

INSERT INTO `docente_asignacion` (`id`, `docente_id`, `curso_id`, `materia_id`) VALUES
(25, 2, 1, 1),
(26, 2, 1, 2),
(27, 2, 1, 3),
(28, 2, 1, 4),
(29, 52, 1, 6),
(30, 52, 2, 6),
(31, 52, 3, 6),
(32, 52, 4, 6),
(33, 52, 5, 6),
(34, 52, 6, 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `docente_curso`
--

CREATE TABLE `docente_curso` (
  `id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `entregas`
--

CREATE TABLE `entregas` (
  `id` int(11) NOT NULL,
  `tarea_id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `fecha_entrega` datetime NOT NULL DEFAULT current_timestamp(),
  `archivo_url` varchar(255) DEFAULT NULL,
  `contenido` text DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'PENDIENTE',
  `calificacion` decimal(5,2) DEFAULT NULL,
  `comentarios` text DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `entregas`
--

INSERT INTO `entregas` (`id`, `tarea_id`, `estudiante_id`, `fecha_entrega`, `archivo_url`, `contenido`, `estado`, `calificacion`, `comentarios`) VALUES
(16, 4, 1, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_santiago.pdf', 'Entrega completa con procedimientos y gráficos.', 'CALIFICADA', 4.70, 'Excelente trabajo y presentación impecable.'),
(17, 4, 2, '2026-09-01 18:49:03', 'https://ejemplo.com/taller_valentina.pdf', 'Adjunto archivo con desarrollo paso a paso.', 'CALIFICADA', 5.00, 'Puntaje perfecto, razonamiento brillante.'),
(18, 4, 3, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_matias.pdf', 'Solución de la guía propuesta.', 'CALIFICADA', 4.20, 'Muy buen trabajo, pulir redacción final.'),
(19, 4, 4, '2026-09-03 18:49:03', 'https://ejemplo.com/taller_isabella.pdf', 'Envío de tarea finalizada.', 'ENTREGADA', NULL, NULL),
(20, 4, 5, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_lucas.pdf', 'Entrega parcial.', 'CALIFICADA', 2.80, 'Faltaron varios ejercicios prácticos, requiere refuerzo.'),
(21, 5, 1, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_santiago.pdf', 'Entrega completa con procedimientos y gráficos.', 'CALIFICADA', 4.70, 'Excelente trabajo y presentación impecable.'),
(22, 5, 2, '2026-09-01 18:49:03', 'https://ejemplo.com/taller_valentina.pdf', 'Adjunto archivo con desarrollo paso a paso.', 'CALIFICADA', 5.00, 'Puntaje perfecto, razonamiento brillante.'),
(23, 5, 3, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_matias.pdf', 'Solución de la guía propuesta.', 'CALIFICADA', 4.20, 'Muy buen trabajo, pulir redacción final.'),
(24, 5, 4, '2026-09-03 18:49:03', 'https://ejemplo.com/taller_isabella.pdf', 'Envío de tarea finalizada.', 'ENTREGADA', NULL, NULL),
(25, 5, 5, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_lucas.pdf', 'Entrega parcial.', 'CALIFICADA', 2.80, 'Faltaron varios ejercicios prácticos, requiere refuerzo.'),
(26, 6, 1, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_santiago.pdf', 'Entrega completa con procedimientos y gráficos.', 'CALIFICADA', 4.70, 'Excelente trabajo y presentación impecable.'),
(27, 6, 2, '2026-09-01 18:49:03', 'https://ejemplo.com/taller_valentina.pdf', 'Adjunto archivo con desarrollo paso a paso.', 'CALIFICADA', 5.00, 'Puntaje perfecto, razonamiento brillante.'),
(28, 6, 3, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_matias.pdf', 'Solución de la guía propuesta.', 'CALIFICADA', 4.20, 'Muy buen trabajo, pulir redacción final.'),
(29, 6, 4, '2026-09-03 18:49:03', 'https://ejemplo.com/taller_isabella.pdf', 'Envío de tarea finalizada.', 'ENTREGADA', NULL, NULL),
(30, 6, 5, '2026-09-02 18:49:03', 'https://ejemplo.com/taller_lucas.pdf', 'Entrega parcial.', 'CALIFICADA', 2.80, 'Faltaron varios ejercicios prácticos, requiere refuerzo.');

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
(4, 'Isabella Martínez Torres', 1),
(5, 'Lucas Jiménez Castro', 1),
(6, 'Sofía Hernández Ruiz', 2),
(7, 'Diego Santos Díaz', 2),
(8, 'Camila Torres Moreno', 2),
(9, 'Alejandro Vargas Lima', 3),
(10, 'Martina Castro Rojas', 3),
(11, 'Daniel Morales Ortiz', 3),
(12, 'Mariana Ruiz Navarro', 4),
(13, 'Gabriel Mendoza Peña', 4),
(14, 'Lucía Duarte Ramos', 5),
(15, 'Felipe Cardona Vega', 5),
(16, 'Elena Serrano Gómez', 6),
(17, 'Samuel Pinzón Correa', 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `familia_estudiante`
--

CREATE TABLE `familia_estudiante` (
  `id` int(11) NOT NULL,
  `familia_id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `familia_estudiante`
--

INSERT INTO `familia_estudiante` (`id`, `familia_id`, `estudiante_id`) VALUES
(22, 5, 2),
(23, 6, 3),
(24, 7, 4),
(1, 11, 1),
(19, 11, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `indicadores_logro`
--

CREATE TABLE `indicadores_logro` (
  `id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `bimestre_id` int(11) NOT NULL,
  `numero` tinyint(1) NOT NULL COMMENT '1 o 2',
  `descripcion` varchar(500) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Volcado de datos para la tabla `indicadores_logro`
--

INSERT INTO `indicadores_logro` (`id`, `docente_id`, `curso_id`, `materia_id`, `bimestre_id`, `numero`, `descripcion`, `fecha_creacion`) VALUES
(7, 2, 1, 1, 1, 1, 'Comprende y aplica operaciones básicas y resolución de problemas cotidianos', '2026-09-03 23:49:03'),
(8, 2, 1, 1, 1, 2, 'Demuestra razonamiento lógico y habilidad en ejercicios prácticos', '2026-09-03 23:49:03'),
(9, 2, 1, 2, 1, 1, 'Lee comprensivamente textos narrativos e informativos acordes al nivel', '2026-09-03 23:49:03'),
(10, 2, 1, 2, 1, 2, 'Redacta composiciones sencillas con adecuada ortografía y coherencia', '2026-09-03 23:49:03'),
(11, 2, 1, 3, 1, 1, 'Identifica las características, clasificación y necesidades de los seres vivos', '2026-09-03 23:49:03'),
(12, 2, 1, 3, 1, 2, 'Reconoce la importancia del cuidado del medio ambiente y recursos naturales', '2026-09-03 23:49:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `intensidad_horaria` int(11) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materias`
--

INSERT INTO `materias` (`id`, `nombre`, `codigo`, `descripcion`, `area`, `intensidad_horaria`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Matemáticas', 'MAT', 'Área que desarrolla en los estudiantes habilidades para comprender, interpretar y resolver situaciones de la vida cotidiana mediante el uso de números, operaciones, figuras geométricas, medidas, datos y relaciones lógicas.\n\nFavorece el razonamiento, la co', 'Matemáticas', 5, 1, '2026-09-03 23:42:23', '2026-09-04 00:04:17'),
(2, 'Lenguaje', 'LEN', 'Comprensión lectora, gramática y expresión escrita', 'Humanidades y Lengua Castellana', 5, 1, '2026-09-03 23:42:23', '2026-09-03 18:49:03'),
(3, 'Ciencias Naturales', 'CNAT', 'Biología, ecosistemas, método científico y física básica', 'Ciencias Naturales', 4, 1, '2026-09-03 23:42:23', '2026-09-03 18:49:03'),
(4, 'Ciencias Sociales', 'CSOC', 'Historia, geografía, democracia y convivencia ciudadana', 'Ciencias Sociales', 4, 1, '2026-09-03 23:42:23', '2026-09-03 18:49:03'),
(5, 'Inglés', 'ING', 'Idioma extranjero, vocabulario, comprensión auditiva y conversación', 'Idiomas Extranjeros', 3, 1, '2026-09-03 23:42:23', '2026-09-03 18:49:03'),
(6, 'Educación Física', 'EDF', 'Deporte, actividad física, motricidad y hábitos saludables', 'Educación Física', 2, 1, '2026-09-03 23:42:23', '2026-09-03 18:49:03'),
(7, 'Educación Artística', 'ART', 'Artes plásticas, música, creatividad y expresión corporal', 'Educación Artística', 2, 1, '2026-09-03 18:49:03', '2026-09-03 18:49:03');

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
  `leido` tinyint(1) DEFAULT 0,
  `eliminado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes`
--

INSERT INTO `mensajes` (`id`, `emisor_id`, `receptor_id`, `asunto`, `cuerpo`, `fecha`, `leido`, `eliminado`, `fecha_eliminacion`) VALUES
(11, 2, 11, 'Circular informativa sobre proyectos del mes', 'Adjuntamos las pautas para la preparación del proyecto de Ciencias Naturales de la próxima semana.', '2026-09-02 18:49:03', 0, 0, NULL),
(12, 2, 5, 'Excelente desempeño de Valentina', 'Buenas tardes, Valentina ha demostrado un rendimiento sobresaliente en todas las actividades de lectura y redacción.', '2026-08-30 18:49:03', 1, 0, NULL),
(13, 2, 7, 'Reunión de seguimiento pedagógico', 'Estimados padres de Isabella: Nos gustaría coordinar una breve reunión virtual para comentar los avances del bimestre.', '2026-09-03 13:49:03', 0, 0, NULL);

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
(5, 5, 2, '2025-10-09', 'POSITIVA', 'Lucas mejoró notablemente en lectura.'),
(17, 1, 2, '2026-09-01', 'POSITIVA', 'Santiago demostró un excelente liderazgo y colaboración durante el trabajo en equipo de matemáticas.'),
(18, 1, 2, '2026-08-28', 'POSITIVA', 'Gran participación y curiosidad en la clase de Ciencias Naturales.'),
(19, 2, 2, '2026-08-31', 'POSITIVA', 'Valentina obtuvo desempeño sobresaliente en la resolución de problemas lógicos.'),
(20, 3, 2, '2026-08-29', 'NEUTRAL', 'Matías mostró una actitud receptiva aunque debe asegurar entregar a tiempo sus materiales.'),
(21, 4, 2, '2026-08-30', 'POSITIVA', 'Isabella colaboró entusiastamente en la dinámica de lectura compartida.'),
(22, 5, 2, '2026-09-02', 'NEGATIVA', 'Lucas presentó dificultades de concentración y requiere apoyo en casa con el repaso de las guías de matemáticas.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas`
--

CREATE TABLE `tareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_vencimiento` datetime NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'PUBLICADA',
  `docente_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `califica_bimestre` tinyint(1) NOT NULL DEFAULT 0,
  `bimestre_id` int(11) DEFAULT NULL,
  `indicador_id` int(11) DEFAULT NULL,
  `numero_nota` int(11) DEFAULT NULL,
  `tipo_evaluacion` varchar(50) DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `tareas`
--

INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `fecha_creacion`, `fecha_vencimiento`, `estado`, `docente_id`, `curso_id`, `materia_id`, `califica_bimestre`, `bimestre_id`, `indicador_id`, `numero_nota`, `tipo_evaluacion`) VALUES
(4, 'Taller práctico: Fracciones y Resolución de Problemas', 'Resolver los ejercicios de la página 45 a 47 del libro guía. Incluir procedimientos completos y justificación.', '2026-08-29 18:49:03', '2026-09-06 18:49:03', 'PUBLICADA', 2, 1, 1, 1, 1, 7, 1, 'TALLER'),
(5, 'Lectura Comprensiva y Resumen: El Principito', 'Lectura de los capítulos 1 al 4 y elaboración de un mapa mental ilustrado con las ideas clave.', '2026-08-31 18:49:03', '2026-09-08 18:49:03', 'PUBLICADA', 2, 1, 2, 1, 1, 9, 1, 'LECTURA'),
(6, 'Mini-Proyecto: Clasificación de Seres Vivos y Ecosistemas', 'Diseñar una infografía o maqueta digital sobre los factores bióticos y abióticos de un bosque.', '2026-09-01 18:49:03', '2026-09-10 18:49:03', 'PUBLICADA', 2, 1, 3, 1, 1, 11, 1, 'PROYECTO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estudiante_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `eliminado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_eliminacion` datetime DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `rol`, `nombre`, `email`, `password`, `estudiante_id`, `activo`, `eliminado`, `fecha_eliminacion`, `fecha_registro`) VALUES
(1, 'admin', 'Administrador Sistema', 'admin@monteverde.com', 'scrypt:32768:8:1$LvwqfQXZMbPxjMZR$139b43fcf37201caf97a212cdf7c685d5047973de226093a8075a49979e30425d9657241102ba742259d8144d68573b08ffef97937bbbdcc89b2fcd430669c6a', NULL, 1, 0, NULL, '2026-09-03 18:46:43'),
(2, 'docente', 'María García López', 'docente@monteverde.com', 'scrypt:32768:8:1$fjrZDSsiucGo6p1j$d2021138bbac87f2e8aab85b5068a8036bc4397739bda06eeb503270240fc35ecaf9da36f1bbc5a6ef4c23abec4d9af7b18afb29bf7944685dac67a29dbdcad1', NULL, 1, 0, NULL, '2026-09-03 18:46:43'),
(5, 'familia', 'Familia López García', 'familia.lopez@monteverde.com', 'scrypt:32768:8:1$ZHQR0nETiDCrHuPo$2d88d607177bc4fb98fd1be41d263cbf5ef65ec26786fbfded2a90a26937b02d043fbfa9a0a66da96861f9327f636df8516318b7196d71a3caf89bb768092559', 2, 1, 0, NULL, '2026-09-03 18:49:03'),
(6, 'familia', 'Familia Rodríguez Silva', 'familia.rodriguez@monteverde.com', 'scrypt:32768:8:1$ZHQR0nETiDCrHuPo$2d88d607177bc4fb98fd1be41d263cbf5ef65ec26786fbfded2a90a26937b02d043fbfa9a0a66da96861f9327f636df8516318b7196d71a3caf89bb768092559', 3, 1, 0, NULL, '2026-09-03 18:49:03'),
(7, 'familia', 'Familia Martínez Torres', 'familia.martinez@monteverde.com', 'scrypt:32768:8:1$ZHQR0nETiDCrHuPo$2d88d607177bc4fb98fd1be41d263cbf5ef65ec26786fbfded2a90a26937b02d043fbfa9a0a66da96861f9327f636df8516318b7196d71a3caf89bb768092559', 4, 1, 0, NULL, '2026-09-03 18:49:03'),
(10, 'coordinador', 'Coordinador Académico', 'coordinador@monteverde.com', 'scrypt:32768:8:1$dkz6rx5YwztZMVBG$9d933f81efa6c15087de6029c19d6b46a7441301e19e555c800221839ed79ca2301d893484e515f80dabd31d2c9e835582290f87d03c16e25a612ce10c8c7485', NULL, 1, 0, NULL, '2026-09-03 18:46:43'),
(11, 'familia', 'Familia González', 'familiagonzalez@monteverde.com', 'scrypt:32768:8:1$ZHQR0nETiDCrHuPo$2d88d607177bc4fb98fd1be41d263cbf5ef65ec26786fbfded2a90a26937b02d043fbfa9a0a66da96861f9327f636df8516318b7196d71a3caf89bb768092559', 1, 1, 0, NULL, '2026-09-03 18:46:43'),
(52, 'docente', 'Profesor Carlos Ruiz', 'carlos.docente@monteverde.edu.co', 'scrypt:32768:8:1$fjrZDSsiucGo6p1j$d2021138bbac87f2e8aab85b5068a8036bc4397739bda06eeb503270240fc35ecaf9da36f1bbc5a6ef4c23abec4d9af7b18afb29bf7944685dac67a29dbdcad1', NULL, 1, 0, NULL, '2026-09-03 18:49:03');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `actividad_admin`
--
ALTER TABLE `actividad_admin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `estudiante_id` (`estudiante_id`,`fecha`);

--
-- Indices de la tabla `bimestres_config`
--
ALTER TABLE `bimestres_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bimestre_anio_orden` (`anio`,`orden`);

--
-- Indices de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `estudiante_id` (`estudiante_id`,`asignatura`,`periodo`);

--
-- Indices de la tabla `calificaciones_bimestre`
--
ALTER TABLE `calificaciones_bimestre`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_calif_bimestre_estudiante_indicador_nota` (`estudiante_id`,`indicador_id`,`numero_nota`),
  ADD KEY `docente_id` (`docente_id`),
  ADD KEY `indicador_id` (`indicador_id`);

--
-- Indices de la tabla `circulares`
--
ALTER TABLE `circulares`
  ADD PRIMARY KEY (`id`),
  ADD KEY `autor_id` (`autor_id`);

--
-- Indices de la tabla `configuracion_evaluacion`
--
ALTER TABLE `configuracion_evaluacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_config_eval_anio` (`anio_academico`),
  ADD KEY `fk_config_eval_usuario` (`usuario_actualizo_id`);

--
-- Indices de la tabla `configuracion_institucional`
--
ALTER TABLE `configuracion_institucional`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_config_institucion_id` (`institucion_id`),
  ADD KEY `fk_config_usuario_actualizo` (`usuario_actualizo_id`);

--
-- Indices de la tabla `conversaciones_archivadas`
--
ALTER TABLE `conversaciones_archivadas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_contacto_archivado` (`usuario_id`,`contacto_id`),
  ADD KEY `contacto_id` (`contacto_id`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `curso_materia`
--
ALTER TABLE `curso_materia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_curso_materia` (`curso_id`,`materia_id`),
  ADD KEY `fk_cm_curso` (`curso_id`),
  ADD KEY `fk_cm_materia` (`materia_id`);

--
-- Indices de la tabla `docente_asignacion`
--
ALTER TABLE `docente_asignacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_docente_curso_materia` (`docente_id`,`curso_id`,`materia_id`),
  ADD KEY `fk_da_docente` (`docente_id`),
  ADD KEY `fk_da_curso` (`curso_id`),
  ADD KEY `fk_da_materia` (`materia_id`);

--
-- Indices de la tabla `docente_curso`
--
ALTER TABLE `docente_curso`
  ADD PRIMARY KEY (`id`),
  ADD KEY `docente_id` (`docente_id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `entregas`
--
ALTER TABLE `entregas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tarea_estudiante` (`tarea_id`,`estudiante_id`),
  ADD KEY `idx_entrega_tarea_estudiante` (`tarea_id`,`estudiante_id`),
  ADD KEY `idx_entrega_estado` (`estado`),
  ADD KEY `estudiante_id` (`estudiante_id`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `familia_estudiante`
--
ALTER TABLE `familia_estudiante`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_familia_estudiante` (`familia_id`,`estudiante_id`),
  ADD KEY `estudiante_id` (`estudiante_id`);

--
-- Indices de la tabla `indicadores_logro`
--
ALTER TABLE `indicadores_logro`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_indicador_docente_curso_materia_bimestre_num` (`docente_id`,`curso_id`,`materia_id`,`bimestre_id`,`numero`),
  ADD KEY `curso_id` (`curso_id`),
  ADD KEY `materia_id` (`materia_id`),
  ADD KEY `bimestre_id` (`bimestre_id`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_materia_nombre` (`nombre`),
  ADD UNIQUE KEY `uq_materia_codigo` (`codigo`);

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
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tarea_docente_curso_materia` (`docente_id`,`curso_id`,`materia_id`),
  ADD KEY `idx_tarea_vencimiento` (`fecha_vencimiento`),
  ADD KEY `idx_tarea_estado` (`estado`),
  ADD KEY `curso_id` (`curso_id`),
  ADD KEY `materia_id` (`materia_id`);

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
-- AUTO_INCREMENT de la tabla `actividad_admin`
--
ALTER TABLE `actividad_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=221;

--
-- AUTO_INCREMENT de la tabla `bimestres_config`
--
ALTER TABLE `bimestres_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de la tabla `calificaciones_bimestre`
--
ALTER TABLE `calificaciones_bimestre`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `circulares`
--
ALTER TABLE `circulares`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `configuracion_evaluacion`
--
ALTER TABLE `configuracion_evaluacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `configuracion_institucional`
--
ALTER TABLE `configuracion_institucional`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `conversaciones_archivadas`
--
ALTER TABLE `conversaciones_archivadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `curso_materia`
--
ALTER TABLE `curso_materia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT de la tabla `docente_asignacion`
--
ALTER TABLE `docente_asignacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `docente_curso`
--
ALTER TABLE `docente_curso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `entregas`
--
ALTER TABLE `entregas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `familia_estudiante`
--
ALTER TABLE `familia_estudiante`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `indicadores_logro`
--
ALTER TABLE `indicadores_logro`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividad_admin`
--
ALTER TABLE `actividad_admin`
  ADD CONSTRAINT `actividad_admin_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

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
-- Filtros para la tabla `calificaciones_bimestre`
--
ALTER TABLE `calificaciones_bimestre`
  ADD CONSTRAINT `calificaciones_bimestre_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `calificaciones_bimestre_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `calificaciones_bimestre_ibfk_3` FOREIGN KEY (`indicador_id`) REFERENCES `indicadores_logro` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `circulares`
--
ALTER TABLE `circulares`
  ADD CONSTRAINT `circulares_ibfk_1` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `configuracion_evaluacion`
--
ALTER TABLE `configuracion_evaluacion`
  ADD CONSTRAINT `fk_config_eval_usuario` FOREIGN KEY (`usuario_actualizo_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `configuracion_institucional`
--
ALTER TABLE `configuracion_institucional`
  ADD CONSTRAINT `fk_config_usuario_actualizo` FOREIGN KEY (`usuario_actualizo_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `conversaciones_archivadas`
--
ALTER TABLE `conversaciones_archivadas`
  ADD CONSTRAINT `conversaciones_archivadas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversaciones_archivadas_ibfk_2` FOREIGN KEY (`contacto_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `curso_materia`
--
ALTER TABLE `curso_materia`
  ADD CONSTRAINT `fk_cm_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cm_materia` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `docente_asignacion`
--
ALTER TABLE `docente_asignacion`
  ADD CONSTRAINT `fk_da_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_da_docente` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_da_materia` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `docente_curso`
--
ALTER TABLE `docente_curso`
  ADD CONSTRAINT `docente_curso_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `docente_curso_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `entregas`
--
ALTER TABLE `entregas`
  ADD CONSTRAINT `entregas_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `entregas_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `familia_estudiante`
--
ALTER TABLE `familia_estudiante`
  ADD CONSTRAINT `familia_estudiante_ibfk_1` FOREIGN KEY (`familia_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `familia_estudiante_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `indicadores_logro`
--
ALTER TABLE `indicadores_logro`
  ADD CONSTRAINT `indicadores_logro_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `indicadores_logro_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `indicadores_logro_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `indicadores_logro_ibfk_4` FOREIGN KEY (`bimestre_id`) REFERENCES `bimestres_config` (`id`) ON DELETE CASCADE;

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
-- Filtros para la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
