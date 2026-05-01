import type { GraphNode, IngressRule, ServicePort } from '../../types/graph'
import { useUIStore } from '../../store/uiStore'

interface Props {
  node: GraphNode
}

function PortsSection({ ports }: { ports: ServicePort[] }) {
  return (
    <div className="detail-panel__section">
      <div className="detail-panel__section-title">Ports</div>
      <table className="ports-table">
        <thead>
          <tr>
            <th>port</th>
            <th>targetPort</th>
            <th>proto</th>
            {ports.some((p) => p.name) && <th>name</th>}
          </tr>
        </thead>
        <tbody>
          {ports.map((p, i) => (
            <tr key={i}>
              <td>{p.port}</td>
              <td>{p.target_port ?? '—'}</td>
              <td>{p.protocol}</td>
              {ports.some((pp) => pp.name) && <td>{p.name ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IngressRulesSection({ rules }: { rules: IngressRule[] }) {
  return (
    <div className="detail-panel__section">
      <div className="detail-panel__section-title">Routes</div>
      <div className="ingress-rules">
        {rules.map((r, i) => (
          <div key={i} className="ingress-rule">
            <div className="ingress-rule__path">
              {r.host ? (
                <span className="ingress-rule__host">{r.host}</span>
              ) : null}
              <span className="ingress-rule__pathval">{r.path}</span>
            </div>
            <div className="ingress-rule__backend">
              <span className="ingress-rule__arrow">→</span>
              <span className="ingress-rule__svc">{r.service_name}</span>
              {r.service_port && (
                <span className="ingress-rule__port">:{r.service_port}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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
      {node.replicas != null && (
        <div className="detail-panel__meta">
          <span className="detail-panel__label">replicas</span>
          <span>{node.replicas}</span>
        </div>
      )}
      {node.ports && node.ports.length > 0 && (
        <PortsSection ports={node.ports} />
      )}
      {node.ingress_rules && node.ingress_rules.length > 0 && (
        <IngressRulesSection rules={node.ingress_rules} />
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
