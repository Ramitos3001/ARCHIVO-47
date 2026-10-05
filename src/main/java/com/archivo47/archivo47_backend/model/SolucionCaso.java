package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "solucion_caso")
public class SolucionCaso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solucion")
    private Long idSolucion;

    @Column(name = "movil", columnDefinition = "TEXT", nullable = true)
    private String movil;

    @Column(name = "explicacion", columnDefinition = "TEXT", nullable = false)
    private String explicacion;

    @Column(name = "max_intentos", nullable = false)
    private Integer maxIntentos = 3;

    @Column(name = "puntaje_base", nullable = false)
    private Integer puntajeBase = 1000;

    @OneToOne
    @JoinColumn(name = "id_caso", nullable = false, unique = true)
    private Caso caso;

    @ManyToOne
    @JoinColumn(name = "id_culpable", nullable = false)
    private Sospechoso culpable;

    @ManyToOne
    @JoinColumn(name = "id_evidencia_clave", nullable = true)
    private Evidencia evidenciaClave;

    public SolucionCaso() {}

    public Long getIdSolucion() { return idSolucion; }
    public void setIdSolucion(Long idSolucion) { this.idSolucion = idSolucion; }

    public String getMovil() { return movil; }
    public void setMovil(String movil) { this.movil = movil; }

    public String getExplicacion() { return explicacion; }
    public void setExplicacion(String explicacion) { this.explicacion = explicacion; }

    public Integer getMaxIntentos() { return maxIntentos; }
    public void setMaxIntentos(Integer maxIntentos) { this.maxIntentos = maxIntentos; }

    public Integer getPuntajeBase() { return puntajeBase; }
    public void setPuntajeBase(Integer puntajeBase) { this.puntajeBase = puntajeBase; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

    public Sospechoso getCulpable() { return culpable; }
    public void setCulpable(Sospechoso culpable) { this.culpable = culpable; }

    public Evidencia getEvidenciaClave() { return evidenciaClave; }
    public void setEvidenciaClave(Evidencia evidenciaClave) { this.evidenciaClave = evidenciaClave; }

}
