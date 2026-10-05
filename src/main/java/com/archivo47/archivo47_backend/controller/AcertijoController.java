package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.dto.RespuestaRequest;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.service.AcertijoService;
import com.archivo47.archivo47_backend.service.PartidaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@RestController
@RequestMapping("/api/partidas/{idPartida}")
public class AcertijoController {

    private final PartidaService partidaService;
    private final AcertijoService acertijoService;

    public AcertijoController(PartidaService partidaService, AcertijoService acertijoService) {
        this.partidaService = partidaService;
        this.acertijoService = acertijoService;
    }

    @GetMapping("/acertijos")
    public ResponseEntity<?> listar(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, acertijoService::listar);
    }

    @PostMapping("/acertijos/{idAcertijo}/responder")
    public ResponseEntity<?> responder(@PathVariable("idPartida") Long idPartida,
                                       @PathVariable("idAcertijo") Long idAcertijo,
                                       @RequestBody RespuestaRequest request,
                                       Authentication auth) {
        if (request == null || request.respuesta() == null || request.respuesta().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La respuesta no puede estar vacía"));
        }
        return conPartida(idPartida, auth, p -> acertijoService.responder(p, idAcertijo, request.respuesta()));
    }

    // Evidencias visibles en esta partida (sin las bloqueadas)
    @GetMapping("/evidencias")
    public ResponseEntity<?> evidencias(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, acertijoService::evidenciasVisibles);
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
