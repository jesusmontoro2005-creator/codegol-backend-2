package com.codegol.api.modules.config;



import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.codegol.api.modules.auth.security.TokenAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	@Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, TokenAuthenticationFilter tokenFilter) throws Exception {
        http
        // Deshabilitar CSRF para APIs stateless / REST
        .csrf(AbstractHttpConfigurer::disable)
        // Permitir marcos para la consola de H2 si se usara
        .headers(headers -> headers.frameOptions(frame -> frame.disable()))
        // Manejo de sesión Stateless (sin galletas/cookies)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Reglas de autorización
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/index.html", "/error", "/assets/**", "/*.svg", "/*.ico", "/favicon.ico", "/consulta-publica", "/login", "/admin/**").permitAll()
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/partidos", "/api/torneos/*/calendario").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/partidos/**").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/partidos/**", "/api/torneos/*/calendario").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/jugadores/**").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/torneos/categorias/**", "/api/torneos/*/archivo").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/equipos/**").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/jugadores/*/huella").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/jugadores/con-huella").hasAuthority("ROLE_ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/biometria/identificar").hasAnyAuthority("ROLE_ADMIN", "ROLE_ARBITRO", "ROLE_MESA_CONTROL")
            .requestMatchers(HttpMethod.GET, "/api/torneos/**", "/api/equipos/torneo/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/partidos", "/api/partidos/**").permitAll()
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
            .anyRequest().authenticated()
            )
        .addFilterBefore(tokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}




