import { useState } from 'react'
import { Link } from 'react-router-dom'
import ModoDemo from '../components/ModoDemo'
import { fechaHoyLarga, nombreUsuario } from '../database/sesion'
import useDashboard from './useDashboard'
import ActivityCard from '../components/dashboard/ActivityCard'
import MatchRow from '../components/dashboard/MatchRow'
import MetricCard from '../components/dashboard/MetricCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import ResultsTable from '../components/dashboard/ResultsTable'
import SectionHeading from '../components/dashboard/SectionHeading'
import './Dashboard.css'

function MatchSchedule({ matches }) {
  return <section className="matches-card"><SectionHeading eyebrow={fechaHoyLarga().toUpperCase()} title="Próximos partidos" />{matches.length ? <div className="match-list">{matches.map((match, index) => <MatchRow key={`${match.date}-${match.time}-${index}`} match={match} />)}</div> : <p className="mx-empty">No hay partidos programados. Genera el calendario de un torneo.</p>}<Link className="schedule-cta" to="/admin/calendario" style={{ textDecoration: 'none' }}><i className="pi pi-calendar-plus" /> Abrir calendario completo <i className="pi pi-arrow-right" /></Link></section>
}

function FieldSummary({ canchas, semana }) {
  const pct = canchas.total ? Math.round((canchas.ocupadas / canchas.total) * 100) : 0
  return <div className="right-rail"><div className="field-card"><div className="field-card-top"><span className="live-indicator"><i /> JORNADA DE HOY</span><i className="pi pi-arrow-up-right" /></div><div className="field-card-content"><span>CANCHAS CON PARTIDO HOY</span><b>{String(canchas.ocupadas).padStart(2, '0')} <small>/ {String(canchas.total).padStart(2, '0')}</small></b><div className="field-progress"><i style={{ width: `${pct}%` }} /></div><small>{canchas.partidosHoy} partidos programados hoy</small></div><div className="field-card-decoration"><i className="pi pi-circle" /><i className="pi pi-circle" /></div></div><div className="quick-summary"><span>PRÓXIMOS 7 DÍAS</span><div><b>{semana.total}</b><small>partidos</small><i className="pi pi-chart-line" /></div><footer><span>{semana.completados} completados</span><span>{semana.porJugar} por jugar</span></footer></div></div>
}

function ResultsSection({ resultados, torneos }) {
  const [filter, setFilter] = useState('Todos')
  const results = resultados.filter((result) => filter === 'Todos' || result.league === filter)
  return <section className="results-card"><SectionHeading eyebrow="LO QUE PASÓ EN LA CANCHA" title="Resultados recientes" action="Ver estadísticas" onAction={() => { window.location.href = '/admin/estadisticas' }} /><div className="results-toolbar"><div className="result-filters" role="group" aria-label="Filtrar resultados">{['Todos', ...torneos].map((option) => <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)}>{option}</button>)}</div></div>{results.length ? <ResultsTable results={results} /> : <p className="mx-empty">Aún no hay partidos finalizados.</p>}</section>
}

export default function Dashboard() {
  const d = useDashboard()
  const nombre = nombreUsuario().split(' ')[0]
  if (!d.listo) return <div className="dashboard"><p className="mx-loading">{d.error ? d.error : 'Cargando panel…'}</p></div>
  return <div className="dashboard"><div className="welcome-row"><div><div className="welcome-kicker"><span className="welcome-line" /> {fechaHoyLarga().toUpperCase()}</div><h1>¡Hola, {nombre}! <span>⚽</span></h1><p>Aquí tienes el resumen de lo que pasa en CODEGOL hoy.</p></div><Link className="primary-button" to="/admin/calendario" style={{ textDecoration: 'none' }}><i className="pi pi-plus" /> Programar partido</Link></div>
    <ModoDemo />
    <section className="metrics-grid" aria-label="Indicadores principales">{d.metricas.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</section>
    <div className="dashboard-main-grid"><MatchSchedule matches={d.proximos} /><FieldSummary canchas={d.canchas} semana={d.semana} /></div>
    <div className="dashboard-lower-grid"><PerformanceChart serie={d.serie} etiquetas={d.etiquetas} /><ActivityCard items={d.actividad} /></div>
    <ResultsSection resultados={d.resultados} torneos={d.torneosNombres} />
    <footer className="page-footer"><span>© 2026 CODEGOL · Gestión deportiva inteligente</span><span>Hecho para vivir el fútbol <i className="pi pi-heart-fill" /></span></footer>
  </div>
}
