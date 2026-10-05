package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.model.Logro;
import com.archivo47.archivo47_backend.model.UsuarioLogro;
import com.archivo47.archivo47_backend.service.LogroService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logros")
public class LogroController {

    private final LogroService logroService;

    public LogroController(LogroService logroService) {
        this.logroService = logroService;
    }

    @GetMapping
    public List<Logro> catalogo() {
        return logroService.catalogo();
    }

    @GetMapping("/mios")
    public List<UsuarioLogro> mios(Authentication auth) {
        return logroService.delUsuario(auth.getName());
    }
}
