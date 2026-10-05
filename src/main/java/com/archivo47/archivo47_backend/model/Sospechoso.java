package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "sospechoso")
public class Sospechoso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sospechoso")
    private Long idSospechoso;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT", nullable = true)
    private String descripcion;

    @Column(name = "perfil", columnDefinition = "TEXT", nullable = true)
    private String perfil;

    @Column(name = "relacion_con_caso", length = 255, nullable = true)
    private String relacionConCaso;

    @ManyToOne
    @JoinColumn(name = "id_caso", nullable = false)
    private Caso caso;

    public Sospechoso() {}

    public Long getIdSospechoso() { return idSospechoso; }
    public void setIdSospechoso(Long idSospechoso) { this.idSospechoso = idSospechoso; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getPerfil() { return perfil; }
    public void setPerfil(String perfil) { this.perfil = perfil; }

    public String getRelacionConCaso() { return relacionConCaso; }
    public void setRelacionConCaso(String relacionConCaso) { this.relacionConCaso = relacionConCaso; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

}
