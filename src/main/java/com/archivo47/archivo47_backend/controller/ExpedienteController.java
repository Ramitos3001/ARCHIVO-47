package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.repository.*;
import com.archivo47.archivo47_backend.service.AcertijoService;
import com.archivo47.archivo47_backend.service.PartidaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/casos/{idCaso}/expediente")
public class ExpedienteController {

    private final PartidaService partidaService;
    private final SospechosoRepository sospechosoRepository;
    private final AcertijoService acertijoService;
    private final DocumentoRepository documentoRepository;
    private final MensajeRepository mensajeRepository;
    private final LlamadaRepository llamadaRepository;
    private final UbicacionRepository ubicacionRepository;
    private final DeclaracionRepository declaracionRepository;
    private final AcontecimientoRepository acontecimientoRepository;

    public ExpedienteController(PartidaService partidaService,
                                SospechosoRepository sospechosoRepository,
                                AcertijoService acertijoService,
                                DocumentoRepository documentoRepository,
                                MensajeRepository mensajeRepository,
                                LlamadaRepository llamadaRepository,
                                UbicacionRepository ubicacionRepository,
                                DeclaracionRepository declaracionRepository,
                                AcontecimientoRepository acontecimientoRepository) {
        this.partidaService = partidaService;
        this.sospechosoRepository = sospechosoRepository;
        this.acertijoService = acertijoService;
        this.documentoRepository = documentoRepository;
        this.mensajeRepository = mensajeRepository;
        this.llamadaRepository = llamadaRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.declaracionRepository = declaracionRepository;
        this.acontecimientoRepository = acontecimientoRepository;
    }

    @GetMapping("/sospechosos")
    public ResponseEntity<?> sospechosos(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> sospechosoRepository.findByCaso_IdCaso(idCaso));
    }

    @GetMapping("/evidencias")
    public ResponseEntity<?> evidencias(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        // Las evidencias bloqueadas por acertijo no se muestran hasta resolverlo
        return responder(auth, idCaso, () -> acertijoService.evidenciasVisibles(auth, idCaso));
    }

    @GetMapping("/documentos")
    public ResponseEntity<?> documentos(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> documentoRepository.findByCaso_IdCaso(idCaso));
    }

    @GetMapping("/mensajes")
    public ResponseEntity<?> mensajes(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> mensajeRepository.findByCaso_IdCaso(idCaso));
    }

    @GetMapping("/llamadas")
    public ResponseEntity<?> llamadas(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> llamadaRepository.findByCaso_IdCaso(idCaso));
    }

    @GetMapping("/ubicaciones")
    public ResponseEntity<?> ubicaciones(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> ubicacionRepository.findByCaso_IdCaso(idCaso));
    }

    @GetMapping("/declaraciones")
    public ResponseEntity<?> declaraciones(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> declaracionRepository.findByCaso_IdCaso(idCaso));
    }

    @GetMapping("/linea-tiempo")
    public ResponseEntity<?> lineaTiempo(@PathVariable("idCaso") Long idCaso, Authentication auth) {
        return responder(auth, idCaso, () -> acontecimientoRepository.findByCaso_IdCasoOrderByFechaAsc(idCaso));
    }

    private ResponseEntity<?> responder(Authentication auth, Long idCaso, Supplier<?> datos) {
        if (!partidaService.tieneAcceso(auth, idCaso)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Primero debes iniciar la investigación de este caso"));
        }
        return ResponseEntity.ok(datos.get());
    }
}
