import type { ResourceKind } from '../types/graph'

export const KIND_COLORS: Record<ResourceKind, string> = {
  Ingress: '#8b5cf6',
  Service: '#f59e0b',
  Deployment: '#3b82f6',
  StatefulSet: '#06b6d4',
  DaemonSet: '#14b8a6',
  Job: '#f97316',
  CronJob: '#d946ef',
  Pod: '#22c55e',
  ConfigMap: '#ec4899',
  Secret: '#f43f5e',
  PersistentVolumeClaim: '#6366f1',
  PersistentVolume: '#84cc16',
}

export const ALL_KINDS: ResourceKind[] = [
  'Ingress',
  'Service',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'Job',
  'CronJob',
  'Pod',
  'ConfigMap',
  'Secret',
  'PersistentVolumeClaim',
  'PersistentVolume',
]
