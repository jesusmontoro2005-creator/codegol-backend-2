import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import codegolLogo from '../../assets/codegol-logo.jpeg'
import AssistantBubble from '../../components/public/AssistantBubble'
import FootballCarousel from '../../components/public/FootballCarousel'
import PublicThemeToggle from '../../components/public/PublicThemeToggle'
import ConsultaPublica from '../consulta-publica/ConsultaPublica'
import './PublicHome.css'

// Lleva directo a la sección descontando el encabezado fijo. Las imágenes del carrusel terminan de cargar
// después y mueven la página, así que se vuelve a ajustar la posición un instante después.
function irA(id, comportamiento = 'smooth') {
  const destino = document.getElementById(id)
  if (!destino) return
  const margen = (document.querySelector('.home-header')?.offsetHeight || 76) + 14
  const colocar = (modo) => window.scrollTo({ top: Math.max(0, destino.getBoundingClientRect().top + window.scrollY - margen), behavior: modo })
  colocar(comportamiento)
  ;[900, 1700].forEach((ms) => window.setTimeout(() => {
    const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
    if (!alFinal && Math.abs(destino.getBoundingClientRect().top - margen) > 6) colocar('auto')
  }, ms))
}

const destinations = [
  { id: 'quienes-somos', icon: 'pi-users', label: 'QUIÉNES SOMOS', title: 'El fútbol nos une', text: 'Somos CODEGOL: una plataforma creada para que cada liga y cada equipo vivan mejor su pasión.', action: 'Conócenos', href: '#quienes-somos' },
  { id: 'caracteristicas', icon: 'pi-bolt', label: 'CARACTERÍSTICAS', title: 'Todo el torneo en juego', text: 'Organiza torneos, equipos, jugadores, calendarios y estadísticas desde un mismo lugar.', action: 'Descubre CODEGOL', href: '#caracteristicas' },
  { id: 'comunidad', icon: 'pi-map-marker', label: 'ENCUÉNTRANOS', title: 'La cancha es de todos', text: 'Acércate a nuestra comunidad, síguenos en redes y mantente al día con cada jornada.', action: 'Ubicación y redes', href: '#ubicacion' },
]

// Textos de ejemplo (la liga aún no tiene datos oficiales): cámbialos por los reales antes de publicar.
const LEGALES = {
  privacidad: ['Aviso de privacidad', ['CODEGOL, con domicilio en Av. Chimalhuacán 100, Col. Centro, Cd. Nezahualcóyotl, Estado de México, es responsable del tratamiento de tus datos personales.', 'Recabamos nombre, teléfono, correo y, en el caso de los jugadores, la plantilla de huella dactilar, únicamente para registrar tu participación, validar tu identidad en cancha y administrar cobros y estadísticas del torneo.', 'No vendemos ni compartimos tus datos con terceros ajenos a la liga. Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a privacidad@codegol.mx.']],
  terminos: ['Términos y condiciones', ['El uso del portal público es libre y gratuito. Las tablas, calendarios y estadísticas son informativos y se actualizan al cerrarse la cédula arbitral de cada partido.', 'La inscripción de equipos queda sujeta al pago de la cuota del torneo y al reglamento vigente de la liga. La alineación de jugadores requiere validación de identidad en cancha y no se permite a jugadores suspendidos.', 'CODEGOL puede modificar horarios, canchas y jornadas por causas de fuerza mayor, avisando en el portal.']],
  permisos: ['Permisos y licencias', ['Operación autorizada por la Dirección de Deporte y Recreación del municipio (permiso de uso de instalaciones deportivas No. DDR-2026-0148).', 'Aviso de funcionamiento y protección civil vigentes. Seguro de responsabilidad civil para eventos deportivos.']],
}

