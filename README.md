# Kubernetes Dependency Viewer (KDV)

[![Build](https://github.com/AlexPokatilov/KDV/actions/workflows/build.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/build.yml)
[![Lint](https://github.com/AlexPokatilov/KDV/actions/workflows/lint.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/lint.yml)
[![Docker Lint](https://github.com/AlexPokatilov/KDV/actions/workflows/hadolint.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/hadolint.yml)
[![CodeQL](https://github.com/AlexPokatilov/KDV/actions/workflows/codeql.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/codeql.yml)
[![Release](https://github.com/AlexPokatilov/KDV/actions/workflows/release.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/release.yml)
[![Helm Release](https://github.com/AlexPokatilov/KDV/actions/workflows/helm-release.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/helm-release.yml)

KDV is an open-source tool for visualizing dependencies between Kubernetes resources. It provides two interactive views — a structured graph and a force-directed bubble layout — to help developers and DevOps engineers understand how workloads, services, configurations, and storage are connected.

---

## Features

- **Graph view** — React Flow DAG layout with automatic dagre positioning, zoom, pan, and minimap
- **Bubbles view** — d3-force simulation where each resource is rendered as a colored circle; supports node drag, zoom, pan, and minimap
- **Two view modes**: switch between Graph and Bubbles from the sidebar
- **Namespace selector** — switch between namespaces to focus on specific environments
- **Resource kind filter** — toggle individual resource types (Deployment, Service, Pod, etc.)
- **Name search** — live filter nodes by resource name
- **Node detail panel** — click any node to see labels, annotations, status, and ports
- **Layout controls**:
  - Graph view: Vertical/Horizontal direction, Rank gap, Node gap sliders
  - Bubbles view: Force Strength and Distance sliders
- **Light / dark theme** — toggle from the header
- **Resizable sidebar**
- **Zoom controls and minimap** in both views (matching React Flow's Controls and MiniMap style)

### Supported Resource Types

| Kind | Abbreviation |
|---|---|
| Deployment | D |
| StatefulSet | STS |
| DaemonSet | DS |
| Job | J |
| CronJob | CJ |
| Service | SVC |
| Ingress | ING |
| Pod | PO |
| ConfigMap | CM |
| Secret | S |
| PersistentVolumeClaim | PVC |
| PersistentVolume | PV |

### Tracked Relationships

| Source | → | Target |
|---|---|---|
| Deployment / StatefulSet / DaemonSet | owns | Pod |
| CronJob | spawns | Job |
| Job | spawns | Pod |
| Service | selects | Pod |
| Ingress | routes to | Service |
| Pod | mounts | ConfigMap |
| Pod | mounts | Secret |
| Pod | claims | PersistentVolumeClaim |
| PersistentVolumeClaim | bound to | PersistentVolume |

---

## Technology Stack

**Backend**
- Python 3.12, FastAPI, Uvicorn
- `kubernetes` Python client (auto-detects `~/.kube/config` locally, ServiceAccount in-cluster)
- Pydantic v2 for data validation

**Frontend**
- TypeScript, React 18, Vite
- React Flow (`@xyflow/react`) — Graph view, layout via `@dagrejs/dagre`
- d3-force — Bubbles view physics simulation
- Zustand — UI state management
- TanStack Query — data fetching with 30 s stale / 60 s refetch

**Deployment**
- Docker (multi-stage: `node:20-slim` builder → `python:3.12-slim` runtime)
- Docker Compose
- Helm chart with optional cluster-scoped RBAC

---

## Quick Start

### Docker Compose (local)

Runs KDV using your existing `~/.kube/config`:

```bash
git clone https://github.com/AlexPokatilov/KDV.git
cd KDV
docker compose up -d
```

Open [http://localhost:8000](http://localhost:8000).

### Kubernetes (Helm)

```bash
helm repo add kdv https://alexpokatilov.github.io/KDV
helm repo update
helm install kdv kdv/kdv --namespace kdv --create-namespace
```

By default the chart creates a namespace-scoped `Role` and `RoleBinding`. To watch resources across the **entire cluster**, enable cluster-scoped RBAC in `values.yaml`:

```yaml
rbac:
  create: true
  clusterScoped: true
```

---

## Project Structure

```
KDV/
├── backend/
│   └── app/
│       ├── main.py                   # FastAPI app, static file serving
│       ├── config.py                 # Settings (IN_CLUSTER, LOG_LEVEL, etc.)
│       ├── models/graph.py           # GraphNode / GraphEdge Pydantic models
│       ├── routers/
│       │   ├── graph.py              # GET /api/graph?namespace=...
│       │   ├── namespaces.py         # GET /api/namespaces
│       │   └── health.py             # GET /healthz
│       └── services/
│           ├── k8s_client.py         # Kubernetes API wrapper
│           └── dependency_resolver.py # Resource relationship logic
├── frontend/
│   └── src/
│       ├── api/                      # React Query hooks (graph, namespaces)
│       ├── components/
│       │   ├── bubbles/BubblesView.tsx   # d3-force bubble view
│       │   ├── common/               # LoadingSpinner, ErrorBanner
│       │   ├── graph/
│       │   │   ├── GraphView.tsx         # React Flow graph view
│       │   │   ├── NodeDetailPanel.tsx   # Side panel for selected node
│       │   │   └── nodes/
│       │   │       ├── K8sNode.tsx       # Factory for all 12 leaf node types
│       │   │       └── GroupNode.tsx     # Factory for Pod/Secret/ConfigMap groups
│       │   └── layout/               # Header, Sidebar
│       ├── store/uiStore.ts          # Zustand store (theme, filters, layout params)
│       ├── types/graph.ts            # GraphNode, GraphEdge, ResourceKind types
│       └── utils/
│           ├── graphTransform.ts     # Filtering, dagre layout, edge color logic
│           └── kindMeta.ts           # KIND_COLORS, KIND_LABELS, KIND_SHORT_LABELS
├── helm/kdv/                         # Helm chart
├── Dockerfile                        # Multi-stage build
└── docker-compose.yml
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/namespaces` | List all namespaces |
| `GET` | `/api/graph?namespace={ns}` | Resource graph for a namespace |
| `GET` | `/healthz` | Health check |
| `GET` | `/*` | Serves React SPA static files |

### `GET /api/graph` response

```json
{
  "nodes": [
    {
      "id": "deployment/default/nginx",
      "kind": "Deployment",
      "name": "nginx",
      "namespace": "default",
      "status": "3",
      "labels": { "app": "nginx" }
    }
  ],
  "edges": [
    {
      "id": "deployment/default/nginx->pod/default/nginx-xxx",
      "source": "deployment/default/nginx",
      "target": "pod/default/nginx-xxx",
      "relation": "owns"
    }
  ]
}
```

---

## Configuration

Environment variables (set in Docker / Helm):

| Variable | Default | Description |
|---|---|---|
| `IN_CLUSTER` | `false` | Use ServiceAccount token instead of kubeconfig |
| `LOG_LEVEL` | `info` | Uvicorn log level |
| `STATIC_DIR` | `/app/static` | Path to built frontend assets |

---

## License

MIT
