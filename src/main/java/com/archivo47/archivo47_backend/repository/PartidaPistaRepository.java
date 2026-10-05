package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.PartidaPista;

@Repository
public interface PartidaPistaRepository extends JpaRepository<PartidaPista, Long> {

    List<PartidaPista> findByPartida_IdPartida(Long idPartida);
    long countByPartida_IdPartida(Long idPartida);
}
