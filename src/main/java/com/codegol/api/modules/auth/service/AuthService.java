package com.codegol.api.modules.auth.service;


import com.codegol.api.modules.auth.dto.AuthResponse;
import com.codegol.api.modules.auth.dto.LoginRequest;
import com.codegol.api.modules.auth.dto.RegisterRequest;
import com.codegol.api.modules.auth.model.Usuario;
import com.codegol.api.modules.auth.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
	private final UsuarioRepository usuarioRepository;
   private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
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
                .mensaje("Usuario registrado exitosamente en CODEGOL")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas: usuario o contraseña incorrectos."));

        if (!usuario.isActivo()) {
            throw new IllegalStateException("El usuario se encuentra desactivado en la plataforma.");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Credenciales inválidas: usuario o contraseña incorrectos.");
        }

        return AuthResponse.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .mensaje("Inicio de sesión exitoso")
                .build();
    }
}
