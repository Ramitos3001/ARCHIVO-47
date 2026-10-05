package com.archivo47.archivo47_backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Progreso;

@Repository
public interface ProgresoRepository extends JpaRepository<Progreso, Long> {

    Optional<Progreso> findByPartida_IdPartida(Long idPartida);
}
