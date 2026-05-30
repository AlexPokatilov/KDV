import { Handle, Position, type NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import type { GraphNode } from '../../../types/graph'

function podStatusClass(status?: string): string {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s === 'running') return 'running'
  if (s === 'pending') return 'pending'
  if (s.includes('fail') || s.includes('error') || s === 'crashloopbackoff') return 'error'
  if (s === 'notready') return 'warning'
  return 'unknown'
}

// statusPrefix: string = prepend "prefix: " before status value
//               undefined = show raw status value
//               false     = never render the status block
function makeK8sNode(
  kindClass: string,
  kindLabel: string,
  statusPrefix?: string | false,
  statusClassName?: (status?: string) => string,
) {
  return function Node({ data, selected, targetPosition, sourcePosition }: NodeProps) {
    const node = data as unknown as GraphNode
    const extra = statusClassName ? ` k8s-node--${statusClassName(node.status)}` : ''
    return (
      <div className={`k8s-node k8s-node--${kindClass}${extra}${selected ? ' selected' : ''}`}>
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <div className="k8s-node__header">
          <SiKubernetes className="k8s-node__icon" />
          <span className="k8s-node__kind">{kindLabel}</span>
        </div>
        <div className="k8s-node__name">{node.name}</div>
        {statusPrefix !== false && node.status && (
          <div className="k8s-node__status">
            {statusPrefix ? `${statusPrefix}: ${node.status}` : node.status}
          </div>
        )}
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }
}

export const PodNode        = makeK8sNode('pod',        'Pod',        undefined,  podStatusClass)
export const DeploymentNode = makeK8sNode('deployment', 'Deployment', 'replicas')
export const StatefulSetNode = makeK8sNode('statefulset', 'StatefulSet', 'replicas')
export const DaemonSetNode  = makeK8sNode('daemonset',  'DaemonSet',  'ready')
export const JobNode        = makeK8sNode('job',        'Job',        'done')
export const CronJobNode    = makeK8sNode('cronjob',    'CronJob')
export const ServiceNode    = makeK8sNode('service',    'Service',    false)
export const IngressNode    = makeK8sNode('ingress',    'Ingress',    false)
export const ConfigMapNode  = makeK8sNode('configmap',  'ConfigMap',  false)
export const SecretNode     = makeK8sNode('secret',     'Secret')
export const PVCNode        = makeK8sNode('pvc',        'PVC')
export const PVNode         = makeK8sNode('pv',         'PV')
