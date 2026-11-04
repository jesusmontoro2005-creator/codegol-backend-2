import { useState } from 'react'
import './AssistantBubble.css'

const quickQuestions = [
  { label: 'Ver torneos', answer: 'En Consulta pública puedes elegir un torneo y ver sus fechas y equipos inscritos.' },
  { label: '¿Qué es CODEGOL?', answer: 'CODEGOL ayuda a organizar torneos, equipos, jugadores, calendarios y estadísticas.' },
]

function answerQuestion(question) {
  const value = question.toLowerCase()
  if (value.includes('torneo') || value.includes('resultado') || value.includes('equipo')) return quickQuestions[0].answer
  if (value.includes('contacto') || value.includes('ubicación') || value.includes('redes')) return 'Ve a Contacto en el menú para encontrar la ubicación y nuestras redes sociales.'
  if (value.includes('caracter') || value.includes('funciona') || value.includes('codegol')) return quickQuestions[1].answer
  return 'Puedo orientarte sobre torneos, equipos, las características de CODEGOL y dónde encontrarnos. Prueba con una de esas opciones.'
}

export default function AssistantBubble() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('¡Hola! Soy el asistente de CODEGOL. ¿Qué te gustaría conocer?')

  function ask(event) {
    event.preventDefault()
    if (!question.trim()) return
    setReply(answerQuestion(question.trim()))
    setQuestion('')
  }

  return <aside className="public-assistant" aria-label="Asistente CODEGOL">
    {open && <section className="assistant-panel" aria-labelledby="assistant-title"><header><span className="assistant-avatar">🤖<i>⚽</i></span><div><b id="assistant-title">Asistente CODEGOL</b><small><i /> En línea para ayudarte</small></div><button type="button" className="assistant-close" aria-label="Cerrar asistente" onClick={() => setOpen(false)}><i className="pi pi-times" /></button></header><div className="assistant-conversation"><p className="assistant-message">{reply}</p><div className="assistant-quick-questions">{quickQuestions.map((item) => <button key={item.label} type="button" onClick={() => setReply(item.answer)}>{item.label}</button>)}</div></div><form onSubmit={ask}><input aria-label="Escribe tu pregunta" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Escribe tu pregunta…" /><button type="submit" aria-label="Enviar pregunta"><i className="pi pi-send" /></button></form></section>}
    <button type="button" className="assistant-launcher" aria-label={open ? 'Cerrar asistente CODEGOL' : 'Abrir asistente CODEGOL'} aria-expanded={open} onClick={() => setOpen((current) => !current)}><span className="assistant-avatar">🤖<i>⚽</i></span>{!open && <span className="assistant-launcher-label">¿Te ayudo?</span>}</button>
  </aside>
}
