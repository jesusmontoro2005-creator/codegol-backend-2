package com.codegol.api.modules.auth.security;

import com.codegol.api.modules.auth.model.Usuario;
import com.codegol.api.modules.auth.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {
    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;

    public TokenAuthenticationFilter(TokenService tokenService, UsuarioRepository usuarioRepository) {
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            TokenService.Claims claims = tokenService.validar(header.substring(7));
            if (claims != null) {
                Usuario usuario = usuarioRepository.findByUsername(claims.username()).orElse(null);
                if (usuario != null && usuario.isActivo() && usuario.getRol().name().equals(claims.role())) {
                    var auth = new UsernamePasswordAuthenticationToken(usuario.getUsername(), null,
                            List.of(new SimpleGrantedAuthority(usuario.getRol().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
