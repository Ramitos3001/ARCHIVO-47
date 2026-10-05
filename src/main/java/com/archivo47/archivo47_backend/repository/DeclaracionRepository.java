package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Declaracion;

@Repository
public interface DeclaracionRepository extends JpaRepository<Declaracion, Long> {

    List<Declaracion> findByCaso_IdCaso(Long idCaso);
}
