-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema archivo47_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema archivo47_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `archivo47_db` DEFAULT CHARACTER SET utf8mb4 ;
USE `archivo47_db` ;

-- -----------------------------------------------------
-- Table `archivo47_db`.`caso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`caso` (
  `id_caso` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `dificultad` VARCHAR(50) NOT NULL,
  `estado` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`acertijo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`acertijo` (
  `id_acertijo` INT(11) NOT NULL AUTO_INCREMENT,
  `pregunta` TEXT NOT NULL,
  `respuesta` VARCHAR(150) NOT NULL,
  `dificultad` VARCHAR(50) NOT NULL,
  `resultado` TINYINT(1) NULL DEFAULT 0,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_acertijo`),
  INDEX `fk_acertijo_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_acertijo_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`acontecimiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`acontecimiento` (
  `id_acontecimiento` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `fecha` DATETIME NOT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_acontecimiento`),
  INDEX `fk_acontecimiento_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_acontecimiento_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`sospechoso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`sospechoso` (
  `id_sospechoso` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `perfil` VARCHAR(100) NULL DEFAULT NULL,
  `relacion_con_caso` TEXT NULL DEFAULT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_sospechoso`),
  INDEX `fk_sospechoso_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_sospechoso_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`declaracion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`declaracion` (
  `id_declaracion` INT(11) NOT NULL AUTO_INCREMENT,
  `contenido` TEXT NOT NULL,
  `fecha` DATETIME NOT NULL,
  `credibilidad` VARCHAR(50) NULL DEFAULT NULL,
  `id_caso` INT(11) NOT NULL,
  `id_sospechoso` INT(11) NOT NULL,
  PRIMARY KEY (`id_declaracion`),
  INDEX `fk_declaracion_caso` (`id_caso` ASC) VISIBLE,
  INDEX `fk_declaracion_sospechoso` (`id_sospechoso` ASC) VISIBLE,
  CONSTRAINT `fk_declaracion_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`),
  CONSTRAINT `fk_declaracion_sospechoso`
    FOREIGN KEY (`id_sospechoso`)
    REFERENCES `archivo47_db`.`sospechoso` (`id_sospechoso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`documento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`documento` (
  `id_documento` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(150) NOT NULL,
  `contenido` TEXT NOT NULL,
  `fecha_registro` DATETIME NOT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_documento`),
  INDEX `fk_documento_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_documento_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`evidencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`evidencia` (
  `id_evidencia` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_evidencia`),
  INDEX `fk_evidencia_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_evidencia_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`llamada`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`llamada` (
  `id_llamada` INT(11) NOT NULL AUTO_INCREMENT,
  `origen` VARCHAR(50) NOT NULL,
  `destino` VARCHAR(50) NOT NULL,
  `fecha` DATETIME NOT NULL,
  `duracion` INT(11) NOT NULL,
  `transcripcion` TEXT NULL DEFAULT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_llamada`),
  INDEX `fk_llamada_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_llamada_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`logro`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`logro` (
  `id_logro` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `condicion` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id_logro`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`mensaje`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`mensaje` (
  `id_mensaje` INT(11) NOT NULL AUTO_INCREMENT,
  `remitente` VARCHAR(100) NOT NULL,
  `destinatario` VARCHAR(100) NOT NULL,
  `contenido` TEXT NOT NULL,
  `fecha` DATETIME NOT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_mensaje`),
  INDEX `fk_mensaje_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_mensaje_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`usuario` (
  `id_usuario` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `correo` (`correo` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`partida`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`partida` (
  `id_partida` INT(11) NOT NULL AUTO_INCREMENT,
  `fecha_inicio` DATETIME NOT NULL,
  `fecha_fin` DATETIME NULL DEFAULT NULL,
  `estado` VARCHAR(50) NOT NULL,
  `progreso` DOUBLE NULL DEFAULT 0,
  `id_usuario` INT(11) NOT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_partida`),
  INDEX `fk_partida_usuario` (`id_usuario` ASC) VISIBLE,
  INDEX `fk_partida_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_partida_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`),
  CONSTRAINT `fk_partida_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `archivo47_db`.`usuario` (`id_usuario`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`pista`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`pista` (
  `id_pista` INT(11) NOT NULL AUTO_INCREMENT,
  `descripcion` TEXT NOT NULL,
  `importancia` VARCHAR(50) NOT NULL,
  `archivo` VARCHAR(150) NULL DEFAULT NULL,
  `descubierta` TINYINT(1) NULL DEFAULT 0,
  `fecha_encontrada` DATETIME NULL DEFAULT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_pista`),
  INDEX `fk_pista_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_pista_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`progreso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`progreso` (
  `id_progreso` INT(11) NOT NULL AUTO_INCREMENT,
  `porcentaje` DOUBLE NULL DEFAULT 0,
  `pistas_encontradas` INT(11) NULL DEFAULT 0,
  `evidencias_analizadas` INT(11) NULL DEFAULT 0,
  `acertijos_resueltos` INT(11) NULL DEFAULT 0,
  `id_partida` INT(11) NOT NULL,
  PRIMARY KEY (`id_progreso`),
  INDEX `fk_progreso_partida` (`id_partida` ASC) VISIBLE,
  CONSTRAINT `fk_progreso_partida`
    FOREIGN KEY (`id_partida`)
    REFERENCES `archivo47_db`.`partida` (`id_partida`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`respuesta`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`respuesta` (
  `id_respuesta` INT(11) NOT NULL AUTO_INCREMENT,
  `contenido` TEXT NOT NULL,
  `correcta` TINYINT(1) NOT NULL,
  `fecha` DATETIME NOT NULL,
  `id_partida` INT(11) NOT NULL,
  PRIMARY KEY (`id_respuesta`),
  INDEX `fk_respuesta_partida` (`id_partida` ASC) VISIBLE,
  CONSTRAINT `fk_respuesta_partida`
    FOREIGN KEY (`id_partida`)
    REFERENCES `archivo47_db`.`partida` (`id_partida`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`ubicacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`ubicacion` (
  `id_ubicacion` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(150) NULL DEFAULT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `id_caso` INT(11) NOT NULL,
  PRIMARY KEY (`id_ubicacion`),
  INDEX `fk_ubicacion_caso` (`id_caso` ASC) VISIBLE,
  CONSTRAINT `fk_ubicacion_caso`
    FOREIGN KEY (`id_caso`)
    REFERENCES `archivo47_db`.`caso` (`id_caso`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `archivo47_db`.`usuario_logro`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `archivo47_db`.`usuario_logro` (
  `id_usuario_logro` INT(11) NOT NULL AUTO_INCREMENT,
  `fecha_obtencion` DATETIME NOT NULL,
  `id_usuario` INT(11) NOT NULL,
  `id_logro` INT(11) NOT NULL,
  PRIMARY KEY (`id_usuario_logro`),
  INDEX `fk_ul_usuario` (`id_usuario` ASC) VISIBLE,
  INDEX `fk_ul_logro` (`id_logro` ASC) VISIBLE,
  CONSTRAINT `fk_ul_logro`
    FOREIGN KEY (`id_logro`)
    REFERENCES `archivo47_db`.`logro` (`id_logro`),
  CONSTRAINT `fk_ul_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `archivo47_db`.`usuario` (`id_usuario`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
