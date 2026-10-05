package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.service.PartidaService;
import com.archivo47.archivo47_backend.service.PistaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@RestController
@RequestMapping("/api/partidas/{idPartida}/pistas")
public class PistaController {

    private final PartidaService partidaService;
    private final PistaService pistaService;

    public PistaController(PartidaService partidaService, PistaService pistaService) {
        this.partidaService = partidaService;
        this.pistaService = pistaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, pistaService::listar);
    }

    // Pedir la siguiente pista (resta puntos)
    @PostMapping("/usar")
    public ResponseEntity<?> usar(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, pistaService::usarSiguiente);
    }

    private ResponseEntity<?> conPartida(Long idPartida, Authentication auth, Function<Partida, ?> accion) {
        Optional<Partida> partida = partidaService.partidaDelUsuario(idPartida, auth.getName());
        if (partida.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Partida no encontrada"));
        }
        try {
            return ResponseEntity.ok(accion.apply(partida.get()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }
}
