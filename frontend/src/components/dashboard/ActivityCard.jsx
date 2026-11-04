import SectionHeading from './SectionHeading'

export default function ActivityCard({ items = [] }) {
  return <section className="activity-card"><SectionHeading eyebrow="MOVIMIENTOS" title="Actividad reciente" /><div className="activity-list">{items.length ? items.map((item, i) => <div className="activity-row" key={`${item.text}-${i}`}><span className={`activity-icon ${item.tone}`}><i className={`pi ${item.icon}`} /></span><div><b>{item.text}</b><small>{item.detail}</small></div><time>{item.time}</time></div>) : <p className="mx-empty">Sin movimientos recientes.</p>}</div></section>
}
