export default function MetricCard({ metric }) {
  return <article className="metric-card"><div className={`metric-icon ${metric.tone}`}><i className={`pi ${metric.icon}`} /></div><p>{metric.label}</p><strong>{metric.value}</strong><small className="metric-change">{metric.change}</small></article>
}
