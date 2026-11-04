// Información local de demostración. Sustituir este módulo al integrar el backend.
export const dashboardMetrics = [
  { label: 'Torneos activos', value: '08', change: '+2 este mes', icon: 'pi-trophy', tone: 'teal' },
  { label: 'Partidos programados', value: '24', change: 'Esta semana', icon: 'pi-calendar', tone: 'blue' },
  { label: 'Jugadores registrados', value: '1,284', change: '+86 este mes', icon: 'pi-users', tone: 'green' },
  { label: 'Ingresos del mes', value: '$84,250', change: '+12.8% vs. mes anterior', icon: 'pi-wallet', tone: 'orange' },
]

export const upcomingMatches = [
  { time: '16:00', date: 'HOY, 28 OCT', home: 'Atlético Norte', away: 'Deportivo Sur', field: 'Cancha 01', league: 'Liga Premier', color: 'teal' },
  { time: '17:30', date: 'HOY, 28 OCT', home: 'Real Campestre', away: 'Los Halcones', field: 'Cancha 03', league: 'Torneo Apertura', color: 'blue' },
  { time: '19:00', date: 'HOY, 28 OCT', home: 'FC Alameda', away: 'Titanes FC', field: 'Cancha 02', league: 'Liga Premier', color: 'orange' },
]

export const recentResults = [
  { home: 'Atlético Norte', away: 'FC Alameda', score: '3 - 1', league: 'Liga Premier', date: '27 oct, 2026', status: 'Finalizado' },
  { home: 'Los Halcones', away: 'Real Campestre', score: '2 - 2', league: 'Torneo Apertura', date: '27 oct, 2026', status: 'Finalizado' },
  { home: 'Deportivo Sur', away: 'Titanes FC', score: '0 - 1', league: 'Liga Premier', date: '26 oct, 2026', status: 'Finalizado' },
  { home: 'Club Reforma', away: 'Unión 11', score: '4 - 2', league: 'Copa CODEGOL', date: '26 oct, 2026', status: 'Finalizado' },
]

export const activity = [
  { icon: 'pi-user-plus', text: 'Nuevo jugador registrado', detail: 'Diego Ramírez · Atlético Norte', time: 'Hace 12 min', tone: 'green' },
  { icon: 'pi-verified', text: 'Cédula arbitral validada', detail: 'Jornada 08 · Liga Premier', time: 'Hace 45 min', tone: 'blue' },
  { icon: 'pi-wallet', text: 'Pago de arbitraje recibido', detail: 'Partido #CG-2841 · $1,200', time: 'Hace 2 h', tone: 'orange' },
]
