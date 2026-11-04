export default function SelectorTorneo({ torneos, value, onChange, etiqueta = 'Torneo' }) {
  return <label className="mx-field">{etiqueta}<select value={value} onChange={(e) => onChange(e.target.value)} disabled={!torneos.length}>{!torneos.length && <option value="">Sin torneos</option>}{torneos.map((t) => <option key={t.id} value={t.id}>{t.nombre}{t.categoria?.nombre ? ` · ${t.categoria.nombre}` : ''}</option>)}</select></label>
}
