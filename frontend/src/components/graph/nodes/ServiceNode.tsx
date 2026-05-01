import { Handle, type NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

export function ServiceNode({ data, selected }: NodeProps) {
  const node = data as unknown as GraphNode
  return (
    <div className={`k8s-node k8s-node--service ${selected ? 'selected' : ''}`}>
      <Handle type="target" />
      <div className="k8s-node__header">
        <SiKubernetes className="k8s-node__icon" />
        <span className="k8s-node__kind">Service</span>
      </div>
      <div className="k8s-node__name">{node.name}</div>
      <Handle type="source" />
    </div>
  )
}
