import dagre from '@dagrejs/dagre'
import { MarkerType, Position } from '@xyflow/react'
import type { Edge as RFEdge, Node as RFNode } from '@xyflow/react'
import type { GraphNode, GraphResponse, ResourceKind } from '../types/graph'
import { KIND_COLORS } from './kindMeta'

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

export function filterByName(response: GraphResponse, query: string): GraphResponse {
  const q = query.trim().toLowerCase()
  if (!q) return response
  const visibleNodes = response.nodes.filter((n) => n.name.toLowerCase().includes(q))
  const visibleIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = response.edges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
  )
  return { ...response, nodes: visibleNodes, edges: visibleEdges }
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 72
const GROUP_WIDTH = 220
const GROUP_ITEM_HEIGHT = 28
const GROUP_HEADER_HEIGHT = 40

export function applyDagreLayout(
  nodes: RFNode[],
  edges: RFEdge[],
  direction: 'TB' | 'LR' = 'TB',
  nodeSizes?: Map<string, { width: number; height: number }>,
  rankSep = 100,
  nodeSep = 50,
): RFNode[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) => {
    const size = nodeSizes?.get(n.id) ?? { width: NODE_WIDTH, height: NODE_HEIGHT }
    g.setNode(n.id, size)
  })
  edges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    const size = nodeSizes?.get(n.id) ?? { width: NODE_WIDTH, height: NODE_HEIGHT }
    return {
      ...n,
      position: { x: pos.x - size.width / 2, y: pos.y - size.height / 2 },
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
    }
  })
}

function scaleColor(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(Math.floor(((n >> 16) & 0xff) * factor), 255)
  const g = Math.min(Math.floor(((n >> 8) & 0xff) * factor), 255)
  const b = Math.min(Math.floor((n & 0xff) * factor), 255)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function computeEdgeStroke(
  edge: { source: string; target: string; relation: string },
  kindByNodeId: Map<string, ResourceKind>,
  theme: 'dark' | 'light' = 'dark',
): { stroke: string; dashed: boolean } {
  const sourceKind = kindByNodeId.get(edge.source)
  const targetKind = kindByNodeId.get(edge.target)
  const colorKind =
    edge.relation === 'uses-config' ||
    edge.relation === 'uses-secret' ||
    edge.relation === 'mounts' ||
    edge.relation === 'bound-to'
      ? targetKind
      : sourceKind
  const baseColor = (colorKind && KIND_COLORS[colorKind]) ?? '#64748b'
  const stroke = scaleColor(baseColor, theme === 'light' ? 1.0 : 0.8)
  const dashed = sourceKind === 'Ingress' || sourceKind === 'Service'
  return { stroke, dashed }
}

export function toReactFlowGraph(
  response: GraphResponse,
  direction: 'TB' | 'LR' = 'TB',
  rankSep = 100,
  nodeSep = 50,
  theme: 'dark' | 'light' = 'dark',
): {
  nodes: RFNode[]
  edges: RFEdge[]
} {
  const connectedIds = new Set<string>()
  response.edges.forEach((e) => {
    connectedIds.add(e.source)
    connectedIds.add(e.target)
  })

  const isolatedPods: GraphNode[] = []
  const isolatedSecrets: GraphNode[] = []
  const isolatedConfigMaps: GraphNode[] = []
  const regularNodes: RFNode[] = []

  response.nodes.forEach((n) => {
    if (n.kind === 'Pod' && !connectedIds.has(n.id)) {
      isolatedPods.push(n)
    } else if (n.kind === 'Secret' && !connectedIds.has(n.id)) {
      isolatedSecrets.push(n)
    } else if (n.kind === 'ConfigMap' && !connectedIds.has(n.id)) {
      isolatedConfigMaps.push(n)
    } else {
      regularNodes.push({
        id: n.id,
        type: n.kind.toLowerCase(),
        position: { x: 0, y: 0 },
        data: n as unknown as Record<string, unknown>,
      })
    }
  })

  const nodes: RFNode[] = [...regularNodes]
  const nodeSizes = new Map<string, { width: number; height: number }>()

  if (isolatedPods.length > 0) {
    const groupHeight = GROUP_HEADER_HEIGHT + Math.min(isolatedPods.length, 8) * GROUP_ITEM_HEIGHT
    nodes.push({
      id: '__pod_group__',
      type: 'podgroup',
      position: { x: 0, y: 0 },
      data: { pods: isolatedPods, kind: 'Pod' } as unknown as Record<string, unknown>,
    })
    nodeSizes.set('__pod_group__', { width: GROUP_WIDTH, height: groupHeight })
  }

  if (isolatedSecrets.length > 0) {
    const groupHeight = GROUP_HEADER_HEIGHT + Math.min(isolatedSecrets.length, 8) * GROUP_ITEM_HEIGHT
    nodes.push({
      id: '__secret_group__',
      type: 'secretgroup',
      position: { x: 0, y: 0 },
      data: { secrets: isolatedSecrets, kind: 'Secret' } as unknown as Record<string, unknown>,
    })
    nodeSizes.set('__secret_group__', { width: GROUP_WIDTH, height: groupHeight })
  }

  if (isolatedConfigMaps.length > 0) {
    const groupHeight = GROUP_HEADER_HEIGHT + Math.min(isolatedConfigMaps.length, 8) * GROUP_ITEM_HEIGHT
    nodes.push({
      id: '__configmap_group__',
      type: 'configmapgroup',
      position: { x: 0, y: 0 },
      data: { configmaps: isolatedConfigMaps, kind: 'ConfigMap' } as unknown as Record<string, unknown>,
    })
    nodeSizes.set('__configmap_group__', { width: GROUP_WIDTH, height: groupHeight })
  }

  const kindByNodeId = new Map(response.nodes.map((n) => [n.id, n.kind]))

  const edges: RFEdge[] = response.edges.map((e) => {
    const { stroke, dashed } = computeEdgeStroke(e, kindByNodeId, theme)
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: dashed,
      style: {
        stroke,
        strokeWidth: 1.5,
        ...(dashed && { strokeDasharray: '6 3' }),
      },
      ...(dashed && { markerEnd: { type: MarkerType.ArrowClosed, color: stroke } }),
    }
  })

  const laidOut = applyDagreLayout(nodes, edges, direction, nodeSizes, rankSep, nodeSep)
  return { nodes: laidOut, edges }
}
