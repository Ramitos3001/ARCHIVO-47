package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Sospechoso;

@Repository
public interface SospechosoRepository extends JpaRepository<Sospechoso, Long> {

    List<Sospechoso> findByCaso_IdCaso(Long idCaso);
}
