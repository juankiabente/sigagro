-- =====================================================================
--  SIGAgro — Base de datos (AE3: autenticación)
--  Importar en phpMyAdmin: pestaña "Importar" → elegir este archivo.
-- =====================================================================

SET NAMES utf8mb4;  -- para que los acentos (Martín, Análisis) se guarden bien

CREATE DATABASE IF NOT EXISTS sigagro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sigagro;

-- ---------------------------------------------------------------------
--  Tabla usuarios
--  El campo password es VARCHAR(255) porque guarda el HASH BCRYPT
--  (unos 60 caracteres hoy, pero el formato puede crecer en el futuro).
--  Nunca se guarda la contraseña en texto plano.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  rol        ENUM('productor', 'tecnico', 'agronomo', 'administrador')
             NOT NULL DEFAULT 'productor',
  creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Tabla solicitudes
--  Las solicitudes de análisis que cada usuario envía al laboratorio
--  (la página comprar.html). Es el dato PRIVADO que protege
--  api/mis_solicitudes.php: cada usuario ve solo las suyas.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  parcela     VARCHAR(100) NOT NULL,
  analisis    VARCHAR(150) NOT NULL,
  muestras    INT UNSIGNED NOT NULL DEFAULT 1,
  total       DECIMAL(10, 2) NOT NULL,
  estado      ENUM('pendiente', 'en_laboratorio', 'finalizada')
              NOT NULL DEFAULT 'pendiente',
  fecha       DATE NOT NULL,
  CONSTRAINT fk_solicitudes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Datos de prueba
--  Usuario demo:  demo@sigagro.com  /  contraseña: sigagro123
--  (el valor de password es el hash BCRYPT de "sigagro123",
--   generado con password_hash("sigagro123", PASSWORD_BCRYPT))
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Martín Duarte', 'demo@sigagro.com',
   '$2y$10$AQISvaPyGuwdHFUBcGy1jeYA8fQ/xQ0Eeiuzdg9qibofS5Ko7O2oS', 'agronomo');

INSERT INTO solicitudes (usuario_id, parcela, analisis, muestras, total, estado, fecha) VALUES
  (1, 'P-08 Frente Ruta',         'Análisis físico-químico de suelo', 2, 37000.00, 'finalizada',     '2026-09-08'),
  (1, 'P-08 Frente Ruta',         'Análisis foliar completo',         1, 22000.00, 'en_laboratorio', '2026-09-08'),
  (1, 'P-10 Cantera',             'Diagnóstico fitopatológico',       1, 15800.00, 'pendiente',      '2026-09-29'),
  (1, 'P-05 Módulo hidropónico',  'Análisis de agua de riego',        1,  9600.00, 'pendiente',      '2026-10-02');
