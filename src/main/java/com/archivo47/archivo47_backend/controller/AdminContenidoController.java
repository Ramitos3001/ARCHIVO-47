package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.dto.AcertijoRequest;
import com.archivo47.archivo47_backend.dto.EvidenciaRequest;
import com.archivo47.archivo47_backend.dto.PistaRequest;
import com.archivo47.archivo47_backend.dto.SospechosoRequest;
import com.archivo47.archivo47_backend.service.AdminContenidoService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.function.Supplier;

// Solo administrador (SecurityConfig protege /api/admin/**)
@RestController
@RequestMapping("/api/admin/casos/{idCaso}")
public class AdminContenidoController {

    private final AdminContenidoService adminService;

    public AdminContenidoController(AdminContenidoService adminService) {
        this.adminService = adminService;
    }

    // ---------- Sospechosos ----------

    @GetMapping("/sospechosos")
    public ResponseEntity<?> sospechosos(@PathVariable("idCaso") Long idCaso) {
        return ejecutar(() -> adminService.sospechosos(idCaso));
    }

    @PostMapping("/sospechosos")
    public ResponseEntity<?> crearSospechoso(@PathVariable("idCaso") Long idCaso, @RequestBody SospechosoRequest datos) {
        if (datos == null || vacio(datos.nombre())) {
            return faltan("nombre");
        }
        return ejecutar(() -> adminService.guardarSospechoso(idCaso, null, datos));
    }

    @PutMapping("/sospechosos/{id}")
    public ResponseEntity<?> editarSospechoso(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id,
                                              @RequestBody SospechosoRequest datos) {
        if (datos == null || vacio(datos.nombre())) {
            return faltan("nombre");
        }
        return ejecutar(() -> adminService.guardarSospechoso(idCaso, id, datos));
    }

    @DeleteMapping("/sospechosos/{id}")
    public ResponseEntity<?> eliminarSospechoso(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id) {
        return eliminar(() -> adminService.eliminarSospechoso(idCaso, id));
    }

    // ---------- Evidencias ----------

    @GetMapping("/evidencias")
    public ResponseEntity<?> evidencias(@PathVariable("idCaso") Long idCaso) {
        return ejecutar(() -> adminService.evidencias(idCaso));
    }

    @PostMapping("/evidencias")
    public ResponseEntity<?> crearEvidencia(@PathVariable("idCaso") Long idCaso, @RequestBody EvidenciaRequest datos) {
        if (datos == null || vacio(datos.nombre()) || vacio(datos.tipo())) {
            return faltan("nombre y tipo");
        }
        return ejecutar(() -> adminService.guardarEvidencia(idCaso, null, datos));
    }

    @PutMapping("/evidencias/{id}")
    public ResponseEntity<?> editarEvidencia(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id,
                                             @RequestBody EvidenciaRequest datos) {
        if (datos == null || vacio(datos.nombre()) || vacio(datos.tipo())) {
            return faltan("nombre y tipo");
        }
        return ejecutar(() -> adminService.guardarEvidencia(idCaso, id, datos));
    }

    @DeleteMapping("/evidencias/{id}")
    public ResponseEntity<?> eliminarEvidencia(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id) {
        return eliminar(() -> adminService.eliminarEvidencia(idCaso, id));
    }

    // ---------- Pistas ----------

    @GetMapping("/pistas")
    public ResponseEntity<?> pistas(@PathVariable("idCaso") Long idCaso) {
        return ejecutar(() -> adminService.pistas(idCaso));
    }

    @PostMapping("/pistas")
    public ResponseEntity<?> crearPista(@PathVariable("idCaso") Long idCaso, @RequestBody PistaRequest datos) {
        if (datos == null || vacio(datos.descripcion())) {
            return faltan("descripcion");
        }
        return ejecutar(() -> adminService.guardarPista(idCaso, null, datos));
    }

    @PutMapping("/pistas/{id}")
    public ResponseEntity<?> editarPista(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id,
                                         @RequestBody PistaRequest datos) {
        if (datos == null || vacio(datos.descripcion())) {
            return faltan("descripcion");
        }
        return ejecutar(() -> adminService.guardarPista(idCaso, id, datos));
    }

    @DeleteMapping("/pistas/{id}")
    public ResponseEntity<?> eliminarPista(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id) {
        return eliminar(() -> adminService.eliminarPista(idCaso, id));
    }

    // ---------- Acertijos ----------

    @GetMapping("/acertijos")
    public ResponseEntity<?> acertijos(@PathVariable("idCaso") Long idCaso) {
        return ejecutar(() -> adminService.acertijos(idCaso));
    }

    @PostMapping("/acertijos")
    public ResponseEntity<?> crearAcertijo(@PathVariable("idCaso") Long idCaso, @RequestBody AcertijoRequest datos) {
        if (datos == null || vacio(datos.pregunta()) || vacio(datos.respuesta())) {
            return faltan("pregunta y respuesta");
        }
        return ejecutar(() -> adminService.guardarAcertijo(idCaso, null, datos));
    }

    @PutMapping("/acertijos/{id}")
    public ResponseEntity<?> editarAcertijo(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id,
                                            @RequestBody AcertijoRequest datos) {
        if (datos == null || vacio(datos.pregunta()) || vacio(datos.respuesta())) {
            return faltan("pregunta y respuesta");
        }
        return ejecutar(() -> adminService.guardarAcertijo(idCaso, id, datos));
    }

    @DeleteMapping("/acertijos/{id}")
    public ResponseEntity<?> eliminarAcertijo(@PathVariable("idCaso") Long idCaso, @PathVariable("id") Long id) {
        return eliminar(() -> adminService.eliminarAcertijo(idCaso, id));
    }

    // ---------- Utilidades ----------

    private ResponseEntity<?> ejecutar(Supplier<?> accion) {
        try {
            return ResponseEntity.ok(accion.get());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> eliminar(Runnable accion) {
        try {
            accion.run();
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "No se puede eliminar: está en uso en partidas o en la solución del caso"));
        }
    }

    private static boolean vacio(String texto) {
        return texto == null || texto.isBlank();
    }

    private static ResponseEntity<?> faltan(String campos) {
        return ResponseEntity.badRequest().body(Map.of("error", "Campos obligatorios: " + campos));
    }
}
