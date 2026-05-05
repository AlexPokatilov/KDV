import { FiMoon, FiSun } from 'react-icons/fi'
import { SiKubernetes } from 'react-icons/si'
import { useUIStore } from '../../store/uiStore'

export function Header() {
  const { theme, toggleTheme } = useUIStore()
  return (
    <header className="header">
      <div className="header__brand">
        <SiKubernetes className="header__logo" />
        <span className="header__title">KDV</span>
        <span className="header__subtitle">Kubernetes Dependency Viewer</span>
      </div>
      <button className="header__theme-btn" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <FiSun /> : <FiMoon />}
      </button>
    </header>
  )
}
