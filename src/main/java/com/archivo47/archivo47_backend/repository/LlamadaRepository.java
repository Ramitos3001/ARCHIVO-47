package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Llamada;

@Repository
public interface LlamadaRepository extends JpaRepository<Llamada, Long> {

    List<Llamada> findByCaso_IdCaso(Long idCaso);
}
