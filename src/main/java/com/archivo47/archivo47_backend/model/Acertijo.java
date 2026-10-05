package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "acertijo")
public class Acertijo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_acertijo")
    private Long idAcertijo;

    @Column(name = "pregunta", columnDefinition = "TEXT", nullable = false)
    private String pregunta;

    // La respuesta nunca se envia al jugador
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "respuesta", length = 255, nullable = false)
    private String respuesta;

    @Column(name = "dificultad", length = 50, nullable = true)
    private String dificultad;

    @Column(name = "puntos", nullable = false)
    private Integer puntos;

    @ManyToOne
    @JoinColumn(name = "id_caso", nullable = false)
    private Caso caso;

    public Acertijo() {}

    public Long getIdAcertijo() { return idAcertijo; }
    public void setIdAcertijo(Long idAcertijo) { this.idAcertijo = idAcertijo; }

    public String getPregunta() { return pregunta; }
    public void setPregunta(String pregunta) { this.pregunta = pregunta; }

    public String getRespuesta() { return respuesta; }
    public void setRespuesta(String respuesta) { this.respuesta = respuesta; }

    public String getDificultad() { return dificultad; }
    public void setDificultad(String dificultad) { this.dificultad = dificultad; }

    public Integer getPuntos() { return puntos; }
    public void setPuntos(Integer puntos) { this.puntos = puntos; }

    public Caso getCaso() { return caso; }
    public void setCaso(Caso caso) { this.caso = caso; }

}
