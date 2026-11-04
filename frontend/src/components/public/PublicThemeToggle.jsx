export default function PublicThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return <button className="public-theme-toggle" type="button" onClick={onToggle} aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`} title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}><i className={`pi ${isDark ? 'pi-sun' : 'pi-moon'}`} /><span>{isDark ? 'Claro' : 'Oscuro'}</span></button>
}
