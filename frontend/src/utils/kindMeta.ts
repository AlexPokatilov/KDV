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

export const KIND_LABELS: Record<ResourceKind, string> = {
  Ingress: 'Ingress',
  Service: 'Service',
  Deployment: 'Deployment',
  StatefulSet: 'StatefulSet',
  DaemonSet: 'DaemonSet',
  Job: 'Job',
  CronJob: 'CronJob',
  Pod: 'Pod',
  ConfigMap: 'ConfigMap',
  Secret: 'Secret',
  PersistentVolumeClaim: 'PVC',
  PersistentVolume: 'PV',
}

export const KIND_SHORT_LABELS: Record<ResourceKind, string> = {
  Deployment: 'D',
  StatefulSet: 'STS',
  DaemonSet: 'DS',
  Pod: 'PO',
  Job: 'J',
  CronJob: 'CJ',
  Service: 'SVC',
  Ingress: 'ING',
  ConfigMap: 'CM',
  Secret: 'S',
  PersistentVolumeClaim: 'PVC',
  PersistentVolume: 'PV',
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
