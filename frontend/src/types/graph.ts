export type ResourceKind =
  | 'Pod'
  | 'Deployment'
  | 'StatefulSet'
  | 'DaemonSet'
  | 'Job'
  | 'CronJob'
  | 'Service'
  | 'Ingress'
  | 'ConfigMap'
  | 'Secret'
  | 'PersistentVolumeClaim'
  | 'PersistentVolume'
export type ViewType = 'graph' | 'bubbles' | 'table'

export interface ServicePort {
  name?: string
  port: number
  target_port?: string
  protocol: string
}

export interface IngressRule {
  host?: string
  path: string
  service_name: string
  service_port?: string
}

export interface GraphNode {
  id: string
  kind: ResourceKind
  name: string
  namespace: string
  labels: Record<string, string>
  status?: string
  replicas?: number
  selector?: Record<string, string>
  ports?: ServicePort[]
  ingress_rules?: IngressRule[]
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relation: 'selects' | 'routes-to' | 'uses-config' | 'uses-secret' | 'uses-tls' | 'owns' | 'mounts' | 'bound-to'
}

export interface GraphResponse {
  namespace: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  generated_at: string
}

export interface NamespacesResponse {
  namespaces: string[]
}
