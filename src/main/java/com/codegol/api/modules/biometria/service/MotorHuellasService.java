package com.codegol.api.modules.biometria.service;

import com.codegol.api.modules.biometria.dto.IdentificacionHuellaResponse;
import com.codegol.api.modules.biometria.dto.RegistrarHuellaRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinezoo.sourceafis.FingerprintCompatibility;
import com.machinezoo.sourceafis.FingerprintImage;
import com.machinezoo.sourceafis.FingerprintImageOptions;
import com.machinezoo.sourceafis.FingerprintMatcher;
import com.machinezoo.sourceafis.FingerprintTemplate;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MotorHuellasService {
    private static final String FORMATO = "CODEGOL_SOURCEAFIS_V1";
    private static final byte[] ENCRYPTION_MARKER = "CGAFISENC1".getBytes(StandardCharsets.US_ASCII);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_IMAGE_BYTES = 512_000;
    private static final int MIN_IMAGE_EDGE = 100;
    private static final int MAX_IMAGE_EDGE = 1600;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final double umbral;
    private final double margen;
    private final String claveConfigurada;

    public MotorHuellasService(JdbcTemplate jdbc, ObjectMapper mapper,
            @Value("${codegol.biometria.umbral:40}") double umbral,
            @Value("${codegol.biometria.margen:10}") double margen,
            @Value("${codegol.biometria.clave:}") String claveConfigurada) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.umbral = umbral;
        this.margen = margen;
        this.claveConfigurada = claveConfigurada;
    }

    @Transactional
    public Map<String, Object> registrar(long jugadorId, RegistrarHuellaRequest request, String username) {
        if (jdbc.queryForObject("SELECT COUNT(*) FROM jugadores WHERE id=?", Integer.class, jugadorId) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Jugador no encontrado.");

        List<String> templates = new ArrayList<>(request.imagenes().size());
        for (String image : request.imagenes()) {
            FingerprintTemplate template = templateFromPng(image);
            templates.add(Base64.getEncoder().encodeToString(template.toByteArray()));
        }
        TemplatePack pack = new TemplatePack(FORMATO, FingerprintCompatibility.version(), templates);
        byte[] stored;
        try {
            stored = cifrar(mapper.writeValueAsBytes(pack));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("No se pudo preparar la plantilla biométrica.", ex);
        }
        Long usuarioId = jdbc.queryForObject("SELECT id FROM usuarios WHERE username=?", Long.class, username);
        jdbc.update("INSERT INTO huellas_biometricas(jugador_id,plantilla,motor,dedo,registrado_por,registrado_en) VALUES(?,?,'SOURCEAFIS',?,?,CURRENT_TIMESTAMP) "
                        + "ON DUPLICATE KEY UPDATE plantilla=VALUES(plantilla),motor='SOURCEAFIS',dedo=VALUES(dedo),registrado_por=VALUES(registrado_por),registrado_en=CURRENT_TIMESTAMP",
                jugadorId, stored, request.dedo(), usuarioId);
        return Map.of("registrada", true, "jugadorId", jugadorId, "dedo", request.dedo(), "capturas", templates.size());
    }

    @Transactional(readOnly = true)
    public IdentificacionHuellaResponse identificar(String encodedImage) {
        FingerprintTemplate probe = templateFromPng(encodedImage);
        FingerprintMatcher matcher = new FingerprintMatcher(probe);
        List<Map<String, Object>> candidates = jdbc.queryForList(
                "SELECT h.jugador_id AS jugadorId,h.plantilla,j.nombre,j.apellido_paterno AS apellidoPaterno,j.apellido_materno AS apellidoMaterno,e.nombre AS equipo "
                + "FROM huellas_biometricas h JOIN jugadores j ON j.id=h.jugador_id JOIN equipos e ON e.id=j.equipo_id WHERE h.motor='SOURCEAFIS'");
        if (candidates.isEmpty()) return noMatch("SIN_HUELLAS_REGISTRADAS");

        RankedPlayer best = null;
        double secondScore = Double.NEGATIVE_INFINITY;
        String currentVersion = FingerprintCompatibility.version();
        for (Map<String, Object> candidate : candidates) {
            TemplatePack pack = readPack(descifrar((byte[]) candidate.get("plantilla")));
            if (!FORMATO.equals(pack.format()) || !currentVersion.equals(pack.version()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Hay huellas que requieren volver a registrarse por cambio de motor.");
            double playerScore = Double.NEGATIVE_INFINITY;
            for (String value : pack.templates()) {
                FingerprintTemplate stored;
                try {
                    stored = new FingerprintTemplate(Base64.getDecoder().decode(value));
                } catch (RuntimeException ex) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Una plantilla registrada no es válida; vuelve a registrar esa huella.");
                }
                playerScore = Math.max(playerScore, matcher.match(stored));
            }
            long id = ((Number) candidate.get("jugadorId")).longValue();
            if (best == null || playerScore > best.score()) {
                if (best != null) secondScore = best.score();
                best = new RankedPlayer(id, nombre(candidate), String.valueOf(candidate.get("equipo")), playerScore);
            } else if (id != best.id()) {
                secondScore = Math.max(secondScore, playerScore);
            }
        }

        if (best == null || best.score() < umbral) return noMatch("HUELLA_NO_RECONOCIDA");
        if (secondScore > Double.NEGATIVE_INFINITY && best.score() - secondScore < margen)
            return noMatch("RESULTADO_AMBIGUO");
        return new IdentificacionHuellaResponse(true, "IDENTIFICADO", best.id(), best.name(), best.team());
    }

    private FingerprintTemplate templateFromPng(String encoded) {
        final byte[] imageBytes;
        try {
            if (encoded == null || encoded.length() > 700_000 || !encoded.matches("[A-Za-z0-9_-]+"))
                throw new IllegalArgumentException();
            imageBytes = Base64.getUrlDecoder().decode(encoded);
            if (imageBytes.length < 16 || imageBytes.length > MAX_IMAGE_BYTES || !isPng(imageBytes))
                throw new IllegalArgumentException();
            var image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null || image.getWidth() < MIN_IMAGE_EDGE || image.getHeight() < MIN_IMAGE_EDGE
                    || image.getWidth() > MAX_IMAGE_EDGE || image.getHeight() > MAX_IMAGE_EDGE
                    || (long) image.getWidth() * image.getHeight() > 1_500_000L)
                throw new IllegalArgumentException();
            return new FingerprintTemplate(new FingerprintImage(imageBytes, new FingerprintImageOptions().dpi(500)));
        } catch (IllegalArgumentException | IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La captura debe ser una imagen PNG válida del lector.");
        }
    }

    private static boolean isPng(byte[] bytes) {
        return bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
                && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
    }

    private TemplatePack readPack(byte[] bytes) {
        try {
            TemplatePack pack = mapper.readValue(bytes, TemplatePack.class);
            if (pack.format() == null || pack.version() == null || pack.templates() == null || pack.templates().isEmpty())
                throw new IOException("Plantilla vacía");
            return pack;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Una plantilla anterior no tiene un formato compatible; vuelve a registrar esa huella.");
        }
    }

    private byte[] cifrar(byte[] cleartext) {
        try {
            byte[] iv = new byte[12];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, clave(), new GCMParameterSpec(128, iv));
            byte[] ciphertext = cipher.doFinal(cleartext);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream(ENCRYPTION_MARKER.length + iv.length + ciphertext.length);
            try (DataOutputStream output = new DataOutputStream(bytes)) {
                output.write(ENCRYPTION_MARKER);
                output.write(iv);
                output.write(ciphertext);
            }
            return bytes.toByteArray();
        } catch (GeneralSecurityException | IOException ex) {
            throw new IllegalStateException("No se pudo proteger la plantilla biométrica.", ex);
        }
    }

    private byte[] descifrar(byte[] encrypted) {
        if (encrypted == null || encrypted.length <= ENCRYPTION_MARKER.length + 12
                || !startsWith(encrypted, ENCRYPTION_MARKER))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La plantilla está en formato anterior o no es válida; vuelve a registrar esa huella.");
        try {
            byte[] iv = java.util.Arrays.copyOfRange(encrypted, ENCRYPTION_MARKER.length, ENCRYPTION_MARKER.length + 12);
            byte[] ciphertext = java.util.Arrays.copyOfRange(encrypted, ENCRYPTION_MARKER.length + 12, encrypted.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, clave(), new GCMParameterSpec(128, iv));
            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No se pudo descifrar la huella. Verifica que CODEGOL_BIOMETRIA_KEY sea la misma que se usó al registrarla.");
        }
    }

    private SecretKeySpec clave() {
        try {
            byte[] raw = Base64.getDecoder().decode(claveConfigurada == null ? "" : claveConfigurada.trim());
            if (raw.length != 32) throw new IllegalArgumentException();
            return new SecretKeySpec(raw, "AES");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Configura CODEGOL_BIOMETRIA_KEY con una clave Base64 aleatoria de 32 bytes antes de registrar o identificar huellas.");
        }
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if (data[i] != prefix[i]) return false;
        return true;
    }

    private static String nombre(Map<String, Object> candidate) {
        return Stream.of(candidate.get("nombre"), candidate.get("apellidoPaterno"), candidate.get("apellidoMaterno"))
                .filter(value -> value != null && !value.toString().isBlank()).map(Object::toString)
                .reduce((left, right) -> left + " " + right).orElse("");
    }

    private static IdentificacionHuellaResponse noMatch(String result) {
        return new IdentificacionHuellaResponse(false, result, null, null, null);
    }

    private record TemplatePack(String format, String version, List<String> templates) { }
    private record RankedPlayer(long id, String name, String team, double score) { }
}
