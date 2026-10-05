package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.model.Caso;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.model.Progreso;
import com.archivo47.archivo47_backend.model.Usuario;
import com.archivo47.archivo47_backend.repository.CasoRepository;
import com.archivo47.archivo47_backend.repository.PartidaRepository;
import com.archivo47.archivo47_backend.repository.ProgresoRepository;
import com.archivo47.archivo47_backend.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PartidaService {

    public record ResultadoInicio(Partida partida, boolean nueva) {}

    private final PartidaRepository partidaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CasoRepository casoRepository;
    private final ProgresoRepository progresoRepository;

    public PartidaService(PartidaRepository partidaRepository,
                          UsuarioRepository usuarioRepository,
                          CasoRepository casoRepository,
                          ProgresoRepository progresoRepository) {
        this.partidaRepository = partidaRepository;
        this.usuarioRepository = usuarioRepository;
        this.casoRepository = casoRepository;
        this.progresoRepository = progresoRepository;
    }

    // RF-08 / RF-09 / RN-02: una partida por usuario y por caso.
    // Si ya existe, se continua; si no, se crea junto con su progreso.
    @Transactional
    public ResultadoInicio iniciarOContinuar(String correo, Long idCaso) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        Caso caso = casoRepository.findById(idCaso)
                .orElseThrow(() -> new IllegalArgumentException("Caso no encontrado"));

        Optional<Partida> existente = partidaRepository
                .findByUsuario_IdUsuarioAndCaso_IdCaso(usuario.getIdUsuario(), idCaso);
        if (existente.isPresent()) {
            return new ResultadoInicio(existente.get(), false);
        }

        Partida partida = new Partida();
        partida.setUsuario(usuario);
        partida.setCaso(caso);
        partida.setFechaInicio(LocalDateTime.now());
        partida.setEstado("EN_CURSO");
        partida.setProgreso(0.0);
        partida = partidaRepository.save(partida);

        // RN-08: la investigacion conserva el progreso
        Progreso progreso = new Progreso();
        progreso.setPartida(partida);
        progreso.setPorcentaje(0.0);
        progreso.setPistasEncontradas(0);
        progreso.setEvidenciasAnalizadas(0);
        progreso.setAcertijosResueltos(0);
        progresoRepository.save(progreso);

        return new ResultadoInicio(partida, true);
    }

    public List<Partida> partidasDelUsuario(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return partidaRepository.findByUsuario_IdUsuario(usuario.getIdUsuario());
    }

    // Devuelve la partida solo si pertenece al usuario autenticado
    public Optional<Partida> partidaDelUsuario(Long idPartida, String correo) {
        return partidaRepository.findById(idPartida)
                .filter(p -> p.getUsuario().getCorreo().equalsIgnoreCase(correo));
    }

    public Optional<Partida> partidaDeCaso(String correo, Long idCaso) {
        return usuarioRepository.findByCorreo(correo)
                .flatMap(u -> partidaRepository.findByUsuario_IdUsuarioAndCaso_IdCaso(u.getIdUsuario(), idCaso));
    }

    public Optional<Progreso> progresoDePartida(Long idPartida) {
        return progresoRepository.findByPartida_IdPartida(idPartida);
    }

    // El expediente de un caso solo lo ve el administrador o quien haya iniciado una partida en ese caso
    public boolean tieneAcceso(Authentication auth, Long idCaso) {
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"));
        if (esAdmin) {
            return true;
        }
        return usuarioRepository.findByCorreo(auth.getName())
                .flatMap(u -> partidaRepository.findByUsuario_IdUsuarioAndCaso_IdCaso(u.getIdUsuario(), idCaso))
                .isPresent();
    }
}
