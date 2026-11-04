export default function SectionHeading({ eyebrow, title, action, onAction }) {
  return <div className="section-heading"><div><span className="section-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action && <button className="text-action" onClick={onAction}>{action}<i className="pi pi-arrow-right" /></button>}</div>
}
