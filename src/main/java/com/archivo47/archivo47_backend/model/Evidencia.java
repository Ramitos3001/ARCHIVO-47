package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "evidencia")
public class Evidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evidencia")
    private Long idEvidencia;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "tipo", length = 50, nullable = false)
    private String tipo;

    @Column(name = "descripcion", columnDefinition = "TEXT", nullable = true)
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "id_caso", nullable = false)
    private Caso caso;

    // Si no es null, la evidencia esta bloqueada hasta resolver este acertijo
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "id_acertijo_desbloqueo", nullable = true)
    private Acertijo acertijoDesbloqueo;

    public Evidencia() {}

    public Long getIdEvidencia() { return idEvidencia; }
    public void setIdEvidencia(Long idEvidencia) { this.idEvidencia = idEvidencia; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

    public Acertijo getAcertijoDesbloqueo() { return acertijoDesbloqueo; }
    public void setAcertijoDesbloqueo(Acertijo acertijoDesbloqueo) { this.acertijoDesbloqueo = acertijoDesbloqueo; }

    public Long getIdAcertijoDesbloqueo() {
        return acertijoDesbloqueo == null ? null : acertijoDesbloqueo.getIdAcertijo();
    }

}
