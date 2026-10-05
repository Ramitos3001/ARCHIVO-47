package com.archivo47.archivo47_backend.dto;

// Pista vista por el investigador: el contenido solo va si ya la uso
public record PistaDTO(Long idPista, Integer orden, String importancia, Integer costo,
                       boolean usada, String descripcion, String archivo) {}
