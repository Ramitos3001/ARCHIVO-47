package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "partida_pista")
public class PartidaPista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_partida_pista")
    private Long idPartidaPista;

    @Column(name = "fecha_uso", nullable = false)
    private LocalDateTime fechaUso;

    @ManyToOne
    @JoinColumn(name = "id_partida", nullable = false)
    private Partida partida;

    @ManyToOne
    @JoinColumn(name = "id_pista", nullable = false)
    private Pista pista;

    public PartidaPista() {}

    public Long getIdPartidaPista() { return idPartidaPista; }
    public void setIdPartidaPista(Long idPartidaPista) { this.idPartidaPista = idPartidaPista; }

    public LocalDateTime getFechaUso() { return fechaUso; }
    public void setFechaUso(LocalDateTime fechaUso) { this.fechaUso = fechaUso; }

    public Partida getPartida() { return partida; }
    public void setPartida(Partida partida) { this.partida = partida; }

    public Pista getPista() { return pista; }
    public void setPista(Pista pista) { this.pista = pista; }

}
