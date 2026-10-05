package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.PistaDTO;
import com.archivo47.archivo47_backend.dto.PuntajeDTO;
import com.archivo47.archivo47_backend.dto.UsoPistaDTO;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.model.PartidaPista;
import com.archivo47.archivo47_backend.model.Pista;
import com.archivo47.archivo47_backend.repository.PartidaPistaRepository;
import com.archivo47.archivo47_backend.repository.PistaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PistaService {

    private final PistaRepository pistaRepository;
    private final PartidaPistaRepository partidaPistaRepository;
    private final PuntajeService puntajeService;

    public PistaService(PistaRepository pistaRepository,
                        PartidaPistaRepository partidaPistaRepository,
                        PuntajeService puntajeService) {
        this.pistaRepository = pistaRepository;
        this.partidaPistaRepository = partidaPistaRepository;
        this.puntajeService = puntajeService;
    }

    // Lista las pistas del caso; el contenido solo se muestra si la partida ya la uso
    public List<PistaDTO> listar(Partida partida) {
        Set<Long> usadas = idsUsadas(partida);
        return pistasDelCaso(partida).stream()
                .map(p -> vista(p, usadas.contains(p.getIdPista())))
                .toList();
    }

    // RN-07: entrega la siguiente pista en orden, la registra y descuenta su costo
    @Transactional
    public UsoPistaDTO usarSiguiente(Partida partida) {
        if (!"EN_CURSO".equals(partida.getEstado())) {
            throw new IllegalStateException("La investigación ya terminó");
        }
        Set<Long> usadas = idsUsadas(partida);
        List<Pista> pistas = pistasDelCaso(partida);
        Pista siguiente = pistas.stream()
                .filter(p -> !usadas.contains(p.getIdPista()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No quedan pistas disponibles"));

        PartidaPista uso = new PartidaPista();
        uso.setPartida(partida);
        uso.setPista(siguiente);
        uso.setFechaUso(LocalDateTime.now());
        partidaPistaRepository.save(uso);

        PuntajeDTO puntaje = puntajeService.actualizar(partida);
        return new UsoPistaDTO(vista(siguiente, true), pistas.size() - usadas.size() - 1, puntaje.total());
    }

    private List<Pista> pistasDelCaso(Partida partida) {
        return pistaRepository.findByCaso_IdCasoOrderByOrdenAscIdPistaAsc(partida.getCaso().getIdCaso());
    }

    private Set<Long> idsUsadas(Partida partida) {
        return partidaPistaRepository.findByPartida_IdPartida(partida.getIdPartida()).stream()
                .map(pp -> pp.getPista().getIdPista())
                .collect(Collectors.toSet());
    }

    private PistaDTO vista(Pista pista, boolean usada) {
        return new PistaDTO(pista.getIdPista(), pista.getOrden(), pista.getImportancia(), pista.getCosto(), usada,
                usada ? pista.getDescripcion() : null,
                usada ? pista.getArchivo() : null);
    }
}
