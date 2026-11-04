import SectionHeading from './SectionHeading'

export default function PerformanceChart({ serie = [], etiquetas = [] }) {
  const max = Math.max(4, ...serie)
  const escala = 145 / max
  const coords = serie.map((v, i) => [i * (600 / Math.max(1, serie.length - 1)), 170 - v * escala])
  const linea = coords.map(([x, y]) => `${x},${y}`).join(' ')
  const marcas = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0]
  return <div className="chart-card"><SectionHeading eyebrow="ACTIVIDAD DE LA LIGA" title="Partidos jugados por semana" action="Ver estadísticas" onAction={() => { window.location.href = '/admin/estadisticas' }} /><div className="chart-legend"><span><i className="legend-dot primary" /> Partidos finalizados</span><span>Últimas 12 semanas</span></div><div className="chart-area" role="img" aria-label="Gráfico de partidos finalizados por semana"><div className="chart-y-labels">{marcas.map((m, i) => <span key={i}>{m}</span>)}</div><div className="chart-plot"><div className="chart-grid"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0FAEAA" stopOpacity=".17"/><stop offset="100%" stopColor="#0FAEAA" stopOpacity="0"/></linearGradient></defs><polygon points={`0,180 ${linea} 600,180`} fill="url(#chartFill)"/><polyline points={linea} fill="none" stroke="#0FAEAA" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{coords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke="#0FAEAA" strokeWidth="2" />)}</svg><div className="chart-x-labels">{etiquetas.map((e, i) => <span key={i}>{i % 2 === 0 ? e : ''}</span>)}</div></div></div></div>
}
