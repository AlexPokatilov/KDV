import { Handle, type NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

export function IngressNode({ data, selected }: NodeProps) {
  const node = data as unknown as GraphNode
  return (
    <div className={`k8s-node k8s-node--ingress ${selected ? 'selected' : ''}`}>
      <Handle type="target" />
      <div className="k8s-node__header">
        <SiKubernetes className="k8s-node__icon" />
        <span className="k8s-node__kind">Ingress</span>
      </div>
      <div className="k8s-node__name">{node.name}</div>
      <Handle type="source" />
    </div>
  )
}
