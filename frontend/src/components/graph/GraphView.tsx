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
import { toReactFlowGraph } from '../../utils/graphTransform'
import { ErrorBanner } from '../common/ErrorBanner'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { NodeDetailPanel } from './NodeDetailPanel'
import { DeploymentNode } from './nodes/DeploymentNode'
import { IngressNode } from './nodes/IngressNode'
import { PodNode } from './nodes/PodNode'
import { ServiceNode } from './nodes/ServiceNode'

const nodeTypes: NodeTypes = {
  pod: PodNode,
  deployment: DeploymentNode,
  service: ServiceNode,
  ingress: IngressNode,
}

export function GraphView() {
  const { selectedNamespace, selectedNodeId, setSelectedNode } = useUIStore()
  const { data, isLoading, isError, error } = useGraphQuery(selectedNamespace)

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([])

  useEffect(() => {
    if (data) {
      const { nodes: n, edges: e } = toReactFlowGraph(data)
      setNodes(n)
      setEdges(e)
    }
  }, [data, setNodes, setEdges])

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
            const kind = (n.data as unknown as GraphNode)?.kind?.toLowerCase()
            if (kind === 'pod') return '#22c55e'
            if (kind === 'deployment') return '#3b82f6'
            if (kind === 'service') return '#f59e0b'
            if (kind === 'ingress') return '#8b5cf6'
            return '#64748b'
          }}
          maskColor="rgba(15,23,42,0.7)"
        />
      </ReactFlow>
      {selectedNode && <NodeDetailPanel node={selectedNode} />}
    </div>
  )
}
