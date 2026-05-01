import type { NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import { useUIStore } from '../../../store/uiStore'
import type { GraphNode } from '../../../types/graph'

export function ConfigMapGroupNode({ data }: NodeProps) {
  const configmaps = (data as unknown as { configmaps: GraphNode[] }).configmaps
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)
  return (
    <div className="configmap-group-node">
      <div className="configmap-group-node__header">
        <SiKubernetes className="configmap-group-node__icon" />
        <span className="configmap-group-node__kind">ConfigMap</span>
        <span className="configmap-group-node__count">{configmaps.length}</span>
      </div>
      <ul className="configmap-group-node__list">
        {configmaps.map((c) => (
          <li
            key={c.id}
            className="configmap-group-node__item configmap-group-node__item--clickable"
            onClick={(e) => { e.stopPropagation(); setSelectedNode(c.id) }}
          >
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
