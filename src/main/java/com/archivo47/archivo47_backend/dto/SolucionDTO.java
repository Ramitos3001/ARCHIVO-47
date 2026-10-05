package com.archivo47.archivo47_backend.dto;

// Solucion revelada: solo al terminar la partida o al administrador
public record SolucionDTO(Long idCulpable, String culpable, Long idEvidenciaClave, String evidenciaClave,
                          String movil, String explicacion, Integer maxIntentos, Integer puntajeBase) {}
