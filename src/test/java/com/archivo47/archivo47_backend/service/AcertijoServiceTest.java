package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.AcertijoDTO;
import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.dto.ResultadoRespuestaDTO;
import com.archivo47.archivo47_backend.model.*;
import com.archivo47.archivo47_backend.repository.AcertijoRepository;
import com.archivo47.archivo47_backend.repository.EvidenciaRepository;
import com.archivo47.archivo47_backend.repository.RespuestaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AcertijoServiceTest {

    private AcertijoRepository acertijoRepository;
    private RespuestaRepository respuestaRepository;
    private EvidenciaRepository evidenciaRepository;
    private PuntajeService puntajeService;
    private AcertijoService acertijoService;

    private Caso caso;
    private Partida partida;
    private Acertijo acertijo;
    private Evidencia libre;
    private Evidencia bloqueada;

    @BeforeEach
    void preparar() {
        acertijoRepository = mock(AcertijoRepository.class);
        respuestaRepository = mock(RespuestaRepository.class);
        evidenciaRepository = mock(EvidenciaRepository.class);
        puntajeService = mock(PuntajeService.class);
        LogroService logroService = mock(LogroService.class);
        acertijoService = new AcertijoService(acertijoRepository, respuestaRepository, evidenciaRepository,
                mock(PartidaService.class), puntajeService, logroService);

        caso = new Caso();
        caso.setIdCaso(1L);
        partida = new Partida();
        partida.setIdPartida(10L);
        partida.setCaso(caso);
        partida.setEstado("EN_CURSO");
        partida.setPuntaje(0);

        acertijo = new Acertijo();
        acertijo.setIdAcertijo(5L);
        acertijo.setRespuesta("Tomás");
        acertijo.setPuntos(100);
        acertijo.setCaso(caso);

        libre = evidencia(1L, null);
        bloqueada = evidencia(2L, acertijo);

        when(acertijoRepository.findById(5L)).thenReturn(Optional.of(acertijo));
        when(evidenciaRepository.findByCaso_IdCaso(1L)).thenReturn(List.of(libre, bloqueada));
        when(puntajeService.actualizar(any())).thenReturn(new PuntajeDTO(0, 100, 0, 0, 100));
        when(logroService.evaluar(any())).thenReturn(List.of());
    }

    @Test
    void respuestaCorrectaIgnoraMayusculasTildesYEspacios() {
        ResultadoRespuestaDTO resultado = acertijoService.responder(partida, 5L, "   TOMAS  ");

        assertTrue(resultado.correcta());
        assertEquals(100, resultado.puntaje());
        assertEquals(List.of(bloqueada), resultado.evidenciasDesbloqueadas());
    }

    @Test
    void respuestaIncorrectaNoDesbloqueaNiSumaPuntos() {
        ResultadoRespuestaDTO resultado = acertijoService.responder(partida, 5L, "Marta");

        assertFalse(resultado.correcta());
        assertTrue(resultado.evidenciasDesbloqueadas().isEmpty());
        verify(puntajeService, never()).actualizar(any());
        verify(respuestaRepository).save(any());
    }

    @Test
    void acertijoYaResueltoNoSePuedeResponderOtraVez() {
        when(respuestaRepository.existsByPartida_IdPartidaAndAcertijo_IdAcertijoAndCorrectaTrue(10L, 5L)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> acertijoService.responder(partida, 5L, "Tomás"));
    }

    @Test
    void acertijoDeOtroCasoNoSeEncuentra() {
        Caso otro = new Caso();
        otro.setIdCaso(2L);
        acertijo.setCaso(otro);

        assertThrows(IllegalArgumentException.class, () -> acertijoService.responder(partida, 5L, "Tomás"));
    }

    @Test
    void lasEvidenciasBloqueadasNoSeVenHastaResolverElAcertijo() {
        when(puntajeService.acertijosResueltos(10L)).thenReturn(List.of());
        assertEquals(List.of(libre), acertijoService.evidenciasVisibles(partida));

        when(puntajeService.acertijosResueltos(10L)).thenReturn(List.of(acertijo));
        assertEquals(List.of(libre, bloqueada), acertijoService.evidenciasVisibles(partida));
    }

    @Test
    void elListadoIndicaCuantasEvidenciasDesbloqueaCadaAcertijo() {
        Acertijo sinEvidencias = new Acertijo();
        sinEvidencias.setIdAcertijo(6L);
        sinEvidencias.setCaso(caso);
        when(acertijoRepository.findByCaso_IdCaso(1L)).thenReturn(List.of(acertijo, sinEvidencias));
        when(puntajeService.acertijosResueltos(10L)).thenReturn(List.of());

        List<AcertijoDTO> lista = acertijoService.listar(partida);

        assertEquals(1, lista.get(0).evidenciasQueDesbloquea());
        assertEquals(0, lista.get(1).evidenciasQueDesbloquea());
    }

    private Evidencia evidencia(Long id, Acertijo desbloqueo) {
        Evidencia e = new Evidencia();
        e.setIdEvidencia(id);
        e.setCaso(caso);
        e.setAcertijoDesbloqueo(desbloqueo);
        return e;
    }
}
