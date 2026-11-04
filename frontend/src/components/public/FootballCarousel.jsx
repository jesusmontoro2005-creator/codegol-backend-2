import { useEffect, useState } from 'react'

const moments = [
  { image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85', title: 'El juego empieza aquí', caption: 'Cada partido suma una historia.' },
  { image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85', title: 'La emoción de la cancha', caption: 'Vive cada jornada con tu equipo.' },
  { image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=85', title: 'Pasión que se comparte', caption: 'Tu liga, tus colores, tu comunidad.' },
]

export default function FootballCarousel() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % moments.length), 5500)
    return () => window.clearInterval(timer)
  }, [])

  return <section className="football-gallery" aria-label="Galería de fútbol">
    <div className="football-gallery-window"><div className="football-gallery-track" style={{ transform: `translateX(-${active * 100}%)` }}>{moments.map((moment, index) => <article className="football-gallery-slide" key={moment.image} aria-hidden={index !== active}><img src={moment.image} alt={moment.title} /><div className="football-gallery-caption"><h3>{moment.title}</h3><p>{moment.caption}</p></div></article>)}</div></div>
    <div className="football-gallery-dots" aria-label="Seleccionar imagen">{moments.map((moment, index) => <button type="button" key={moment.image} className={active === index ? 'active' : ''} aria-label={`Mostrar imagen ${index + 1}`} aria-current={active === index ? 'true' : undefined} onClick={() => setActive(index)} />)}</div>
  </section>
}
