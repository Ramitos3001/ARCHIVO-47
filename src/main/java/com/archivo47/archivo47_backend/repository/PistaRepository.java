package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Pista;

@Repository
public interface PistaRepository extends JpaRepository<Pista, Long> {

    List<Pista> findByCaso_IdCaso(Long idCaso);
    List<Pista> findByCaso_IdCasoOrderByOrdenAscIdPistaAsc(Long idCaso);
}
