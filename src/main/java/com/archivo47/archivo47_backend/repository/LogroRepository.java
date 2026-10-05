package com.archivo47.archivo47_backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Logro;

@Repository
public interface LogroRepository extends JpaRepository<Logro, Long> {

    Optional<Logro> findByCondicion(String condicion);
}
