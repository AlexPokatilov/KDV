import type { NodeProps } from '@xyflow/react'
import { SiKubernetes } from 'react-icons/si'
import { useUIStore } from '../../../store/uiStore'
import type { GraphNode } from '../../../types/graph'

// CSS class names are kept as-is (pod-group-node, secret-group-node, configmap-group-node)
// so existing styles require no changes.
function makeGroupNode(
  kindClass: 'pod' | 'secret' | 'configmap',
  kindLabel: string,
  itemsKey: string,
) {
  const p = `${kindClass}-group-node`
  return function Node({ data }: NodeProps) {
    const items = (data as Record<string, GraphNode[]>)[itemsKey] ?? []
    const setSelectedNode = useUIStore((s) => s.setSelectedNode)
    return (
      <div className={p}>
        <div className={`${p}__header`}>
          <SiKubernetes className={`${p}__icon`} />
          <span className={`${p}__kind`}>{kindLabel}</span>
          <span className={`${p}__count`}>{items.length}</span>
        </div>
        <ul className={`${p}__list`}>
          {items.map((item) => (
            <li
              key={item.id}
              className={`${p}__item ${p}__item--clickable`}
              onClick={(e) => { e.stopPropagation(); setSelectedNode(item.id) }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

export const PodGroupNode       = makeGroupNode('pod',       'Pod',       'pods')
export const SecretGroupNode    = makeGroupNode('secret',    'Secret',    'secrets')
export const ConfigMapGroupNode = makeGroupNode('configmap', 'ConfigMap', 'configmaps')
