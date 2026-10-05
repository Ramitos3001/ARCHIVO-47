package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.model.*;
import com.archivo47.archivo47_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class PuntajeServiceTest {

    private RespuestaRepository respuestaRepository;
    private PartidaPistaRepository partidaPistaRepository;
    private TeoriaRepository teoriaRepository;
    private SolucionCasoRepository solucionCasoRepository;
    private PuntajeService puntajeService;

    private Caso caso;

    @BeforeEach
    void preparar() {
        respuestaRepository = mock(RespuestaRepository.class);
        partidaPistaRepository = mock(PartidaPistaRepository.class);
        teoriaRepository = mock(TeoriaRepository.class);
        solucionCasoRepository = mock(SolucionCasoRepository.class);
        puntajeService = new PuntajeService(mock(PartidaRepository.class), mock(ProgresoRepository.class),
                respuestaRepository, partidaPistaRepository, teoriaRepository,
                mock(AcertijoRepository.class), solucionCasoRepository);

        caso = new Caso();
        caso.setIdCaso(1L);
        SolucionCaso solucion = new SolucionCaso();
        solucion.setPuntajeBase(1000);
        when(solucionCasoRepository.findByCaso_IdCaso(1L)).thenReturn(Optional.of(solucion));
    }

    @Test
    void casoResueltoSumaBaseYAcertijosYRestaPistasYTeoriasFallidas() {
        when(respuestaRepository.findByPartida_IdPartidaAndCorrectaTrue(10L)).thenReturn(List.of(respuestaCorrecta(100)));
        when(partidaPistaRepository.findByPartida_IdPartida(10L)).thenReturn(List.of(usoDePista(50)));
        when(teoriaRepository.countByPartida_IdPartidaAndCorrectaFalse(10L)).thenReturn(1L);

        PuntajeDTO puntaje = puntajeService.calcular(partida("RESUELTA"));

        assertEquals(1000, puntaje.puntajeBase());
        assertEquals(100, puntaje.puntosAcertijos());
        assertEquals(50, puntaje.costoPistas());
        assertEquals(PuntajeService.PENALIZACION_TEORIA, puntaje.penalizacionTeorias());
        assertEquals(1000 + 100 - 50 - 200, puntaje.total());
    }

    @Test
    void sinResolverNoHayPuntajeBaseYNuncaEsNegativo() {
        when(respuestaRepository.findByPartida_IdPartidaAndCorrectaTrue(10L)).thenReturn(List.of());
        when(partidaPistaRepository.findByPartida_IdPartida(10L)).thenReturn(List.of(usoDePista(100), usoDePista(100)));

        PuntajeDTO puntaje = puntajeService.calcular(partida("EN_CURSO"));

        assertEquals(0, puntaje.puntajeBase());
        assertEquals(0, puntaje.total());
    }

    private Partida partida(String estado) {
        Partida partida = new Partida();
        partida.setIdPartida(10L);
        partida.setCaso(caso);
        partida.setEstado(estado);
        return partida;
    }

    private Respuesta respuestaCorrecta(int puntos) {
        Acertijo acertijo = new Acertijo();
        acertijo.setIdAcertijo(5L);
        acertijo.setPuntos(puntos);
        Respuesta respuesta = new Respuesta();
        respuesta.setAcertijo(acertijo);
        respuesta.setCorrecta(true);
        return respuesta;
    }

    private PartidaPista usoDePista(int costo) {
        Pista pista = new Pista();
        pista.setCosto(costo);
        PartidaPista uso = new PartidaPista();
        uso.setPista(pista);
        return uso;
    }
}
