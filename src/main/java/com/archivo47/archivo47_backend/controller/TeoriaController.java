package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.dto.TeoriaRequest;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.service.PartidaService;
import com.archivo47.archivo47_backend.service.TeoriaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@RestController
@RequestMapping("/api/partidas/{idPartida}")
public class TeoriaController {

    private final PartidaService partidaService;
    private final TeoriaService teoriaService;

    public TeoriaController(PartidaService partidaService, TeoriaService teoriaService) {
        this.partidaService = partidaService;
        this.teoriaService = teoriaService;
    }

    // Presentar la teoria final (acusacion)
    @PostMapping("/teoria")
    public ResponseEntity<?> presentar(@PathVariable("idPartida") Long idPartida,
                                       @RequestBody TeoriaRequest request,
                                       Authentication auth) {
        if (request == null || request.idSospechoso() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Debes indicar el sospechoso"));
        }
        return conPartida(idPartida, auth,
                p -> teoriaService.presentar(p, request.idSospechoso(), request.idEvidenciaClave(), request.movil()));
    }

    // RN-09: condiciones para poder presentar la teoria
    @GetMapping("/teoria/requisitos")
    public ResponseEntity<?> requisitos(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, teoriaService::requisitos);
    }

    @GetMapping("/teorias")
    public ResponseEntity<?> historial(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, teoriaService::historial);
    }

    @GetMapping("/solucion")
    public ResponseEntity<?> solucion(@PathVariable("idPartida") Long idPartida, Authentication auth) {
        return conPartida(idPartida, auth, teoriaService::solucionDePartida);
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
