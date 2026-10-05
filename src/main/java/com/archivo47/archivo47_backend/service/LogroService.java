package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.model.Logro;
import com.archivo47.archivo47_backend.model.Partida;
import com.archivo47.archivo47_backend.model.Usuario;
import com.archivo47.archivo47_backend.model.UsuarioLogro;
import com.archivo47.archivo47_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class LogroService {

    private final LogroRepository logroRepository;
    private final UsuarioLogroRepository usuarioLogroRepository;
    private final UsuarioRepository usuarioRepository;
    private final PartidaRepository partidaRepository;
    private final PartidaPistaRepository partidaPistaRepository;
    private final TeoriaRepository teoriaRepository;
    private final AcertijoRepository acertijoRepository;
    private final PuntajeService puntajeService;

    public LogroService(LogroRepository logroRepository,
                        UsuarioLogroRepository usuarioLogroRepository,
                        UsuarioRepository usuarioRepository,
                        PartidaRepository partidaRepository,
                        PartidaPistaRepository partidaPistaRepository,
                        TeoriaRepository teoriaRepository,
                        AcertijoRepository acertijoRepository,
                        PuntajeService puntajeService) {
        this.logroRepository = logroRepository;
        this.usuarioLogroRepository = usuarioLogroRepository;
        this.usuarioRepository = usuarioRepository;
        this.partidaRepository = partidaRepository;
        this.partidaPistaRepository = partidaPistaRepository;
        this.teoriaRepository = teoriaRepository;
        this.acertijoRepository = acertijoRepository;
        this.puntajeService = puntajeService;
    }

    public List<Logro> catalogo() {
        return logroRepository.findAll();
    }

    public List<UsuarioLogro> delUsuario(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return usuarioLogroRepository.findByUsuario_IdUsuario(usuario.getIdUsuario());
    }

    // Revisa las condiciones de logro tras una accion y devuelve los recien obtenidos
    @Transactional
    public List<Logro> evaluar(Partida partida) {
        List<Logro> nuevos = new ArrayList<>();
        Usuario usuario = partida.getUsuario();
        Long idPartida = partida.getIdPartida();

        int totalAcertijos = acertijoRepository.findByCaso_IdCaso(partida.getCaso().getIdCaso()).size();
        if (totalAcertijos > 0 && puntajeService.acertijosResueltos(idPartida).size() == totalAcertijos) {
            otorgar(usuario, "TODOS_ACERTIJOS", nuevos);
        }

        if ("RESUELTA".equals(partida.getEstado())) {
            otorgar(usuario, "PRIMER_CASO", nuevos);
            if (partidaPistaRepository.countByPartida_IdPartida(idPartida) == 0) {
                otorgar(usuario, "SIN_PISTAS", nuevos);
            }
            if (teoriaRepository.countByPartida_IdPartida(idPartida) == 1) {
                otorgar(usuario, "PRIMER_INTENTO", nuevos);
            }
            if (partidaRepository.countByUsuario_IdUsuarioAndEstado(usuario.getIdUsuario(), "RESUELTA") >= 5) {
                otorgar(usuario, "CINCO_CASOS", nuevos);
            }
        }
        return nuevos;
    }

    private void otorgar(Usuario usuario, String condicion, List<Logro> nuevos) {
        logroRepository.findByCondicion(condicion).ifPresent(logro -> {
            if (usuarioLogroRepository.existsByUsuario_IdUsuarioAndLogro_IdLogro(usuario.getIdUsuario(), logro.getIdLogro())) {
                return;
            }
            UsuarioLogro usuarioLogro = new UsuarioLogro();
            usuarioLogro.setUsuario(usuario);
            usuarioLogro.setLogro(logro);
            usuarioLogro.setFechaObtencion(LocalDateTime.now());
            usuarioLogroRepository.save(usuarioLogro);
            nuevos.add(logro);
        });
    }
}
