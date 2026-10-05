package com.archivo47.archivo47_backend.dto;

import com.archivo47.archivo47_backend.model.Evidencia;
import com.archivo47.archivo47_backend.model.Logro;

import java.util.List;

public record ResultadoRespuestaDTO(boolean correcta, int puntaje,
                                    List<Evidencia> evidenciasDesbloqueadas, List<Logro> logrosNuevos) {}
