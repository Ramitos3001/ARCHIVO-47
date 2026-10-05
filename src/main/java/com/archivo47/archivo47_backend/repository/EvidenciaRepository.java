package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Evidencia;

@Repository
public interface EvidenciaRepository extends JpaRepository<Evidencia, Long> {

    List<Evidencia> findByCaso_IdCaso(Long idCaso);
}
