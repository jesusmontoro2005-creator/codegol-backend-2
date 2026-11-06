import { FingerprintReader, SampleFormat } from '@digitalpersona/devices'
import webSdkUrl from '@digitalpersona/websdk/dist/websdk.client.ui.min.js?url'

let webSdkPromise

function loadWebSdk() {
  if (window.WebSdk) return Promise.resolve()
  if (webSdkPromise) return webSdkPromise

  webSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = webSdkUrl
    script.async = true
    script.onload = () => window.WebSdk ? resolve() : reject(new Error('La biblioteca WebSDK no quedó disponible.'))
    script.onerror = () => reject(new Error('No se pudo cargar la biblioteca WebSDK.'))
    document.head.appendChild(script)
  }).catch((error) => {
    webSdkPromise = undefined
    throw error
  })

  return webSdkPromise
}

/** Captura una muestra en memoria; no la guarda ni realiza comparación biométrica. */
export async function capturarMuestraHuella({ onEstado = () => {}, timeoutMs = 30000 } = {}) {
  await loadWebSdk()

  const reader = new FingerprintReader()
  let deviceId
  let timer
  let acquisitionStarted = false

  const samplePromise = new Promise((resolve, reject) => {
    reader.on('CommunicationFailed', () => reject(new Error('No hay comunicación con DigitalPersona. Verifica que el Authentication Device Client esté instalado y activo.')))
    reader.on('DeviceConnected', (event) => {
      deviceId = event.deviceId
      onEstado('lector_conectado')
    })
    reader.on('DeviceDisconnected', () => onEstado('lector_desconectado'))
    reader.on('QualityReported', (event) => onEstado(event.quality === 0 ? 'calidad_correcta' : 'ajusta_el_dedo'))
    reader.on('ErrorOccurred', () => reject(new Error('El lector reportó un error durante la captura.')))
    reader.on('SamplesAcquired', (event) => {
      const sample = event.samples?.[0]
      if (!sample?.Data) {
        reject(new Error('El lector no devolvió una muestra válida.'))
        return
      }
      resolve({ sample, deviceId: event.deviceId, sampleFormat: event.sampleFormat })
    })

    timer = window.setTimeout(() => reject(new Error('No se recibió una huella. Intenta nuevamente.')), timeoutMs)
  })

  try {
    const devices = await reader.enumerateDevices()
    if (!devices.length) throw new Error('No se encontró un lector DigitalPersona disponible.')

    deviceId = devices[0]
    onEstado('coloca_el_dedo')
    await reader.startAcquisition(SampleFormat.PngImage, deviceId)
    acquisitionStarted = true
    return await samplePromise
  } catch (error) {
    if (error instanceof Error && /WebSocket|connect|connection/i.test(error.message)) {
      throw new Error('No se pudo conectar con DigitalPersona. Revisa que el Authentication Device Client esté instalado y activo.')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
    if (acquisitionStarted) {
      try { await reader.stopAcquisition(deviceId) } catch { /* La sesión ya puede haberse cerrado. */ }
    }
    reader.off()
  }
}
