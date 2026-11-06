package com.codegol.api.modules.auth.security;

import com.codegol.api.modules.auth.model.Usuario;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private static final long TOKEN_TTL_SECONDS = 8 * 60 * 60;

    @Value("${codegol.security.token-secret}")
    private String secret;

    public String crearToken(Usuario usuario) {
        String payload = usuario.getUsername() + ":" + usuario.getRol().name() + ":" + (Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + firma(encoded);
    }

    public Claims validar(String token) {
        try {
            String[] partes = token.split("\\.", -1);
            if (partes.length != 2 || !MessageDigest.isEqual(firma(partes[0]).getBytes(StandardCharsets.US_ASCII), partes[1].getBytes(StandardCharsets.US_ASCII))) return null;
            String payload = new String(Base64.getUrlDecoder().decode(partes[0]), StandardCharsets.UTF_8);
            String[] campos = payload.split(":", -1);
            if (campos.length != 3 || Long.parseLong(campos[2]) <= Instant.now().getEpochSecond()) return null;
            return new Claims(campos[0], campos[1]);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String firma(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.US_ASCII)));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo firmar el token de sesión.", ex);
        }
    }

    public record Claims(String username, String role) { }
}
