// Fechas en la zona horaria del navegador (toISOString usa UTC y adelanta el día por las noches en México).
const dos = (n) => String(n).padStart(2, '0')
export const isoLocal = (d = new Date()) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
export const hoyISO = () => isoLocal()
export const ahoraISO = () => { const d = new Date(); return `${isoLocal(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}` }
export const sumarDias = (fecha, dias) => { const d = new Date(`${fecha}T00:00:00`); d.setDate(d.getDate() + dias); return isoLocal(d) }
