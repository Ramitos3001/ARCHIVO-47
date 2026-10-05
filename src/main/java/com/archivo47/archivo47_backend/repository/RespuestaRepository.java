package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Respuesta;

@Repository
public interface RespuestaRepository extends JpaRepository<Respuesta, Long> {

    List<Respuesta> findByPartida_IdPartida(Long idPartida);
    List<Respuesta> findByPartida_IdPartidaAndCorrectaTrue(Long idPartida);
    long countByPartida_IdPartidaAndAcertijo_IdAcertijo(Long idPartida, Long idAcertijo);
    boolean existsByPartida_IdPartidaAndAcertijo_IdAcertijoAndCorrectaTrue(Long idPartida, Long idAcertijo);
}
