import { useMemo } from 'react'
import { useGraphQuery } from '../../api/graph'
import { useNamespacesQuery } from '../../api/namespaces'
import { useUIStore } from '../../store/uiStore'
import type { ResourceKind, ViewType } from '../../types/graph'
import { ALL_KINDS, KIND_COLORS } from '../../utils/kindMeta'

const VIEW_TYPES: { value: ViewType; label: string; available: boolean }[] = [
  { value: 'graph', label: 'Graph', available: true },
  { value: 'bubbles', label: 'Bubbles', available: false },
  { value: 'table', label: 'Table', available: false },
]

export function Sidebar() {
  const {
    selectedNamespace,
    viewType,
    visibleKinds,
    nameFilter,
    setNamespace,
    setViewType,
    toggleKind,
    setAllKindsVisible,
    clearKinds,
    setNameFilter,
  } = useUIStore()
  const { data: nsData, isLoading: nsLoading } = useNamespacesQuery()
  const { data: graphData } = useGraphQuery(selectedNamespace)

  const counts = useMemo(() => {
    const c: Partial<Record<ResourceKind, number>> = {}
    graphData?.nodes.forEach((n) => {
      c[n.kind] = (c[n.kind] ?? 0) + 1
    })
    return c
  }, [graphData])

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
          disabled={nsLoading}
        >
          {nsLoading && <option>Loading…</option>}
          {nsData?.namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar__section">
        <label className="sidebar__label" htmlFor="name-search">
          Search
        </label>
        <input
          id="name-search"
          type="text"
          className="sidebar__input"
          placeholder="Filter by name…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
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

      <div className="sidebar__section">
        <div className="sidebar__filter-header">
          <span className="sidebar__label">Filter</span>
          <div className="sidebar__filter-actions">
            <button onClick={setAllKindsVisible} title="Show all">
              all
            </button>
            <button onClick={clearKinds} title="Hide all">
              none
            </button>
          </div>
        </div>
        <div className="filter-list">
          {ALL_KINDS.map((kind) => {
            const count = counts[kind] ?? 0
            const checked = visibleKinds[kind]
            return (
              <label
                key={kind}
                className={`filter-item ${count === 0 ? 'filter-item--empty' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleKind(kind)}
                />
                <span
                  className="legend-dot"
                  style={{ background: KIND_COLORS[kind] }}
                />
                <span className="filter-item__name">{kind}</span>
                <span className="filter-item__count">{count}</span>
              </label>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
