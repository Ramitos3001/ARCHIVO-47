package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.dto.RequisitosTeoriaDTO;
import com.archivo47.archivo47_backend.dto.ResultadoTeoriaDTO;
import com.archivo47.archivo47_backend.dto.SolucionDTO;
import com.archivo47.archivo47_backend.dto.SolucionRequest;
import com.archivo47.archivo47_backend.model.*;
import com.archivo47.archivo47_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TeoriaService {

    private final TeoriaRepository teoriaRepository;
    private final SolucionCasoRepository solucionCasoRepository;
    private final SospechosoRepository sospechosoRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final CasoRepository casoRepository;
    private final PartidaRepository partidaRepository;
    private final AcertijoService acertijoService;
    private final PuntajeService puntajeService;
    private final LogroService logroService;

    public TeoriaService(TeoriaRepository teoriaRepository,
                         SolucionCasoRepository solucionCasoRepository,
                         SospechosoRepository sospechosoRepository,
                         EvidenciaRepository evidenciaRepository,
                         CasoRepository casoRepository,
                         PartidaRepository partidaRepository,
                         AcertijoService acertijoService,
                         PuntajeService puntajeService,
                         LogroService logroService) {
        this.teoriaRepository = teoriaRepository;
        this.solucionCasoRepository = solucionCasoRepository;
        this.sospechosoRepository = sospechosoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.casoRepository = casoRepository;
        this.partidaRepository = partidaRepository;
        this.acertijoService = acertijoService;
        this.puntajeService = puntajeService;
        this.logroService = logroService;
    }

    public List<Teoria> historial(Partida partida) {
        return teoriaRepository.findByPartida_IdPartidaOrderByFechaAsc(partida.getIdPartida());
    }

    // RN-09: la teoria solo se presenta con la partida en curso, la solucion definida,
    // todos los acertijos resueltos e intentos disponibles
    public RequisitosTeoriaDTO requisitos(Partida partida) {
        Optional<SolucionCaso> solucion = solucionCasoRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso());
        int total = acertijoService.totalAcertijos(partida);
        int resueltos = acertijoService.resueltos(partida);
        long intentos = teoriaRepository.countByPartida_IdPartida(partida.getIdPartida());
        Integer maximos = solucion.map(SolucionCaso::getMaxIntentos).orElse(null);
        boolean puede = "EN_CURSO".equals(partida.getEstado())
                && solucion.isPresent()
                && resueltos >= total
                && intentos < maximos;
        return new RequisitosTeoriaDTO(resueltos, total, intentos, maximos, solucion.isPresent(), puede);
    }

    // El jugador acusa a un sospechoso; acierta si coincide el culpable y, si el caso la define, la evidencia clave
    @Transactional
    public ResultadoTeoriaDTO presentar(Partida partida, Long idSospechoso, Long idEvidencia, String movil) {
        if (!"EN_CURSO".equals(partida.getEstado())) {
            throw new IllegalStateException("La investigación ya terminó");
        }
        Long idCaso = partida.getCaso().getIdCaso();
        SolucionCaso solucion = solucionCasoRepository.findByCaso_IdCaso(idCaso)
                .orElseThrow(() -> new IllegalStateException("El caso aún no tiene solución configurada"));
        if (acertijoService.resueltos(partida) < acertijoService.totalAcertijos(partida)) {
            throw new IllegalStateException("Debes resolver todos los acertijos antes de presentar tu teoría");
        }
        long intentosPrevios = teoriaRepository.countByPartida_IdPartida(partida.getIdPartida());
        if (intentosPrevios >= solucion.getMaxIntentos()) {
            throw new IllegalStateException("Ya usaste todos los intentos");
        }

        Sospechoso sospechoso = sospechosoRepository.findById(idSospechoso)
                .filter(s -> s.getCaso().getIdCaso().equals(idCaso))
                .orElseThrow(() -> new IllegalArgumentException("Sospechoso no encontrado en este caso"));
        Evidencia evidencia = null;
        if (idEvidencia != null) {
            evidencia = acertijoService.evidenciasVisibles(partida).stream()
                    .filter(e -> e.getIdEvidencia().equals(idEvidencia))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada o aún bloqueada"));
        }

        boolean aciertaCulpable = solucion.getCulpable().getIdSospechoso().equals(sospechoso.getIdSospechoso());
        boolean aciertaEvidencia = solucion.getEvidenciaClave() == null
                || (evidencia != null && solucion.getEvidenciaClave().getIdEvidencia().equals(evidencia.getIdEvidencia()));
        boolean correcta = aciertaCulpable && aciertaEvidencia;

        Teoria teoria = new Teoria();
        teoria.setPartida(partida);
        teoria.setSospechoso(sospechoso);
        teoria.setEvidenciaClave(evidencia);
        teoria.setMovil(movil);
        teoria.setCorrecta(correcta);
        teoria.setFecha(LocalDateTime.now());
        teoriaRepository.save(teoria);

        int intentosRestantes = (int) (solucion.getMaxIntentos() - intentosPrevios - 1);
        if (correcta) {
            partida.setEstado("RESUELTA");
            partida.setFechaFin(LocalDateTime.now());
        } else if (intentosRestantes <= 0) {
            partida.setEstado("FALLIDA");
            partida.setFechaFin(LocalDateTime.now());
        }
        partidaRepository.save(partida);

        PuntajeDTO puntaje = puntajeService.actualizar(partida);
        List<Logro> logros = logroService.evaluar(partida);

        // La solucion solo se revela cuando la investigacion termina
        SolucionDTO revelada = "EN_CURSO".equals(partida.getEstado()) ? null : revelar(solucion);
        return new ResultadoTeoriaDTO(correcta, partida.getEstado(), Math.max(0, intentosRestantes),
                puntaje.total(), logros, revelada);
    }

    // Solucion de una partida terminada (para volver a consultarla)
    public SolucionDTO solucionDePartida(Partida partida) {
        if ("EN_CURSO".equals(partida.getEstado())) {
            throw new IllegalStateException("La solución se revela al terminar la investigación");
        }
        return solucionDeCaso(partida.getCaso().getIdCaso());
    }

    // RN-10: el administrador consulta y define la solucion de cada caso
    public SolucionDTO solucionDeCaso(Long idCaso) {
        return solucionCasoRepository.findByCaso_IdCaso(idCaso)
                .map(this::revelar)
                .orElseThrow(() -> new IllegalArgumentException("El caso no tiene solución configurada"));
    }

    @Transactional
    public SolucionDTO guardarSolucion(Long idCaso, SolucionRequest datos) {
        Caso caso = casoRepository.findById(idCaso)
                .orElseThrow(() -> new IllegalArgumentException("Caso no encontrado"));
        Sospechoso culpable = sospechosoRepository.findById(datos.idCulpable())
                .filter(s -> s.getCaso().getIdCaso().equals(idCaso))
                .orElseThrow(() -> new IllegalArgumentException("Sospechoso no encontrado en este caso"));
        Evidencia clave = null;
        if (datos.idEvidenciaClave() != null) {
            clave = evidenciaRepository.findById(datos.idEvidenciaClave())
                    .filter(e -> e.getCaso().getIdCaso().equals(idCaso))
                    .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada en este caso"));
        }

        SolucionCaso solucion = solucionCasoRepository.findByCaso_IdCaso(idCaso).orElseGet(SolucionCaso::new);
        solucion.setCaso(caso);
        solucion.setCulpable(culpable);
        solucion.setEvidenciaClave(clave);
        solucion.setMovil(datos.movil());
        solucion.setExplicacion(datos.explicacion());
        if (datos.maxIntentos() != null && datos.maxIntentos() > 0) {
            solucion.setMaxIntentos(datos.maxIntentos());
        }
        if (datos.puntajeBase() != null && datos.puntajeBase() >= 0) {
            solucion.setPuntajeBase(datos.puntajeBase());
        }
        return revelar(solucionCasoRepository.save(solucion));
    }

    private SolucionDTO revelar(SolucionCaso solucion) {
        Evidencia clave = solucion.getEvidenciaClave();
        return new SolucionDTO(
                solucion.getCulpable().getIdSospechoso(),
                solucion.getCulpable().getNombre(),
                clave == null ? null : clave.getIdEvidencia(),
                clave == null ? null : clave.getNombre(),
                solucion.getMovil(),
                solucion.getExplicacion(),
                solucion.getMaxIntentos(),
                solucion.getPuntajeBase());
    }
}
