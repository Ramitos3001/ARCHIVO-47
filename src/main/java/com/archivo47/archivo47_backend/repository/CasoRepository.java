package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Caso;

@Repository
public interface CasoRepository extends JpaRepository<Caso, Long> {

    List<Caso> findByEstado(String estado);
    List<Caso> findByDificultad(String dificultad);
}
