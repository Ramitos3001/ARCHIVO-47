package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.dto.RequisitosTeoriaDTO;
import com.archivo47.archivo47_backend.dto.ResultadoTeoriaDTO;
import com.archivo47.archivo47_backend.model.*;
import com.archivo47.archivo47_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TeoriaServiceTest {

    private TeoriaRepository teoriaRepository;
    private SolucionCasoRepository solucionCasoRepository;
    private SospechosoRepository sospechosoRepository;
    private AcertijoService acertijoService;
    private PuntajeService puntajeService;
    private LogroService logroService;
    private TeoriaService teoriaService;

    private Caso caso;
    private Sospechoso culpable;
    private Sospechoso inocente;
    private SolucionCaso solucion;

    @BeforeEach
    void preparar() {
        teoriaRepository = mock(TeoriaRepository.class);
        solucionCasoRepository = mock(SolucionCasoRepository.class);
        sospechosoRepository = mock(SospechosoRepository.class);
        acertijoService = mock(AcertijoService.class);
        puntajeService = mock(PuntajeService.class);
        logroService = mock(LogroService.class);
        teoriaService = new TeoriaService(teoriaRepository, solucionCasoRepository, sospechosoRepository,
                mock(EvidenciaRepository.class), mock(CasoRepository.class), mock(PartidaRepository.class),
                acertijoService, puntajeService, logroService);

        caso = new Caso();
        caso.setIdCaso(1L);
        culpable = sospechoso(2L, "Julián Ortega");
        inocente = sospechoso(3L, "Elena Ruiz");

        solucion = new SolucionCaso();
        solucion.setCaso(caso);
        solucion.setCulpable(culpable);
        solucion.setExplicacion("Explicación");
        solucion.setMaxIntentos(3);
        solucion.setPuntajeBase(1000);

        when(solucionCasoRepository.findByCaso_IdCaso(1L)).thenReturn(Optional.of(solucion));
        when(sospechosoRepository.findById(2L)).thenReturn(Optional.of(culpable));
        when(sospechosoRepository.findById(3L)).thenReturn(Optional.of(inocente));
        when(acertijoService.totalAcertijos(any())).thenReturn(2);
        when(acertijoService.resueltos(any())).thenReturn(2);
        when(puntajeService.actualizar(any())).thenReturn(new PuntajeDTO(0, 0, 0, 0, 500));
        when(logroService.evaluar(any())).thenReturn(List.of());
    }

    @Test
    void rechazaLaTeoriaSiFaltanAcertijos() {
        when(acertijoService.resueltos(any())).thenReturn(1);

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> teoriaService.presentar(partida("EN_CURSO"), 2L, null, null));

        assertTrue(error.getMessage().contains("acertijos"));
        verify(teoriaRepository, never()).save(any());
    }

    @Test
    void requisitosIndicanSiPuedePresentar() {
        when(acertijoService.resueltos(any())).thenReturn(1);
        RequisitosTeoriaDTO pendiente = teoriaService.requisitos(partida("EN_CURSO"));
        assertFalse(pendiente.puedePresentar());

        when(acertijoService.resueltos(any())).thenReturn(2);
        RequisitosTeoriaDTO listo = teoriaService.requisitos(partida("EN_CURSO"));
        assertTrue(listo.puedePresentar());
    }

    @Test
    void teoriaCorrectaResuelveLaPartidaYRevelaLaSolucion() {
        Partida partida = partida("EN_CURSO");

        ResultadoTeoriaDTO resultado = teoriaService.presentar(partida, 2L, null, "Desfalco");

        assertTrue(resultado.correcta());
        assertEquals("RESUELTA", resultado.estado());
        assertEquals("RESUELTA", partida.getEstado());
        assertNotNull(partida.getFechaFin());
        assertNotNull(resultado.solucion());
        assertEquals("Julián Ortega", resultado.solucion().culpable());
    }

    @Test
    void teoriaIncorrectaConIntentosNoRevelaLaSolucion() {
        when(teoriaRepository.countByPartida_IdPartida(10L)).thenReturn(0L);

        ResultadoTeoriaDTO resultado = teoriaService.presentar(partida("EN_CURSO"), 3L, null, null);

        assertFalse(resultado.correcta());
        assertEquals("EN_CURSO", resultado.estado());
        assertEquals(2, resultado.intentosRestantes());
        assertNull(resultado.solucion());
    }

    @Test
    void agotarLosIntentosMarcaLaPartidaComoFallida() {
        when(teoriaRepository.countByPartida_IdPartida(10L)).thenReturn(2L);

        ResultadoTeoriaDTO resultado = teoriaService.presentar(partida("EN_CURSO"), 3L, null, null);

        assertEquals("FALLIDA", resultado.estado());
        assertEquals(0, resultado.intentosRestantes());
        assertNotNull(resultado.solucion());
    }

    @Test
    void partidaTerminadaNoAdmiteMasTeorias() {
        assertThrows(IllegalStateException.class,
                () -> teoriaService.presentar(partida("RESUELTA"), 2L, null, null));
    }

    private Partida partida(String estado) {
        Partida partida = new Partida();
        partida.setIdPartida(10L);
        partida.setCaso(caso);
        partida.setEstado(estado);
        return partida;
    }

    private Sospechoso sospechoso(Long id, String nombre) {
        Sospechoso s = new Sospechoso();
        s.setIdSospechoso(id);
        s.setNombre(nombre);
        s.setCaso(caso);
        return s;
    }
}
