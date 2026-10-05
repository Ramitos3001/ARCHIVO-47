package com.archivo47.archivo47_backend.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.archivo47.archivo47_backend.model.Partida;

@Repository
public interface PartidaRepository extends JpaRepository<Partida, Long> {

    interface FilaRanking {
        String getNombre();
        Long getPuntaje();
        Long getCasosResueltos();
    }

    List<Partida> findByUsuario_IdUsuario(Long idUsuario);
    Optional<Partida> findByUsuario_IdUsuarioAndCaso_IdCaso(Long idUsuario, Long idCaso);
    long countByUsuario_IdUsuarioAndEstado(Long idUsuario, String estado);

    @Query("SELECT p.usuario.nombre AS nombre, SUM(p.puntaje) AS puntaje, COUNT(p) AS casosResueltos " +
           "FROM Partida p WHERE p.estado = 'RESUELTA' " +
           "GROUP BY p.usuario.idUsuario, p.usuario.nombre ORDER BY SUM(p.puntaje) DESC")
    List<FilaRanking> ranking();
}
