package com.archivo47.archivo47_backend.dto;

// Acertijo visto por el administrador (incluye la respuesta)
public record AcertijoAdminDTO(Long idAcertijo, String pregunta, String respuesta, String dificultad, Integer puntos) {}
