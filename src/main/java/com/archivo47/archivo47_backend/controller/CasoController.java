package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.model.Caso;
import com.archivo47.archivo47_backend.repository.CasoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/casos")
public class CasoController {

    private final CasoRepository casoRepository;

    public CasoController(CasoRepository casoRepository) {
        this.casoRepository = casoRepository;
    }

    @GetMapping
    public List<Caso> listar() {
        return casoRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Caso> obtener(@PathVariable("id") Long id) {
        return casoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Caso crear(@RequestBody Caso caso) {
        caso.setIdCaso(null);
        return casoRepository.save(caso);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Caso> actualizar(@PathVariable("id") Long id, @RequestBody Caso datos) {
        return casoRepository.findById(id).map(caso -> {
            caso.setTitulo(datos.getTitulo());
            caso.setDescripcion(datos.getDescripcion());
            caso.setDificultad(datos.getDificultad());
            caso.setEstado(datos.getEstado());
            return ResponseEntity.ok(casoRepository.save(caso));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        if (!casoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        casoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
