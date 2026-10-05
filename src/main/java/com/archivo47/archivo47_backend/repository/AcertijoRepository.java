package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Acertijo;

@Repository
public interface AcertijoRepository extends JpaRepository<Acertijo, Long> {

    List<Acertijo> findByCaso_IdCaso(Long idCaso);
}
