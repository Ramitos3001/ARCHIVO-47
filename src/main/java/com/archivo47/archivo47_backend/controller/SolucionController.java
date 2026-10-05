package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.dto.SolucionRequest;
import com.archivo47.archivo47_backend.service.TeoriaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Solo administrador (SecurityConfig protege /api/admin/**)
@RestController
@RequestMapping("/api/admin/casos/{idCaso}/solucion")
public class SolucionController {

    private final TeoriaService teoriaService;

    public SolucionController(TeoriaService teoriaService) {
        this.teoriaService = teoriaService;
    }

    @GetMapping
    public ResponseEntity<?> obtener(@PathVariable("idCaso") Long idCaso) {
        try {
            return ResponseEntity.ok(teoriaService.solucionDeCaso(idCaso));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<?> guardar(@PathVariable("idCaso") Long idCaso,
                                     @RequestBody SolucionRequest datos) {
        if (datos == null || datos.idCulpable() == null || datos.explicacion() == null || datos.explicacion().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "idCulpable y explicacion son obligatorios"));
        }
        try {
            return ResponseEntity.ok(teoriaService.guardarSolucion(idCaso, datos));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
