package com.archivo47.archivo47_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                // Frontend estatico (HTML, CSS, JS, imagenes)
                .requestMatchers("/", "/*.html", "/pages/**", "/css/**", "/js/**", "/img/**", "/assets/**", "/favicon.ico").permitAll()
                // Registro e inicio de sesion
                .requestMatchers("/api/auth/registro", "/api/auth/login").permitAll()
                // Solo el administrador crea, edita o borra casos (RN-12)
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/casos/**").hasRole("ADMINISTRADOR")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/casos/**").hasRole("ADMINISTRADOR")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/casos/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                // Todo lo demas requiere estar autenticado (RN-01)
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
