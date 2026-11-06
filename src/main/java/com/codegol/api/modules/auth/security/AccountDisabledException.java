package com.codegol.api.modules.auth.security;

public class AccountDisabledException extends RuntimeException {
    public AccountDisabledException() {
        super("El usuario se encuentra desactivado en la plataforma.");
    }
}
