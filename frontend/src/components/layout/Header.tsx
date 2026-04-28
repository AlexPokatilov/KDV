import { SiKubernetes } from 'react-icons/si'

export function Header() {
  return (
    <header className="header">
      <div className="header__brand">
        <SiKubernetes className="header__logo" />
        <span className="header__title">KDV</span>
        <span className="header__subtitle">Kubernetes Dependency Viewer</span>
      </div>
    </header>
  )
}
