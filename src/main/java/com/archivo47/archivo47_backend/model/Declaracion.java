package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "declaracion")
public class Declaracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_declaracion")
    private Long idDeclaracion;

    @Column(name = "contenido", columnDefinition = "TEXT", nullable = false)
    private String contenido;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "credibilidad", length = 50, nullable = true)
    private String credibilidad;

    @ManyToOne
    @JoinColumn(name = "id_caso", nullable = false)
    private Caso caso;

    public Declaracion() {}

    public Long getIdDeclaracion() { return idDeclaracion; }
    public void setIdDeclaracion(Long idDeclaracion) { this.idDeclaracion = idDeclaracion; }

    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public String getCredibilidad() { return credibilidad; }
    public void setCredibilidad(String credibilidad) { this.credibilidad = credibilidad; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

}
