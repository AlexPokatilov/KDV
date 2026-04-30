import dagre from '@dagrejs/dagre'
import { MarkerType, Position } from '@xyflow/react'
import type { Edge as RFEdge, Node as RFNode } from '@xyflow/react'
import type { GraphResponse, ResourceKind } from '../types/graph'

export function filterByKinds(
  response: GraphResponse,
  visible: Record<ResourceKind, boolean>,
): GraphResponse {
  const visibleNodes = response.nodes.filter((n) => visible[n.kind])
  const visibleIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = response.edges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
  )
  return { ...response, nodes: visibleNodes, edges: visibleEdges }
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 72

function edgeColor(relation: string): string {
  switch (relation) {
    case 'routes-to':
      return '#6366f1'
    case 'uses-config':
      return '#ec4899'
    case 'uses-secret':
    case 'uses-tls':
      return '#f43f5e'
    case 'selects':
    default:
      return '#64748b'
  }
}

export function applyDagreLayout(
  nodes: RFNode[],
  edges: RFEdge[],
  direction: 'TB' | 'LR' = 'TB',
): RFNode[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
    }
  })
}

export function toReactFlowGraph(response: GraphResponse): {
  nodes: RFNode[]
  edges: RFEdge[]
} {
  const nodes: RFNode[] = response.nodes.map((n) => ({
    id: n.id,
    type: n.kind.toLowerCase(),
    position: { x: 0, y: 0 },
    data: n as unknown as Record<string, unknown>,
  }))

  const edges: RFEdge[] = response.edges.map((e) => {
    const stroke = edgeColor(e.relation)
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.relation === 'selects',
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
      style: { stroke, strokeWidth: 1.5 },
    }
  })

  const laidOut = applyDagreLayout(nodes, edges)
  return { nodes: laidOut, edges }
}
