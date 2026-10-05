package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.model.Acertijo;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.model.Respuesta;
import com.archivo47.archivo47_backend.model.SolucionCaso;
import com.archivo47.archivo47_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class PuntajeService {

    // Penalizacion por cada teoria incorrecta
    public static final int PENALIZACION_TEORIA = 200;

    private final PartidaRepository partidaRepository;
    private final ProgresoRepository progresoRepository;
    private final RespuestaRepository respuestaRepository;
    private final PartidaPistaRepository partidaPistaRepository;
    private final TeoriaRepository teoriaRepository;
    private final AcertijoRepository acertijoRepository;
    private final SolucionCasoRepository solucionCasoRepository;

    public PuntajeService(PartidaRepository partidaRepository,
                          ProgresoRepository progresoRepository,
                          RespuestaRepository respuestaRepository,
                          PartidaPistaRepository partidaPistaRepository,
                          TeoriaRepository teoriaRepository,
                          AcertijoRepository acertijoRepository,
                          SolucionCasoRepository solucionCasoRepository) {
        this.partidaRepository = partidaRepository;
        this.progresoRepository = progresoRepository;
        this.respuestaRepository = respuestaRepository;
        this.partidaPistaRepository = partidaPistaRepository;
        this.teoriaRepository = teoriaRepository;
        this.acertijoRepository = acertijoRepository;
        this.solucionCasoRepository = solucionCasoRepository;
    }

    // Acertijos que la partida ya resolvio (al menos una respuesta correcta)
    public List<Acertijo> acertijosResueltos(Long idPartida) {
        return respuestaRepository.findByPartida_IdPartidaAndCorrectaTrue(idPartida).stream()
                .map(Respuesta::getAcertijo)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    // El puntaje se recalcula desde cero para que siempre coincida con lo registrado
    public PuntajeDTO calcular(Partida partida) {
        Long idPartida = partida.getIdPartida();
        int base = "RESUELTA".equals(partida.getEstado())
                ? solucionCasoRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso())
                        .map(SolucionCaso::getPuntajeBase).orElse(0)
                : 0;
        int acertijos = acertijosResueltos(idPartida).stream()
                .mapToInt(a -> valor(a.getPuntos())).sum();
        int pistas = partidaPistaRepository.findByPartida_IdPartida(idPartida).stream()
                .mapToInt(pp -> valor(pp.getPista().getCosto())).sum();
        int teorias = (int) teoriaRepository.countByPartida_IdPartidaAndCorrectaFalse(idPartida) * PENALIZACION_TEORIA;
        int total = Math.max(0, base + acertijos - pistas - teorias);
        return new PuntajeDTO(base, acertijos, pistas, teorias, total);
    }

    // Guarda puntaje y progreso de la partida tras cualquier accion del jugador
    @Transactional
    public PuntajeDTO actualizar(Partida partida) {
        PuntajeDTO desglose = calcular(partida);
        Long idPartida = partida.getIdPartida();

        int totalAcertijos = acertijoRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso()).size();
        int resueltos = acertijosResueltos(idPartida).size();
        double porcentaje;
        if ("RESUELTA".equals(partida.getEstado())) {
            porcentaje = 100.0;
        } else {
            porcentaje = totalAcertijos == 0 ? 0.0 : Math.round(resueltos * 900.0 / totalAcertijos) / 10.0;
        }

        partida.setPuntaje(desglose.total());
        partida.setProgreso(porcentaje);
        partidaRepository.save(partida);

        progresoRepository.findByPartida_IdPartida(idPartida).ifPresent(progreso -> {
            progreso.setPorcentaje(porcentaje);
            progreso.setAcertijosResueltos(resueltos);
            progreso.setPistasEncontradas((int) partidaPistaRepository.countByPartida_IdPartida(idPartida));
            progresoRepository.save(progreso);
        });
        return desglose;
    }

    public List<PartidaRepository.FilaRanking> ranking() {
        return partidaRepository.ranking();
    }

    private static int valor(Integer numero) {
        return numero == null ? 0 : numero;
    }
}
