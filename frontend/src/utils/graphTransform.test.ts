import { describe, it, expect } from 'vitest'
import { filterByKinds, filterByName, computeEdgeStroke } from './graphTransform'
import type { GraphResponse, ResourceKind } from '../types/graph'

const ALL_VISIBLE: Record<ResourceKind, boolean> = {
  Pod: true,
  Deployment: true,
  StatefulSet: true,
  DaemonSet: true,
  Job: true,
  CronJob: true,
  Service: true,
  Ingress: true,
  ConfigMap: true,
  Secret: true,
  PersistentVolumeClaim: true,
  PersistentVolume: true,
}

const SAMPLE: GraphResponse = {
  namespace: 'default',
  generated_at: '2024-01-01T00:00:00Z',
  nodes: [
    { id: 'dep/default/api', kind: 'Deployment', name: 'api', namespace: 'default', labels: {} },
    { id: 'pod/default/api-123', kind: 'Pod', name: 'api-123', namespace: 'default', labels: {} },
    { id: 'svc/default/api-svc', kind: 'Service', name: 'api-svc', namespace: 'default', labels: {} },
  ],
  edges: [
    { id: 'e1', source: 'dep/default/api', target: 'pod/default/api-123', relation: 'owns' },
    { id: 'e2', source: 'svc/default/api-svc', target: 'pod/default/api-123', relation: 'selects' },
  ],
}

describe('filterByKinds', () => {
  it('returns all nodes when all kinds are visible', () => {
    const result = filterByKinds(SAMPLE, ALL_VISIBLE)
    expect(result.nodes).toHaveLength(3)
    expect(result.edges).toHaveLength(2)
  })

  it('removes hidden nodes and their edges', () => {
    const visible = { ...ALL_VISIBLE, Pod: false }
    const result = filterByKinds(SAMPLE, visible)
    expect(result.nodes.find((n) => n.kind === 'Pod')).toBeUndefined()
    expect(result.edges).toHaveLength(0)
  })

  it('keeps edges when both endpoints are visible', () => {
    const visible = { ...ALL_VISIBLE, Service: false }
    const result = filterByKinds(SAMPLE, visible)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].id).toBe('e1')
  })
})

describe('filterByName', () => {
  it('returns all nodes for empty query', () => {
    const result = filterByName(SAMPLE, '')
    expect(result.nodes).toHaveLength(3)
  })

  it('returns all nodes for whitespace-only query', () => {
    const result = filterByName(SAMPLE, '   ')
    expect(result.nodes).toHaveLength(3)
  })

  it('filters nodes by name substring (case-insensitive)', () => {
    const result = filterByName(SAMPLE, 'API')
    expect(result.nodes).toHaveLength(3)
  })

  it('filters out non-matching nodes', () => {
    const result = filterByName(SAMPLE, 'api-svc')
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].name).toBe('api-svc')
    expect(result.edges).toHaveLength(0)
  })
})

describe('computeEdgeStroke', () => {
  const kindByNodeId = new Map<string, ResourceKind>([
    ['dep/default/api', 'Deployment'],
    ['pod/default/api-123', 'Pod'],
    ['svc/default/api-svc', 'Service'],
    ['cm/default/cfg', 'ConfigMap'],
  ])

  it('returns a hex stroke color', () => {
    const { stroke } = computeEdgeStroke(
      { source: 'dep/default/api', target: 'pod/default/api-123', relation: 'owns' },
      kindByNodeId,
    )
    expect(stroke).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('uses target kind color for mounts relation', () => {
    const { stroke: mountsStroke } = computeEdgeStroke(
      { source: 'pod/default/api-123', target: 'cm/default/cfg', relation: 'mounts' },
      kindByNodeId,
    )
    const { stroke: ownsStroke } = computeEdgeStroke(
      { source: 'dep/default/api', target: 'pod/default/api-123', relation: 'owns' },
      kindByNodeId,
    )
    expect(mountsStroke).not.toBe(ownsStroke)
  })

  it('marks Service source edges as dashed', () => {
    const { dashed } = computeEdgeStroke(
      { source: 'svc/default/api-svc', target: 'pod/default/api-123', relation: 'selects' },
      kindByNodeId,
    )
    expect(dashed).toBe(true)
  })

  it('marks Deployment source edges as non-dashed', () => {
    const { dashed } = computeEdgeStroke(
      { source: 'dep/default/api', target: 'pod/default/api-123', relation: 'owns' },
      kindByNodeId,
    )
    expect(dashed).toBe(false)
  })

  it('falls back to default color for unknown node id', () => {
    const { stroke } = computeEdgeStroke(
      { source: 'unknown/x', target: 'unknown/y', relation: 'owns' },
      kindByNodeId,
    )
    expect(stroke).toMatch(/^#[0-9a-f]{6}$/)
  })
})
