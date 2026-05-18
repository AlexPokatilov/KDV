import { describe, it, expect } from 'vitest'
import { KIND_COLORS, KIND_SHORT_LABELS, KIND_LABELS, ALL_KINDS } from './kindMeta'
import type { ResourceKind } from '../types/graph'

const ALL_RESOURCE_KINDS: ResourceKind[] = [
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'Job',
  'CronJob',
  'Service',
  'Ingress',
  'ConfigMap',
  'Secret',
  'PersistentVolumeClaim',
  'PersistentVolume',
]

describe('KIND_COLORS', () => {
  it('covers every ResourceKind', () => {
    for (const kind of ALL_RESOURCE_KINDS) {
      expect(KIND_COLORS[kind], `KIND_COLORS missing "${kind}"`).toBeDefined()
    }
  })

  it('all values are valid hex colors', () => {
    for (const [kind, color] of Object.entries(KIND_COLORS)) {
      expect(color, `KIND_COLORS["${kind}"] is not a hex color`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('KIND_SHORT_LABELS', () => {
  it('covers every ResourceKind', () => {
    for (const kind of ALL_RESOURCE_KINDS) {
      expect(KIND_SHORT_LABELS[kind], `KIND_SHORT_LABELS missing "${kind}"`).toBeDefined()
    }
  })

  it('all labels are non-empty strings', () => {
    for (const [kind, label] of Object.entries(KIND_SHORT_LABELS)) {
      expect(typeof label).toBe('string')
      expect(label.length, `KIND_SHORT_LABELS["${kind}"] is empty`).toBeGreaterThan(0)
    }
  })
})

describe('KIND_LABELS', () => {
  it('covers every ResourceKind', () => {
    for (const kind of ALL_RESOURCE_KINDS) {
      expect(KIND_LABELS[kind], `KIND_LABELS missing "${kind}"`).toBeDefined()
    }
  })
})

describe('ALL_KINDS', () => {
  it('contains all 12 ResourceKind values', () => {
    expect(ALL_KINDS).toHaveLength(12)
    for (const kind of ALL_RESOURCE_KINDS) {
      expect(ALL_KINDS, `ALL_KINDS missing "${kind}"`).toContain(kind)
    }
  })

  it('has no duplicates', () => {
    const unique = new Set(ALL_KINDS)
    expect(unique.size).toBe(ALL_KINDS.length)
  })
})
