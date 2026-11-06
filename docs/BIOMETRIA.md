# Integración del lector DigitalPersona

El front incluye el cliente Web SDK de HID y `@digitalpersona/devices`. El paquete de dispositivos recibe muestras PNG del agente local; el paquete WebSDK proporciona la comunicación entre el navegador y dicho agente. El backend usa SourceAFIS para extraer las características y hacer identificación 1:N desde esas imágenes.

## Preparación de la laptop

1. Conectar el U.are.U 4500 e instalar el controlador Non-WBF compatible. Confirmar que Windows muestre el dispositivo sin errores.
2. Instalar el [HID Authentication Device Client](https://digitalpersona.hidglobal.com/lite-client/) para Windows de 64 bits y reiniciar.
3. Abrir CODEGOL en Edge o Chrome desde la misma laptop que tiene conectado el lector. El navegador debe poder comunicarse con el agente local.
4. Ir a **Jugadores → Agregar jugador**, completar los datos del jugador, elegir dedo y pulsar **Capturar huella (3 veces)**. Colocar el mismo dedo tres veces, levantándolo entre cada captura.
5. Al pulsar **Registrar jugador y huella**, el backend guarda ambos en una sola transacción. Para verificar al jugador después del alta, la app puede comparar una lectura contra las plantillas registradas.

El registro envía las tres imágenes PNG al backend mediante un token de administrador. El backend valida tamaño y formato, extrae las plantillas con SourceAFIS y guarda el conjunto versionado cifrado con AES-256-GCM en `huellas_biometricas.plantilla`; las imágenes PNG se descartan. Las muestras no se imprimen en pantalla ni en logs.

Antes de registrar o identificar, crea una clave aleatoria y persistente en PowerShell:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$key = [Convert]::ToBase64String($bytes)
setx CODEGOL_BIOMETRIA_KEY $key
$rng.Dispose()
Remove-Variable key, bytes, rng
```

Reinicia Eclipse para que Spring herede la variable. Conserva la clave en un gestor seguro y en el respaldo operativo: si se pierde o cambia, los registros cifrados actuales no se podrán descifrar y los jugadores tendrán que volver a registrar su huella.

## Paquetes incluidos

- `@digitalpersona/devices`: API de navegador para enumerar lectores, iniciar captura y recibir muestras.
- `@digitalpersona/websdk`: biblioteca WebSDK que publica `window.WebSdk`; Vite la carga como recurso local desde `node_modules`.
- `src/services/fingerprintReader.js`: encapsula carga del SDK, captura, tiempo de espera, errores y liberación de eventos.
- `com.machinezoo.sourceafis:sourceafis`: motor Java para comparación e identificación de huellas a partir de imágenes.
- `modules/jugadores`: entidad `Jugador`, repositorio, servicio y controlador; mantiene la creación del perfil y la inscripción biométrica dentro de una sola transacción.

## Endpoints

- `POST /api/jugadores/con-huella` — administrador; crea el perfil del jugador y registra tres capturas en una sola transacción. Incluye los campos del perfil, `dedo` e `imagenes`.
- `POST /api/jugadores/{id}/huella` — administrador; reemplaza la huella de un jugador que ya existe.
- `POST /api/biometria/identificar` — administrador, árbitro o mesa de control; cuerpo `{ "imagen": "<base64url PNG>" }`. Devuelve `IDENTIFICADO`, `HUELLA_NO_RECONOCIDA`, `RESULTADO_AMBIGUO` o `SIN_HUELLAS_REGISTRADAS`.

Las capturas de prueba no se guardan. Las huellas antiguas/demostración quedan marcadas como `LEGACY`; el sistema solo considera registradas las nuevas plantillas `SOURCEAFIS`. No reutilizar hashes de datos demo como plantillas reales.

El umbral por defecto parte de la guía de SourceAFIS para comparación 1:1 y no está calibrado para el padrón real de CODEGOL. Antes de tomar decisiones definitivas de elegibilidad hay que medir falsos positivos y falsos rechazos con un conjunto de muestras voluntarias y ajustar `codegol.biometria.umbral` y `codegol.biometria.margen` en `application.properties`. Una identificación biométrica no debe ser el único mecanismo de corrección si hay una lectura ambigua o una huella difícil de capturar.

La APK deberá enviar PNG a través de HTTPS a `POST /api/biometria/identificar` con autenticación de árbitro/mesa de control. El matcher corre en el backend; la APK consume el resultado y no descarga la base de plantillas. El umbral inicial de 40 y el margen 10 son parámetros de arranque, no una certificación de seguridad; deben calibrarse con jugadores reales, incluyendo lecturas de dedos distintos y varias capturas por dedo.
