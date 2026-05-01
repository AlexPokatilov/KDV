import { Handle, type NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

export function StatefulSetNode({ data, selected }: NodeProps) {
  const node = data as unknown as GraphNode
  return (
    <div className={`k8s-node k8s-node--statefulset ${selected ? 'selected' : ''}`}>
      <Handle type="target" />
      <div className="k8s-node__header">
        <SiKubernetes className="k8s-node__icon" />
        <span className="k8s-node__kind">StatefulSet</span>
      </div>
      <div className="k8s-node__name">{node.name}</div>
      {node.status && (
        <div className="k8s-node__status">replicas: {node.status}</div>
      )}
      <Handle type="source" />
    </div>
  )
}
