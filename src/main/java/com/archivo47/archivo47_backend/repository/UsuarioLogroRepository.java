package com.archivo47.archivo47_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.UsuarioLogro;

@Repository
public interface UsuarioLogroRepository extends JpaRepository<UsuarioLogro, Long> {

    List<UsuarioLogro> findByUsuario_IdUsuario(Long idUsuario);
    boolean existsByUsuario_IdUsuarioAndLogro_IdLogro(Long idUsuario, Long idLogro);
}
