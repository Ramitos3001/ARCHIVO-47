package com.archivo47.archivo47_backend.dto;

public record SolucionRequest(Long idCulpable, Long idEvidenciaClave, String movil,
                              String explicacion, Integer maxIntentos, Integer puntajeBase) {}
