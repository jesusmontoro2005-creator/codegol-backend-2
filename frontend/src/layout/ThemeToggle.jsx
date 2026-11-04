import './ThemeToggle.css'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return <button className="icon-button theme-toggle" onClick={onToggle} aria-label={isDark ? 'Cambiar a modo de día' : 'Cambiar a modo de noche'} title={isDark ? 'Modo de día' : 'Modo de noche'}><i className={`pi ${isDark ? 'pi-sun' : 'pi-moon'}`} /></button>
}
