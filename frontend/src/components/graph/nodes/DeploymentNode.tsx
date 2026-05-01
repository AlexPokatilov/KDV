import { Handle, Position, type NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

export function DeploymentNode({ data, selected, targetPosition, sourcePosition }: NodeProps) {
  const node = data as unknown as GraphNode
  return (
    <div className={`k8s-node k8s-node--deployment ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={targetPosition ?? Position.Top} />
      <div className="k8s-node__header">
        <SiKubernetes className="k8s-node__icon" />
        <span className="k8s-node__kind">Deployment</span>
      </div>
      <div className="k8s-node__name">{node.name}</div>
      {node.status && (
        <div className="k8s-node__status">replicas: {node.status}</div>
      )}
      <Handle type="source" position={sourcePosition ?? Position.Bottom} />
    </div>
  )
}
