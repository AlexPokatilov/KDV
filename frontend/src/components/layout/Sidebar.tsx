import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useGraphQuery } from '../../api/graph'
import { useNamespacesQuery } from '../../api/namespaces'
import { useUIStore } from '../../store/uiStore'
import type { ResourceKind, ViewType } from '../../types/graph'
import { ALL_KINDS, KIND_COLORS, KIND_LABELS } from '../../utils/kindMeta'

const VIEW_TYPES: { value: ViewType; label: string; available: boolean }[] = [
  { value: 'graph', label: 'Graph', available: true },
  { value: 'bubbles', label: 'Bubbles', available: true },
  { value: 'table', label: 'Table', available: false },
]

export function Sidebar() {
  const {
    selectedNamespace,
    viewType,
    visibleKinds,
    nameFilter,
    layoutDirection,
    rankSep,
    nodeSep,
    forceStrength,
    forceDistance,
    setNamespace,
    setViewType,
    toggleKind,
    setAllKindsVisible,
    clearKinds,
    setNameFilter,
    setLayoutDirection,
    setRankSep,
    setNodeSep,
    setForceStrength,
    setForceDistance,
  } = useUIStore()
  const { data: nsData, isLoading: nsLoading } = useNamespacesQuery()
  const { data: graphData } = useGraphQuery(selectedNamespace)

  const [sidebarWidth, setSidebarWidth] = useState(220)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(220)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [sidebarWidth])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      const max = Math.floor(window.innerWidth * 0.3)
      setSidebarWidth(Math.min(Math.max(startWidth.current + delta, 180), max))
    }
    const onMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const counts = useMemo(() => {
    const c: Partial<Record<ResourceKind, number>> = {}
    graphData?.nodes.forEach((n) => {
      c[n.kind] = (c[n.kind] ?? 0) + 1
    })
    return c
  }, [graphData])

  return (
    <div className="sidebar-wrapper" style={{ width: sidebarWidth }}>
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

      {viewType === 'graph' && (
        <div className="sidebar__section">
          <span className="sidebar__label">Layout</span>
          <div className="sidebar__view-buttons">
            <button
              className={`sidebar__view-btn ${layoutDirection === 'TB' ? 'active' : ''}`}
              onClick={() => setLayoutDirection('TB')}
            >
              Vertical
            </button>
            <button
              className={`sidebar__view-btn ${layoutDirection === 'LR' ? 'active' : ''}`}
              onClick={() => setLayoutDirection('LR')}
            >
              Horizontal
            </button>
          </div>
          <div className="sidebar__spacing">
            <label className="sidebar__spacing-label">
              <span>Rank gap</span><span>{rankSep}</span>
            </label>
            <input
              type="range" min={60} max={500} step={20}
              value={rankSep}
              onChange={(e) => setRankSep(+e.target.value)}
            />
            <label className="sidebar__spacing-label">
              <span>Node gap</span><span>{nodeSep}</span>
            </label>
            <input
              type="range" min={20} max={200} step={10}
              value={nodeSep}
              onChange={(e) => setNodeSep(+e.target.value)}
            />
          </div>
        </div>
      )}

      {viewType === 'bubbles' && (
        <div className="sidebar__section">
          <span className="sidebar__label">Force</span>
          <div className="sidebar__spacing">
            <label className="sidebar__spacing-label">
              <span>Strength</span><span>{forceStrength}</span>
            </label>
            <input
              type="range" min={-600} max={-50} step={10}
              value={forceStrength}
              onChange={(e) => setForceStrength(+e.target.value)}
            />
            <label className="sidebar__spacing-label">
              <span>Distance</span><span>{forceDistance}</span>
            </label>
            <input
              type="range" min={50} max={400} step={10}
              value={forceDistance}
              onChange={(e) => setForceDistance(+e.target.value)}
            />
          </div>
        </div>
      )}

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
                <span className="filter-item__name">{KIND_LABELS[kind]}</span>
                <span className="filter-item__count">{count}</span>
              </label>
            )
          })}
        </div>
      </div>
    </aside>
    <div className="sidebar__resize-handle" onMouseDown={handleResizeStart} />
    </div>
  )
}
