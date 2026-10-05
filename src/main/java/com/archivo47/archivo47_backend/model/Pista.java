package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pista")
public class Pista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pista")
    private Long idPista;

    @Column(name = "descripcion", columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Column(name = "importancia", length = 50, nullable = true)
    private String importancia;

    // Puntos que se descuentan al usar la pista
    @Column(name = "costo", nullable = false)
    private Integer costo;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "archivo", length = 255, nullable = true)
    private String archivo;

    @Column(name = "descubierta", nullable = true)
    private Boolean descubierta;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @ManyToOne
    @JoinColumn(name = "id_caso", nullable = false)
    private Caso caso;

    public Pista() {}

    public Long getIdPista() { return idPista; }
    public void setIdPista(Long idPista) { this.idPista = idPista; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getImportancia() { return importancia; }
    public void setImportancia(String importancia) { this.importancia = importancia; }

    public Integer getCosto() { return costo; }
    public void setCosto(Integer costo) { this.costo = costo; }

    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }

    public String getArchivo() { return archivo; }
    public void setArchivo(String archivo) { this.archivo = archivo; }

    public Boolean getDescubierta() { return descubierta; }
    public void setDescubierta(Boolean descubierta) { this.descubierta = descubierta; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

}
