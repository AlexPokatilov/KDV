import type { NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import { useUIStore } from '../../../store/uiStore'
import type { GraphNode } from '../../../types/graph'

export function PodGroupNode({ data }: NodeProps) {
  const pods = (data as unknown as { pods: GraphNode[] }).pods
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)
  return (
    <div className="pod-group-node">
      <div className="pod-group-node__header">
        <SiKubernetes className="pod-group-node__icon" />
        <span className="pod-group-node__kind">Pod</span>
        <span className="pod-group-node__count">{pods.length}</span>
      </div>
      <ul className="pod-group-node__list">
        {pods.map((p) => (
          <li
            key={p.id}
            className="pod-group-node__item pod-group-node__item--clickable"
            onClick={(e) => { e.stopPropagation(); setSelectedNode(p.id) }}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
