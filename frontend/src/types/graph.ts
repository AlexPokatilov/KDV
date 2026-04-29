export type ResourceKind =
  | 'Pod'
  | 'Deployment'
  | 'StatefulSet'
  | 'Service'
  | 'Ingress'
  | 'ConfigMap'
  | 'Secret'
export type ViewType = 'graph' | 'mindmap' | 'tree'

export interface GraphNode {
  id: string
  kind: ResourceKind
  name: string
  namespace: string
  labels: Record<string, string>
  status?: string
  replicas?: number
  selector?: Record<string, string>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relation: 'selects' | 'routes-to' | 'uses-config' | 'uses-secret' | 'uses-tls'
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
