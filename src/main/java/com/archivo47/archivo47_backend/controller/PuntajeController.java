package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.repository.PartidaRepository;
import com.archivo47.archivo47_backend.service.PartidaService;
import com.archivo47.archivo47_backend.service.PuntajeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PuntajeController {

    private final PartidaService partidaService;
    private final PuntajeService puntajeService;

    public PuntajeController(PartidaService partidaService, PuntajeService puntajeService) {
        this.partidaService = partidaService;
        this.puntajeService = puntajeService;
    }

    // Desglose del puntaje de una de mis partidas
    @GetMapping("/partidas/{idPartida}/puntaje")
    public ResponseEntity<?> puntaje(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return partidaService.partidaDelUsuario(idPartida, auth.getName())
                .<ResponseEntity<?>>map(p -> ResponseEntity.ok(puntajeService.calcular(p)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Partida no encontrada")));
    }

    // Ranking de jugadores por puntaje acumulado en casos resueltos
    @GetMapping("/ranking")
    public List<PartidaRepository.FilaRanking> ranking() {
        return puntajeService.ranking();
    }
}
