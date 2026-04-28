import type { GraphNode } from '../../types/graph'
import { useUIStore } from '../../store/uiStore'

interface Props {
  node: GraphNode
}

export function NodeDetailPanel({ node }: Props) {
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)

  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <span className={`detail-panel__kind detail-panel__kind--${node.kind.toLowerCase()}`}>
          {node.kind}
        </span>
        <button className="detail-panel__close" onClick={() => setSelectedNode(null)}>
          ✕
        </button>
      </div>
      <div className="detail-panel__name">{node.name}</div>
      <div className="detail-panel__meta">
        <span className="detail-panel__label">namespace</span>
        <span>{node.namespace}</span>
      </div>
      {node.status && (
        <div className="detail-panel__meta">
          <span className="detail-panel__label">status</span>
          <span>{node.status}</span>
        </div>
      )}
      {node.replicas !== undefined && (
        <div className="detail-panel__meta">
          <span className="detail-panel__label">replicas</span>
          <span>{node.replicas}</span>
        </div>
      )}
      {Object.keys(node.labels).length > 0 && (
        <div className="detail-panel__section">
          <div className="detail-panel__section-title">Labels</div>
          <div className="detail-panel__labels">
            {Object.entries(node.labels).map(([k, v]) => (
              <span key={k} className="label-chip">
                {k}={v}
              </span>
            ))}
          </div>
        </div>
      )}
      {node.selector && Object.keys(node.selector).length > 0 && (
        <div className="detail-panel__section">
          <div className="detail-panel__section-title">Selector</div>
          <div className="detail-panel__labels">
            {Object.entries(node.selector).map(([k, v]) => (
              <span key={k} className="label-chip label-chip--selector">
                {k}={v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
