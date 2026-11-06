package com.codegol.api.modules.calendario.exception;

import org.springframework.http.HttpStatus;

public class CalendarioException extends RuntimeException {
    private final HttpStatus status;

    public CalendarioException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static CalendarioException notFound(String message) {
        return new CalendarioException(HttpStatus.NOT_FOUND, message);
    }

    public static CalendarioException invalid(String message) {
        return new CalendarioException(HttpStatus.BAD_REQUEST, message);
    }

    public static CalendarioException conflict(String message) {
        return new CalendarioException(HttpStatus.CONFLICT, message);
    }
}
