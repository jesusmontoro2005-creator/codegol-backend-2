package com.codegol.api.modules.auth.service;


import com.codegol.api.modules.auth.dto.AuthResponse;
import com.codegol.api.modules.auth.dto.LoginRequest;
import com.codegol.api.modules.auth.dto.RegisterRequest;
import com.codegol.api.modules.auth.model.Usuario;
import com.codegol.api.modules.auth.repository.UsuarioRepository;
import com.codegol.api.modules.auth.security.TokenService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.codegol.api.modules.auth.security.InvalidCredentialsException;
import com.codegol.api.modules.auth.security.AccountDisabledException;

@Service
@RequiredArgsConstructor
public class AuthService {
	private final UsuarioRepository usuarioRepository;
   private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
        Authentication actual = SecurityContextHolder.getContext().getAuthentication();
        boolean hayUsuarios = usuarioRepository.count() > 0;
        if (hayUsuarios && (actual == null || !actual.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority())))) {
            throw new org.springframework.security.access.AccessDeniedException("Solo un administrador puede registrar usuarios.");
        }
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario '" + request.getUsername() + "' ya está registrado.");
        }

        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El correo '" + request.getEmail() + "' ya está en uso.");
        }

        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nombreCompleto(request.getNombreCompleto())
                .email(request.getEmail())
                .rol(request.getRol())
                .activo(true)
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        return AuthResponse.builder()
                .id(usuarioGuardado.getId())
                .username(usuarioGuardado.getUsername())
                .nombreCompleto(usuarioGuardado.getNombreCompleto())
                .email(usuarioGuardado.getEmail())
                .rol(usuarioGuardado.getRol())
                .token(tokenService.crearToken(usuarioGuardado))
                .mensaje("Usuario registrado exitosamente en CODEGOL")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if (!usuario.isActivo()) {
            throw new AccountDisabledException();
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new InvalidCredentialsException();
        }

        return AuthResponse.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .token(tokenService.crearToken(usuario))
                .mensaje("Inicio de sesión exitoso")
                .build();
    }
}
