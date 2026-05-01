import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect } from 'react'
import { useGraphQuery } from '../../api/graph'
import { useUIStore } from '../../store/uiStore'
import type { GraphNode } from '../../types/graph'
import { filterByKinds, filterByName, toReactFlowGraph } from '../../utils/graphTransform'
import { KIND_COLORS } from '../../utils/kindMeta'
import { ErrorBanner } from '../common/ErrorBanner'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { NodeDetailPanel } from './NodeDetailPanel'
import { ConfigMapGroupNode } from './nodes/ConfigMapGroupNode'
import { ConfigMapNode } from './nodes/ConfigMapNode'
import { CronJobNode } from './nodes/CronJobNode'
import { DaemonSetNode } from './nodes/DaemonSetNode'
import { DeploymentNode } from './nodes/DeploymentNode'
import { IngressNode } from './nodes/IngressNode'
import { JobNode } from './nodes/JobNode'
import { PodGroupNode } from './nodes/PodGroupNode'
import { PodNode } from './nodes/PodNode'
import { SecretGroupNode } from './nodes/SecretGroupNode'
import { SecretNode } from './nodes/SecretNode'
import { ServiceNode } from './nodes/ServiceNode'
import { StatefulSetNode } from './nodes/StatefulSetNode'

const nodeTypes: NodeTypes = {
  pod: PodNode,
  podgroup: PodGroupNode,
  deployment: DeploymentNode,
  statefulset: StatefulSetNode,
  daemonset: DaemonSetNode,
  job: JobNode,
  cronjob: CronJobNode,
  service: ServiceNode,
  ingress: IngressNode,
  configmap: ConfigMapNode,
  configmapgroup: ConfigMapGroupNode,
  secret: SecretNode,
  secretgroup: SecretGroupNode,
}

export function GraphView() {
  const {
    selectedNamespace,
    selectedNodeId,
    visibleKinds,
    nameFilter,
    layoutDirection,
    rankSep,
    nodeSep,
    setSelectedNode,
  } = useUIStore()
  const { data, isLoading, isError, error } = useGraphQuery(selectedNamespace)

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([])

  useEffect(() => {
    if (data) {
      const filtered = filterByName(filterByKinds(data, visibleKinds), nameFilter)
      const { nodes: n, edges: e } = toReactFlowGraph(filtered, layoutDirection, rankSep, nodeSep)
      setNodes(n)
      setEdges(e)
    }
  }, [data, visibleKinds, nameFilter, layoutDirection, rankSep, nodeSep, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id)
    },
    [setSelectedNode],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const selectedNode = data?.nodes.find((n) => n.id === selectedNodeId) as GraphNode | undefined

  if (isLoading) return <LoadingSpinner />
  if (isError)
    return <ErrorBanner message={(error as Error)?.message ?? 'Failed to load graph'} />

  return (
    <div className="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#334155" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const kind = (n.data as unknown as GraphNode)?.kind
            return (kind && KIND_COLORS[kind]) || '#64748b'
          }}
          maskColor="rgba(15,23,42,0.7)"
        />
      </ReactFlow>
      {selectedNode && <NodeDetailPanel node={selectedNode} />}
    </div>
  )
}
