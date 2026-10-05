package com.archivo47.archivo47_backend.dto;

import com.archivo47.archivo47_backend.model.Logro;

import java.util.List;

// solucion es null mientras la partida siga EN_CURSO
public record ResultadoTeoriaDTO(boolean correcta, String estado, int intentosRestantes, int puntaje,
                                 List<Logro> logrosNuevos, SolucionDTO solucion) {}
