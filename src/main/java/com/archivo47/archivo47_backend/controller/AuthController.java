package com.archivo47.archivo47_backend.controller;

import com.archivo47.archivo47_backend.model.Usuario;
import com.archivo47.archivo47_backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record RegistroRequest(String nombre, String correo, String contrasena) {}
    public record LoginRequest(String correo, String contrasena) {}
    public record UsuarioRespuesta(Long idUsuario, String nombre, String correo, String rol) {}

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    // RF-01 Registro de usuario
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequest req) {
        if (vacio(req.nombre()) || vacio(req.correo()) || vacio(req.contrasena())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre, correo y contraseña son obligatorios"));
        }
        if (req.contrasena().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener mínimo 6 caracteres"));
        }
        String correo = req.correo().trim().toLowerCase();
        if (usuarioRepository.existsByCorreo(correo)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Ese correo ya está registrado"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre().trim());
        usuario.setCorreo(correo);
        usuario.setContrasena(passwordEncoder.encode(req.contrasena()));
        usuario.setRol("INVESTIGADOR");
        usuario = usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(aRespuesta(usuario));
    }

    // RF-02 Inicio de sesion
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        if (vacio(req.correo()) || vacio(req.contrasena())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Correo y contraseña son obligatorios"));
        }
        String correo = req.correo().trim().toLowerCase();
        try {
            Authentication auth = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(correo, req.contrasena()));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow();
            return ResponseEntity.ok(aRespuesta(usuario));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Correo o contraseña incorrectos"));
        }
    }

    // RF-03 Cierre de sesion
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
    }

    // Usuario actualmente autenticado
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return usuarioRepository.findByCorreo(authentication.getName())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(aRespuesta(u)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    private boolean vacio(String s) {
        return s == null || s.isBlank();
    }

    private UsuarioRespuesta aRespuesta(Usuario u) {
        return new UsuarioRespuesta(u.getIdUsuario(), u.getNombre(), u.getCorreo(), u.getRol());
    }
}
