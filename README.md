# Kubernetes Dependency Viewer (KDV)

[![Build](https://github.com/AlexPokatilov/KDV/actions/workflows/build.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/build.yml)
[![Lint](https://github.com/AlexPokatilov/KDV/actions/workflows/lint.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/lint.yml)
[![Docker Lint](https://github.com/AlexPokatilov/KDV/actions/workflows/hadolint.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/hadolint.yml)
[![CodeQL](https://github.com/AlexPokatilov/KDV/actions/workflows/codeql.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/codeql.yml)
[![Release](https://github.com/AlexPokatilov/KDV/actions/workflows/release.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/release.yml)
[![Helm Release](https://github.com/AlexPokatilov/KDV/actions/workflows/helm-release.yml/badge.svg)](https://github.com/AlexPokatilov/KDV/actions/workflows/helm-release.yml)

KDV (Kubernetes Dependency Viewer) is an open-source tool designed to visualize the relationships and dependencies between various Kubernetes resources within a cluster. It provides an intuitive, interactive graph interface to help developers and DevOps engineers understand how workloads, services, configurations, and storage are connected.

## Features

- **Interactive Graph Visualization**: Uses React Flow to render clear, interactive dependency graphs.
- **Namespace Filtering**: Easily switch between namespaces to focus on specific environments.
- **Resource Relationships**: Visualizes connections such as:
  - `Deployment/StatefulSet/DaemonSet` ➡️ `Pod`
  - `Service` ➡️ `Pod`
  - `Ingress` ➡️ `Service`
  - `Pod` ➡️ `ConfigMap`, `Secret`, `PersistentVolumeClaim`
  - `PersistentVolumeClaim` ➡️ `PersistentVolume`
  - `CronJob` ➡️ `Job` ➡️ `Pod`
- **Zero Configuration**: Automatically reads your `~/.kube/config` when run locally or uses the ServiceAccount token when running in-cluster.
- **Single Container Deployment**: Backend (FastAPI) and Frontend (React/Vite) are bundled together for easy deployment.

## Technology Stack

- **Backend**: Python 3.12, FastAPI, Kubernetes Python Client
- **Frontend**: TypeScript, React 18, Vite, React Flow, Zustand, TanStack Query
- **Deployment**: Docker, Docker Compose, Helm
- **CI/CD**: GitHub Actions (Linting, Docker Build & Push, Releases)

## Quick Start (Local with Docker Compose)

To run KDV locally using your existing `~/.kube/config`:

```bash
# Clone the repository
git clone https://github.com/AlexPokatilov/KDV.git
cd KDV

# Run with docker-compose
docker compose up -d
```

Open your browser and navigate to [http://localhost:8000](http://localhost:8000).

## Kubernetes Deployment (Helm)

```bash
# Add the Helm repository
helm repo add kdv https://alexpokatilov.github.io/KDV
helm repo update

# Install the chart
helm install kdv kdv/kdv --namespace kdv --create-namespace
```

### Important Helm Configuration (`values.yaml`)

By default, the Helm chart creates a `Role` and `RoleBinding` to allow KDV to read resources *only in the namespace it is deployed to*.

If you want KDV to view resources across the **entire cluster**, enable cluster-scoped RBAC:

```yaml
rbac:
  create: true
  clusterScoped: true
```

## License

This project is licensed under the terms of the MIT license.
