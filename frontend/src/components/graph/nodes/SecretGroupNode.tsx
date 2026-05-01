import type { NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

export function SecretGroupNode({ data }: NodeProps) {
  const secrets = (data as unknown as { secrets: GraphNode[] }).secrets
  return (
    <div className="secret-group-node">
      <div className="secret-group-node__header">
        <SiKubernetes className="secret-group-node__icon" />
        <span className="secret-group-node__kind">Secret</span>
        <span className="secret-group-node__count">{secrets.length}</span>
      </div>
      <ul className="secret-group-node__list">
        {secrets.map((s) => (
          <li key={s.id} className="secret-group-node__item">{s.name}</li>
        ))}
      </ul>
    </div>
  )
}
