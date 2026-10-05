package com.archivo47.archivo47_backend.dto;

// Acertijo visto por el investigador (sin la respuesta).
// evidenciasQueDesbloquea: cuantas evidencias abre al resolverlo (sin revelar cuales).
public record AcertijoDTO(Long idAcertijo, String pregunta, String dificultad, Integer puntos,
                          boolean resuelto, long intentos, long evidenciasQueDesbloquea) {}