function PieInformativo({ onLegal }) {
  return <section className="home-footer-info" aria-label="Información de contacto y legal">
    <div><Link to="/" className="home-brand"><img src={codegolLogo} alt="" /><span>CODE<span>GOL</span></span></Link><p>Gestión deportiva inteligente para complejos de fútbol: torneos, calendario, estadísticas y control de caja.</p></div>
    <div><h3>Contacto</h3><ul><li><i className="pi pi-map-marker" /> Av. Chimalhuacán 100, Col. Centro, Cd. Nezahualcóyotl, Edo. Méx. C.P. 57000</li><li><i className="pi pi-phone" /> <a href="tel:+525555500100">55 5550 0100</a></li><li><i className="pi pi-whatsapp" /> <a href="https://wa.me/525555500101" target="_blank" rel="noreferrer">55 5550 0101 (WhatsApp)</a></li><li><i className="pi pi-envelope" /> <a href="mailto:contacto@codegol.mx">contacto@codegol.mx</a></li><li><i className="pi pi-clock" /> Lun a Vie 9:00–20:00 · Sáb y Dom 8:00–18:00</li></ul></div>
    <div><h3>Explora</h3><ul><li><a href="#quienes-somos">Quiénes somos</a></li><li><a href="#consulta-publica">Consulta pública</a></li><li><a href="#ubicacion">Ubicación</a></li><li><Link to="/login">Acceso administrador</Link></li></ul></div>
    <div><h3>Legal</h3><ul><li><button type="button" onClick={() => onLegal('privacidad')}>Aviso de privacidad</button></li><li><button type="button" onClick={() => onLegal('terminos')}>Términos y condiciones</button></li><li><button type="button" onClick={() => onLegal('permisos')}>Permisos y licencias</button></li></ul></div>
  </section>
}

