import { Handle, Position, type NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

function statusClass(status?: string): string {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s === 'running') return 'running'
  if (s === 'pending') return 'pending'
  if (s.includes('fail') || s.includes('error') || s === 'crashloopbackoff') return 'error'
  if (s === 'notready') return 'warning'
  return 'unknown'
}

export function PodNode({ data, selected, targetPosition, sourcePosition }: NodeProps) {
  const node = data as unknown as GraphNode
  return (
    <div className={`k8s-node k8s-node--pod k8s-node--${statusClass(node.status)} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={targetPosition ?? Position.Top} />
      <div className="k8s-node__header">
        <SiKubernetes className="k8s-node__icon" />
        <span className="k8s-node__kind">Pod</span>
      </div>
      <div className="k8s-node__name">{node.name}</div>
      {node.status && (
        <div className="k8s-node__status">{node.status}</div>
      )}
      <Handle type="source" position={sourcePosition ?? Position.Bottom} />
    </div>
  )
}
