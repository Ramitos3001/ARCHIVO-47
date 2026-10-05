package com.archivo47.archivo47_backend.dto;

// RN-09: estado de las condiciones para presentar la teoria
public record RequisitosTeoriaDTO(int acertijosResueltos, int acertijosTotales, long intentosUsados,
                                  Integer intentosMaximos, boolean solucionConfigurada, boolean puedePresentar) {}
