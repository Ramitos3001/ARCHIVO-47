package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Teoria;

@Repository
public interface TeoriaRepository extends JpaRepository<Teoria, Long> {

    List<Teoria> findByPartida_IdPartidaOrderByFechaAsc(Long idPartida);
    long countByPartida_IdPartida(Long idPartida);
    long countByPartida_IdPartidaAndCorrectaFalse(Long idPartida);
}
