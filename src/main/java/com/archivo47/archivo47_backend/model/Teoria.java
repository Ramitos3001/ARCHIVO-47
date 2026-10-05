package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "teoria")
public class Teoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_teoria")
    private Long idTeoria;

    @Column(name = "movil", columnDefinition = "TEXT", nullable = true)
    private String movil;

    @Column(name = "correcta", nullable = false)
    private Boolean correcta;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "id_partida", nullable = false)
    private Partida partida;

    @ManyToOne
    @JoinColumn(name = "id_sospechoso", nullable = false)
    private Sospechoso sospechoso;

    @ManyToOne
    @JoinColumn(name = "id_evidencia_clave", nullable = true)
    private Evidencia evidenciaClave;

    public Teoria() {}

    public Long getIdTeoria() { return idTeoria; }
    public void setIdTeoria(Long idTeoria) { this.idTeoria = idTeoria; }

    public String getMovil() { return movil; }
    public void setMovil(String movil) { this.movil = movil; }

    public Boolean getCorrecta() { return correcta; }
    public void setCorrecta(Boolean correcta) { this.correcta = correcta; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Partida getPartida() { return partida; }
    public void setPartida(Partida partida) { this.partida = partida; }

    public Sospechoso getSospechoso() { return sospechoso; }
    public void setSospechoso(Sospechoso sospechoso) { this.sospechoso = sospechoso; }

    public Evidencia getEvidenciaClave() { return evidenciaClave; }
    public void setEvidenciaClave(Evidencia evidenciaClave) { this.evidenciaClave = evidenciaClave; }

}
