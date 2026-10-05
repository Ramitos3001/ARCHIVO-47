package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.AcertijoDTO;
import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.dto.ResultadoRespuestaDTO;
import com.archivo47.archivo47_backend.model.Acertijo;
import com.archivo47.archivo47_backend.model.Evidencia;
import com.archivo47.archivo47_backend.model.Logro;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.model.Respuesta;
import com.archivo47.archivo47_backend.repository.AcertijoRepository;
import com.archivo47.archivo47_backend.repository.EvidenciaRepository;
import com.archivo47.archivo47_backend.repository.RespuestaRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AcertijoService {

    private final AcertijoRepository acertijoRepository;
    private final RespuestaRepository respuestaRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final PartidaService partidaService;
    private final PuntajeService puntajeService;
    private final LogroService logroService;

    public AcertijoService(AcertijoRepository acertijoRepository,
                           RespuestaRepository respuestaRepository,
                           EvidenciaRepository evidenciaRepository,
                           PartidaService partidaService,
                           PuntajeService puntajeService,
                           LogroService logroService) {
        this.acertijoRepository = acertijoRepository;
        this.respuestaRepository = respuestaRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.partidaService = partidaService;
        this.puntajeService = puntajeService;
        this.logroService = logroService;
    }

    public List<AcertijoDTO> listar(Partida partida) {
        Set<Long> resueltos = idsResueltos(partida);
        Long idCaso = partida.getCaso().getIdCaso();
        // Solo cuantas evidencias abre cada acertijo, nunca cuales (el frontend las muestra bloqueadas)
        Map<Long, Long> evidenciasPorAcertijo = evidenciaRepository.findByCaso_IdCaso(idCaso).stream()
                .map(Evidencia::getIdAcertijoDesbloqueo)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(id -> id, Collectors.counting()));
        return acertijoRepository.findByCaso_IdCaso(idCaso).stream()
                .map(a -> new AcertijoDTO(a.getIdAcertijo(), a.getPregunta(), a.getDificultad(), a.getPuntos(),
                        resueltos.contains(a.getIdAcertijo()),
                        respuestaRepository.countByPartida_IdPartidaAndAcertijo_IdAcertijo(partida.getIdPartida(), a.getIdAcertijo()),
                        evidenciasPorAcertijo.getOrDefault(a.getIdAcertijo(), 0L)))
                .toList();
    }

    @Transactional
    public ResultadoRespuestaDTO responder(Partida partida, Long idAcertijo, String texto) {
        if (!"EN_CURSO".equals(partida.getEstado())) {
            throw new IllegalStateException("La investigación ya terminó");
        }
        Acertijo acertijo = acertijoRepository.findById(idAcertijo)
                .filter(a -> a.getCaso().getIdCaso().equals(partida.getCaso().getIdCaso()))
                .orElseThrow(() -> new IllegalArgumentException("Acertijo no encontrado"));
        if (respuestaRepository.existsByPartida_IdPartidaAndAcertijo_IdAcertijoAndCorrectaTrue(partida.getIdPartida(), idAcertijo)) {
            throw new IllegalStateException("Ya resolviste este acertijo");
        }

        boolean correcta = normalizar(texto).equals(normalizar(acertijo.getRespuesta()));

        Respuesta respuesta = new Respuesta();
        respuesta.setPartida(partida);
        respuesta.setAcertijo(acertijo);
        respuesta.setContenido(texto.trim());
        respuesta.setCorrecta(correcta);
        respuesta.setFecha(LocalDateTime.now());
        respuestaRepository.save(respuesta);

        if (!correcta) {
            return new ResultadoRespuestaDTO(false, partida.getPuntaje(), List.of(), List.of());
        }
        // RN-06: al resolver el acertijo se desbloquean sus evidencias
        PuntajeDTO puntaje = puntajeService.actualizar(partida);
        List<Evidencia> desbloqueadas = evidenciaRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso()).stream()
                .filter(e -> idAcertijo.equals(e.getIdAcertijoDesbloqueo()))
                .toList();
        List<Logro> logros = logroService.evaluar(partida);
        return new ResultadoRespuestaDTO(true, puntaje.total(), desbloqueadas, logros);
    }

    // RN-09: cuantos acertijos del caso hay y cuantos resolvio la partida
    public int totalAcertijos(Partida partida) {
        return acertijoRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso()).size();
    }

    public int resueltos(Partida partida) {
        return idsResueltos(partida).size();
    }

    // Evidencias visibles para una partida: las libres y las desbloqueadas por acertijos resueltos
    public List<Evidencia> evidenciasVisibles(Partida partida) {
        Set<Long> resueltos = idsResueltos(partida);
        return evidenciaRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso()).stream()
                .filter(e -> e.getIdAcertijoDesbloqueo() == null || resueltos.contains(e.getIdAcertijoDesbloqueo()))
                .toList();
    }

    // Para el expediente: el administrador ve todo, el jugador solo lo desbloqueado en su partida
    public List<Evidencia> evidenciasVisibles(Authentication auth, Long idCaso) {
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"));
        if (esAdmin) {
            return evidenciaRepository.findByCaso_IdCaso(idCaso);
        }
        return partidaService.partidaDeCaso(auth.getName(), idCaso)
                .map(this::evidenciasVisibles)
                .orElse(List.of());
    }

    private Set<Long> idsResueltos(Partida partida) {
        return puntajeService.acertijosResueltos(partida.getIdPartida()).stream()
                .map(Acertijo::getIdAcertijo)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    // Ignora mayusculas, tildes y espacios repetidos
    private static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }
        String sinTildes = Normalizer.normalize(texto.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.replaceAll("\\s+", " ");
    }
}
