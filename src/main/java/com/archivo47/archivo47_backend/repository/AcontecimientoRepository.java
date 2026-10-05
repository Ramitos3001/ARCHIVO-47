package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Acontecimiento;

@Repository
public interface AcontecimientoRepository extends JpaRepository<Acontecimiento, Long> {

    List<Acontecimiento> findByCaso_IdCaso(Long idCaso);
    List<Acontecimiento> findByCaso_IdCasoOrderByFechaAsc(Long idCaso);
}