export default function PublicHome() {
  const [legal, setLegal] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('codegol-public-theme') || 'light')
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === '/consulta-publica') {
      window.requestAnimationFrame(() => irA('consulta-publica', 'auto'))
    }
  }, [location.pathname])
  const toggleTheme = () => setTheme((current) => { const next = current === 'dark' ? 'light' : 'dark'; localStorage.setItem('codegol-public-theme', next); return next })
  function alHacerClic(event) {
    const enlace = event.target.closest('a[href^="#"]')
    const id = enlace?.getAttribute('href').slice(1)
    if (!id || !document.getElementById(id)) return
    event.preventDefault()
    irA(id)
  }
  return <main className="home-page" data-theme={theme} onClick={alHacerClic}>
    <header className="home-header"><Link to="/" className="home-brand"><img src={codegolLogo} alt="" /><span>CODE<span>GOL</span></span></Link><nav aria-label="Navegación principal"><a href="#quienes-somos">Quiénes somos</a><a href="#caracteristicas">Características</a><a href="#ubicacion">Contacto</a><a href="#consulta-publica">Consulta pública</a></nav><div className="home-header-actions"><PublicThemeToggle theme={theme} onToggle={toggleTheme} /><Link to="/login" className="home-admin"><i className="pi pi-lock" /> Acceso administrador</Link></div></header>
    <section className="home-hero" aria-label="Bienvenida a CODEGOL">
      <div className="home-hero-copy"><span className="home-eyebrow"><i className="pi pi-circle-fill" /> TU CANCHA, TU LIGA, TU HISTORIA</span><h1>El fútbol se vive.<br /><span>CODEGOL lo organiza.</span></h1><p>La pasión de tu torneo, conectada en un solo lugar.</p><div className="home-hero-actions"><a className="home-primary-action" href="#quienes-somos">Conoce CODEGOL <i className="pi pi-arrow-down" /></a><a className="home-secondary-action" href="#consulta-publica"><i className="pi pi-globe" /> Consulta pública</a></div></div>
      <div className="home-stadium" aria-hidden="true"><div className="stadium-lights" /><div className="stadium-crowd" /><div className="stadium-fans">{Array.from({ length: 48 }, (_, index) => <span className="stadium-fan" key={index} style={{ left: `${6 + (index % 16) * 5.8}%`, top: `${4 + Math.floor(index / 16) * 28 + (index % 3)}%`, '--fan-color': ['#f3b66e', '#e9eee0', '#61d2ba', '#92bfff'][index % 4], '--seat-color': ['#4377a7', '#3d8e80', '#b8784f', '#65749a'][index % 4] }}><b /><i className="fan-person"><em /><em /></i></span>)}</div><div className="stadium-beam" /><div className="stadium-pitch"><div className="pitch-outline"><span className="pitch-halfway" /><span className="pitch-center" /><span className="pitch-box left" />
      <span className="pitch-box right" /></div>
      <div className="stadium-goal"><span /><i />
      </div><div className="stadium-confetti">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
      <span className="stadium-player"><i /><b /><em />
      </span><span className="animated-ball">
        <svg className="soccer-ball-art" viewBox="0 0 100 100" focusable="false">
          <defs><radialGradient id="soccer-ball-shade" cx="33%" cy="27%" r="75%">
            <stop offset="0" stopColor="#fff" /><stop offset=".72" stopColor="#f4f4e9" />
            <stop offset="1" stopColor="#b9c0b8" />
            </radialGradient><clipPath id="soccer-ball-clip"><circle cx="50" cy="50" r="47" /></clipPath></defs><circle cx="50" cy="50" r="47" fill="url(#soccer-ball-shade)" stroke="#152923" strokeWidth="3" /><g clipPath="url(#soccer-ball-clip)" fill="none" stroke="#172b25" strokeWidth="3.1" strokeLinejoin="round"><path d="M50 32 66 43 60 62 40 62 34 43Z" fill="#172b25" /><path d="M50 32 50 3M66 43 96 33M60 62 80 91M40 62 20 91M34 43 4 33" /><path d="M50 3 66 8 76 22 66 43M96 33 91 50 96 67 78 76 60 62M80 91 64 97 50 83 40 62M20 91 22 76 4 67 9 50 4 33M34 43 24 22 34 8 50 3" /></g><ellipse cx="34" cy="25" rx="12" ry="7" fill="#fff" opacity=".28" /></svg></span></div></div>
     
    </section>
    <FootballCarousel />
    <ConsultaPublica theme={theme} />
    <section className="home-destinations" aria-label="Explora CODEGOL">{destinations.map((item, index) => <article id={item.id} key={item.id} className="home-destination"><span className="destination-number">0{index + 1}</span><span className="destination-icon"><i className={`pi ${item.icon}`} /></span><span className="destination-label">{item.label}</span><h2>{item.title}</h2><p>{item.text}</p><a href={item.href}>{item.action}<i className="pi pi-arrow-right" /></a></article>)}</section>
    <section className="home-community" id="ubicacion"><div><span className="destination-label">ENCUÉNTRANOS</span><h2>La cancha es de todos</h2><p>Consulta nuestra ubicación y ven a vivir cada jornada.</p></div><div className="home-community-links"><a href="https://maps.google.com/?q=CODEGOL" target="_blank" rel="noreferrer"><i className="pi pi-map-marker" /> Dónde nos ubicamos</a></div></section>
    <section className="home-public-cta"><span className="home-cta-icon"><i className="pi pi-star-fill" /></span><div><span className="destination-label">LA AFICIÓN TAMBIÉN JUEGA</span><h2>¿Buscas resultados y equipos?</h2><p>Consulta los torneos disponibles y sus equipos inscritos.</p></div><a href="#consulta-publica">Ir a la consulta pública <i className="pi pi-arrow-right" /></a></section>
    <PieInformativo onLegal={setLegal} />
    {legal && <div className="home-legal-bg" role="dialog" aria-modal="true" aria-label={LEGALES[legal][0]} onClick={() => setLegal('')}><div className="home-legal" onClick={(e) => e.stopPropagation()}><h2>{LEGALES[legal][0]}</h2>{LEGALES[legal][1].map((t) => <p key={t}>{t}</p>)}<small>Texto de ejemplo para la entrega académica.</small><button type="button" onClick={() => setLegal('')}>Cerrar</button></div></div>}
    <footer className="home-footer" id="comunidad-redes"><div className="home-footer-social"><span className="destination-label">SÍGUENOS EN REDES</span><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="pi pi-instagram" /></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><i className="pi pi-facebook" /></a>
    </div><Link to="/" className="home-brand">
    <span>CODE<span>GOL</span></span></Link><span>© 2026 CODEGOL · Gestión deportiva inteligente</span></footer><AssistantBubble />
  </main>
}
