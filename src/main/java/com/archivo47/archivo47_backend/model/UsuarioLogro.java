package com.archivo47.archivo47_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario_logro")
public class UsuarioLogro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario_logro")
    private Long idUsuarioLogro;

    @Column(name = "fecha_obtencion", nullable = false)
    private LocalDateTime fechaObtencion;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_logro", nullable = false)
    private Logro logro;

    public UsuarioLogro() {}

    public Long getIdUsuarioLogro() { return idUsuarioLogro; }
    public void setIdUsuarioLogro(Long idUsuarioLogro) { this.idUsuarioLogro = idUsuarioLogro; }

    public LocalDateTime getFechaObtencion() { return fechaObtencion; }
    public void setFechaObtencion(LocalDateTime fechaObtencion) { this.fechaObtencion = fechaObtencion; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Logro getLogro() { return logro; }
    public void setLogro(Logro logro) { this.logro = logro; }

}
