package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.service.PartidaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partidas")
public class PartidaController {

    private final PartidaService partidaService;

    public PartidaController(PartidaService partidaService) {
        this.partidaService = partidaService;
    }

    // Iniciar investigacion (o continuarla si ya existe)
    @PostMapping("/iniciar/{idCaso}")
    public ResponseEntity<?> iniciar(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        try {
            PartidaService.ResultadoInicio resultado = partidaService.iniciarOContinuar(auth.getName(), idCaso);
            HttpStatus status = resultado.nueva() ? HttpStatus.CREATED : HttpStatus.OK;
            return ResponseEntity.status(status).body(resultado.partida());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // Mis investigaciones
    @GetMapping("/mias")
    public List<Partida> mias(Authentication auth) {
        return partidaService.partidasDelUsuario(auth.getName());
    }

    // Progreso de una de mis partidas
    @GetMapping("/{idPartida}/progreso")
    public ResponseEntity<?> progreso(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        if (partidaService.partidaDelUsuario(idPartida, auth.getName()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Partida no encontrada"));
        }
        return partidaService.progresoDePartida(idPartida)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Sin progreso registrado")));
    }
}
