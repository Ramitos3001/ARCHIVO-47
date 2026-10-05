package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "llamada")
public class Llamada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_llamada")
    private Long idLlamada;

    @Column(name = "origen", length = 100, nullable = false)
    private String origen;

    @Column(name = "destino", length = 100, nullable = false)
    private String destino;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "duracion", nullable = false)
    private Integer duracion;

    @Column(name = "transcripcion", columnDefinition = "TEXT", nullable = true)
    private String transcripcion;

    @ManyToOne
    @JoinColumn(name = "id_caso", nullable = false)
    private Caso caso;

    public Llamada() {}

    public Long getIdLlamada() { return idLlamada; }
    public void setIdLlamada(Long idLlamada) { this.idLlamada = idLlamada; }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Integer getDuracion() { return duracion; }
    public void setDuracion(Integer duracion) { this.duracion = duracion; }

    public String getTranscripcion() { return transcripcion; }
    public void setTranscripcion(String transcripcion) { this.transcripcion = transcripcion; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

}
