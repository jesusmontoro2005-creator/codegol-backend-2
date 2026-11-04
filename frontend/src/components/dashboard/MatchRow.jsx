export default function MatchRow({ match }) {
  return <article className="match-row"><div className="match-time"><b>{match.time}</b><span>{match.date}</span></div><div className="match-details"><span className={`match-league-dot ${match.color}`} /><div className="match-teams"><b>{match.home}</b><span className="match-vs">VS</span><b>{match.away}</b></div><span className="match-league">{match.league}</span></div><span className="match-field"><i className="pi pi-map-marker" /> {match.field}</span></article>
}
