import { useNamespacesQuery } from '../../api/namespaces'
import { useUIStore } from '../../store/uiStore'
import type { ViewType } from '../../types/graph'

const VIEW_TYPES: { value: ViewType; label: string; available: boolean }[] = [
  { value: 'graph', label: 'Graph', available: true },
  { value: 'mindmap', label: 'Mindmap', available: false },
  { value: 'tree', label: 'Tree', available: false },
]

export function Sidebar() {
  const { selectedNamespace, viewType, setNamespace, setViewType } = useUIStore()
  const { data, isLoading } = useNamespacesQuery()

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <label className="sidebar__label" htmlFor="ns-select">
          Namespace
        </label>
        <select
          id="ns-select"
          className="sidebar__select"
          value={selectedNamespace}
          onChange={(e) => setNamespace(e.target.value)}
          disabled={isLoading}
        >
          {isLoading && <option>Loading…</option>}
          {data?.namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__label">View</span>
        <div className="sidebar__view-buttons">
          {VIEW_TYPES.map(({ value, label, available }) => (
            <button
              key={value}
              className={`sidebar__view-btn ${viewType === value ? 'active' : ''} ${!available ? 'disabled' : ''}`}
              onClick={() => available && setViewType(value)}
              title={available ? undefined : 'Coming soon'}
            >
              {label}
              {!available && <span className="soon-badge">soon</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar__section sidebar__legend">
        <span className="sidebar__label">Legend</span>
        {[
          { color: '#3b82f6', label: 'Deployment' },
          { color: '#22c55e', label: 'Pod' },
          { color: '#f59e0b', label: 'Service' },
          { color: '#8b5cf6', label: 'Ingress' },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
