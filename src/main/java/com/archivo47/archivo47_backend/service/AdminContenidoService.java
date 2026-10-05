package com.archivo47.archivo47_backend.service;

import com.archivo47.archivo47_backend.dto.AcertijoAdminDTO;
import com.archivo47.archivo47_backend.dto.AcertijoRequest;
import com.archivo47.archivo47_backend.dto.EvidenciaRequest;
import com.archivo47.archivo47_backend.dto.PistaRequest;
import com.archivo47.archivo47_backend.dto.SospechosoRequest;
import com.archivo47.archivo47_backend.model.*;
import com.archivo47.archivo47_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// RN-12: el administrador gestiona el contenido de los casos
@Service
public class AdminContenidoService {

    private final CasoRepository casoRepository;
    private final SospechosoRepository sospechosoRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final PistaRepository pistaRepository;
    private final AcertijoRepository acertijoRepository;

    public AdminContenidoService(CasoRepository casoRepository,
                                 SospechosoRepository sospechosoRepository,
                                 EvidenciaRepository evidenciaRepository,
                                 PistaRepository pistaRepository,
                                 AcertijoRepository acertijoRepository) {
        this.casoRepository = casoRepository;
        this.sospechosoRepository = sospechosoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.pistaRepository = pistaRepository;
        this.acertijoRepository = acertijoRepository;
    }

    // ---------- Sospechosos ----------

    public List<Sospechoso> sospechosos(Long idCaso) {
        caso(idCaso);
        return sospechosoRepository.findByCaso_IdCaso(idCaso);
    }

    @Transactional
    public Sospechoso guardarSospechoso(Long idCaso, Long idSospechoso, SospechosoRequest datos) {
        Sospechoso sospechoso = idSospechoso == null ? new Sospechoso() : sospechoso(idCaso, idSospechoso);
        sospechoso.setCaso(caso(idCaso));
        sospechoso.setNombre(datos.nombre());
        sospechoso.setDescripcion(datos.descripcion());
        sospechoso.setPerfil(datos.perfil());
        sospechoso.setRelacionConCaso(datos.relacionConCaso());
        return sospechosoRepository.save(sospechoso);
    }

    @Transactional
    public void eliminarSospechoso(Long idCaso, Long idSospechoso) {
        sospechosoRepository.delete(sospechoso(idCaso, idSospechoso));
        sospechosoRepository.flush();
    }

    // ---------- Evidencias ----------

    public List<Evidencia> evidencias(Long idCaso) {
        caso(idCaso);
        return evidenciaRepository.findByCaso_IdCaso(idCaso);
    }

    @Transactional
    public Evidencia guardarEvidencia(Long idCaso, Long idEvidencia, EvidenciaRequest datos) {
        Evidencia evidencia = idEvidencia == null ? new Evidencia() : evidencia(idCaso, idEvidencia);
        evidencia.setCaso(caso(idCaso));
        evidencia.setNombre(datos.nombre());
        evidencia.setTipo(datos.tipo());
        evidencia.setDescripcion(datos.descripcion());
        // RN-06: si se indica un acertijo, la evidencia queda bloqueada hasta resolverlo
        evidencia.setAcertijoDesbloqueo(datos.idAcertijoDesbloqueo() == null
                ? null : acertijo(idCaso, datos.idAcertijoDesbloqueo()));
        return evidenciaRepository.save(evidencia);
    }

    @Transactional
    public void eliminarEvidencia(Long idCaso, Long idEvidencia) {
        evidenciaRepository.delete(evidencia(idCaso, idEvidencia));
        evidenciaRepository.flush();
    }

    // ---------- Pistas ----------

    public List<Pista> pistas(Long idCaso) {
        caso(idCaso);
        return pistaRepository.findByCaso_IdCasoOrderByOrdenAscIdPistaAsc(idCaso);
    }

    @Transactional
    public Pista guardarPista(Long idCaso, Long idPista, PistaRequest datos) {
        Pista pista;
        if (idPista == null) {
            pista = new Pista();
            pista.setFechaRegistro(LocalDateTime.now());
            pista.setDescubierta(false);
        } else {
            pista = pista(idCaso, idPista);
        }
        pista.setCaso(caso(idCaso));
        pista.setDescripcion(datos.descripcion());
        pista.setImportancia(datos.importancia());
        pista.setArchivo(datos.archivo());
        pista.setCosto(datos.costo() == null ? 50 : datos.costo());
        pista.setOrden(datos.orden() == null ? 1 : datos.orden());
        return pistaRepository.save(pista);
    }

    @Transactional
    public void eliminarPista(Long idCaso, Long idPista) {
        pistaRepository.delete(pista(idCaso, idPista));
        pistaRepository.flush();
    }

    // ---------- Acertijos (el admin si ve la respuesta) ----------

    public List<AcertijoAdminDTO> acertijos(Long idCaso) {
        caso(idCaso);
        return acertijoRepository.findByCaso_IdCaso(idCaso).stream().map(this::vista).toList();
    }

    @Transactional
    public AcertijoAdminDTO guardarAcertijo(Long idCaso, Long idAcertijo, AcertijoRequest datos) {
        Acertijo acertijo = idAcertijo == null ? new Acertijo() : acertijo(idCaso, idAcertijo);
        acertijo.setCaso(caso(idCaso));
        acertijo.setPregunta(datos.pregunta());
        acertijo.setRespuesta(datos.respuesta().trim());
        acertijo.setDificultad(datos.dificultad());
        acertijo.setPuntos(datos.puntos() == null ? 100 : datos.puntos());
        return vista(acertijoRepository.save(acertijo));
    }

    @Transactional
    public void eliminarAcertijo(Long idCaso, Long idAcertijo) {
        acertijoRepository.delete(acertijo(idCaso, idAcertijo));
        acertijoRepository.flush();
    }

    // ---------- Busquedas que validan que el elemento sea del caso ----------

    private Caso caso(Long idCaso) {
        return casoRepository.findById(idCaso)
                .orElseThrow(() -> new IllegalArgumentException("Caso no encontrado"));
    }

    private Sospechoso sospechoso(Long idCaso, Long id) {
        return sospechosoRepository.findById(id)
                .filter(s -> s.getCaso().getIdCaso().equals(idCaso))
                .orElseThrow(() -> new IllegalArgumentException("Sospechoso no encontrado en este caso"));
    }

    private Evidencia evidencia(Long idCaso, Long id) {
        return evidenciaRepository.findById(id)
                .filter(e -> e.getCaso().getIdCaso().equals(idCaso))
                .orElseThrow(() -> new IllegalArgumentException("Evidencia no encontrada en este caso"));
    }

    private Pista pista(Long idCaso, Long id) {
        return pistaRepository.findById(id)
                .filter(p -> p.getCaso().getIdCaso().equals(idCaso))
                .orElseThrow(() -> new IllegalArgumentException("Pista no encontrada en este caso"));
    }

    private Acertijo acertijo(Long idCaso, Long id) {
        return acertijoRepository.findById(id)
                .filter(a -> a.getCaso().getIdCaso().equals(idCaso))
                .orElseThrow(() -> new IllegalArgumentException("Acertijo no encontrado en este caso"));
    }

    private AcertijoAdminDTO vista(Acertijo a) {
        return new AcertijoAdminDTO(a.getIdAcertijo(), a.getPregunta(), a.getRespuesta(), a.getDificultad(), a.getPuntos());
    }
}
