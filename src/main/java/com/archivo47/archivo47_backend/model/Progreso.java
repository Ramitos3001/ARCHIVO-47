package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "progreso")
public class Progreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_progreso")
    private Long idProgreso;

    @Column(name = "porcentaje", nullable = true)
    private Double porcentaje;

    @Column(name = "pistas_encontradas", nullable = true)
    private Integer pistasEncontradas;

    @Column(name = "evidencias_analizadas", nullable = true)
    private Integer evidenciasAnalizadas;

    @Column(name = "acertijos_resueltos", nullable = true)
    private Integer acertijosResueltos;

    @OneToOne
    @JoinColumn(name = "id_partida", nullable = false, unique = true)
    private Partida partida;

    public Progreso() {}

    public Long getIdProgreso() { return idProgreso; }
    public void setIdProgreso(Long idProgreso) { this.idProgreso = idProgreso; }

    public Double getPorcentaje() { return porcentaje; }
    public void setPorcentaje(Double porcentaje) { this.porcentaje = porcentaje; }

    public Integer getPistasEncontradas() { return pistasEncontradas; }
    public void setPistasEncontradas(Integer pistasEncontradas) { this.pistasEncontradas = pistasEncontradas; }

    public Integer getEvidenciasAnalizadas() { return evidenciasAnalizadas; }
    public void setEvidenciasAnalizadas(Integer evidenciasAnalizadas) { this.evidenciasAnalizadas = evidenciasAnalizadas; }

    public Integer getAcertijosResueltos() { return acertijosResueltos; }
    public void setAcertijosResueltos(Integer acertijosResueltos) { this.acertijosResueltos = acertijosResueltos; }

    public Partida getPartida() { return partida; }
    public void setPartida(Partida partida) { this.partida = partida; }

}
