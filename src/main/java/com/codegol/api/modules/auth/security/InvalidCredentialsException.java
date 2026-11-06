package com.codegol.api.modules.auth.security;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Credenciales inválidas: usuario o contraseña incorrectos.");
    }
}
