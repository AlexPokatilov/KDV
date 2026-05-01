import type { NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import { useUIStore } from '../../../store/uiStore'
import type { GraphNode } from '../../../types/graph'

export function SecretGroupNode({ data }: NodeProps) {
  const secrets = (data as unknown as { secrets: GraphNode[] }).secrets
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)
  return (
    <div className="secret-group-node">
      <div className="secret-group-node__header">
        <SiKubernetes className="secret-group-node__icon" />
        <span className="secret-group-node__kind">Secret</span>
        <span className="secret-group-node__count">{secrets.length}</span>
      </div>
      <ul className="secret-group-node__list">
        {secrets.map((s) => (
          <li
            key={s.id}
            className="secret-group-node__item secret-group-node__item--clickable"
            onClick={(e) => { e.stopPropagation(); setSelectedNode(s.id) }}
          >
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
