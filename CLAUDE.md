# KDV — Claude Code Instructions

## Project Overview

KDV (Kubernetes Dependency Viewer) is a full-stack application:
- **Backend**: Python 3.12 / FastAPI (`backend/`)
- **Frontend**: TypeScript / React 18 / Vite (`frontend/`)
- **Deployment**: Docker, Docker Compose, Helm chart (`helm/`)

---

## Mandatory: Before Every PR Merge to `main` or Release

> These steps are **required** and must not be skipped.

### 1. Automated Checks (must all pass)

Run these locally before opening a PR — CI enforces them too:

```bash
# Backend
cd backend
pip install -r requirements.txt -r requirements-dev.txt
ruff check .
ruff format --check .
pytest tests/ -v

# Frontend
cd frontend
npm install
npm run type-check
npm run lint
npm run test
```

> All four commands must exit 0. A failing test or lint error blocks the merge.

### 2. Documentation Update

Every PR that adds, removes, or changes user-visible behaviour **must** update the relevant docs before merge:

- [ ] `README.md` — Features list, Supported Resource Types table, Tracked Relationships table, API Reference, Configuration table, and Project Structure tree are all accurate
- [ ] `CLAUDE.md` — Development Standards section reflects any new conventions introduced by the PR (new factories, new store fields, new route patterns, etc.)
- [ ] `.env.example` — any new environment variable is documented with its default and a one-line description
- [ ] In-code comments — public functions/helpers that change signature or behaviour have updated doc comments (or none if self-explanatory)

> "Up to date" means a reader unfamiliar with the PR can understand the feature solely from the docs — no cross-referencing the diff required.

### 3. Code Review

- Every PR targeting `main` must be reviewed before merge — do not self-merge without review
- Review checklist:
  - [ ] Automated checks pass (see above)
  - [ ] Documentation updated (see above)
  - [ ] No hardcoded secrets, credentials, or cluster-specific values
  - [ ] CSS class names follow BEM convention used in the project
  - [ ] New components reuse existing utilities (`filterByKinds`, `computeEdgeStroke`, `KIND_COLORS`, etc.) — no duplication
  - [ ] Loading and error states use `<LoadingSpinner>` and `<ErrorBanner>` (not inline markup)
  - [ ] Node components use the `makeK8sNode` / `makeGroupNode` factories in `K8sNode.tsx` / `GroupNode.tsx`

### 4. Service Testing

Before merging or releasing, manually verify the running service:

**Graph view**
- [ ] All node kinds render (Deployment, StatefulSet, DaemonSet, Job, CronJob, Service, Ingress, ConfigMap, Secret, PVC, PV, Pod)
- [ ] Pod node border color reflects status (running = green, pending = yellow, error = red)
- [ ] Group nodes (PodGroup, SecretGroup, ConfigMapGroup) render; clicking an item opens NodeDetailPanel
- [ ] Edge colors and dash styles are correct (match Graph and Bubbles views)
- [ ] Dagre layout direction (Vertical / Horizontal) and gap sliders work

**Bubbles view**
- [ ] Force simulation runs and stabilises
- [ ] Force Strength and Distance sliders reheat simulation live
- [ ] Node drag pins and unpins correctly
- [ ] Zoom (wheel + buttons), pan, and Fit View work
- [ ] Minimap viewport rect tracks pan/zoom correctly

**Shared UI**
- [ ] Namespace selector loads and switches namespaces
- [ ] Kind filter toggles update the view live
- [ ] Name search filters nodes live
- [ ] NodeDetailPanel opens on node click, closes on background click
- [ ] Light / dark theme toggle works in both views
- [ ] Sidebar is resizable

**Build**
- [ ] `docker build .` from repo root completes successfully

### 5. Before a Release Tag

In addition to all of the above:
- [ ] `README.md` reflects the final state of the release (features, config, API)
- [ ] `Chart.yaml` `version` and `appVersion` in `helm/kdv/` match the release tag OR confirm the CI workflow sets them dynamically (current behaviour)
- [ ] The release tag follows the `MAJOR.MINOR.PATCH` format (e.g. `1.3.0`)

---

## Development Standards

### TypeScript / React

- New Kubernetes node types → add to `makeK8sNode` in `frontend/src/components/graph/nodes/K8sNode.tsx`; do not create separate files
- New group node types → add to `makeGroupNode` in `frontend/src/components/graph/nodes/GroupNode.tsx`
- New resource kinds → add to `ResourceKind` union in `frontend/src/types/graph.ts`, `KIND_COLORS` and `KIND_SHORT_LABELS` in `frontend/src/utils/kindMeta.ts`
- Store state → add to `frontend/src/store/uiStore.ts` (Zustand)
- CSS class names must follow BEM: `.block__element--modifier`

### Python / Backend

- API routes → `backend/app/routers/`
- New resource types → extend `backend/app/services/dependency_resolver.py`
- Pydantic models → `backend/app/models/graph.py`
- All K8s API calls must be wrapped with `try/except ApiException` via `_raise_for_k8s_error()` in `k8s_client.py`
- Run linter before committing: `ruff check backend/`
- Run tests before committing: `pytest backend/tests/ -v`

### Git

- Branch naming: `feature/<topic>`, `fix/<topic>`, `refactor/<topic>`, `chore/<topic>`
- Commit messages: imperative mood, describe the *why* not just the *what*
- PRs target `main`; Helm chart and Docker image are published automatically on GitHub Release

---

## CI Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `build.yml` | push / PR | Docker build check |
| `lint.yml` | push / PR | Python ruff + pytest + frontend tsc + eslint + vitest |
| `hadolint.yml` | push / PR | Dockerfile lint |
| `codeql.yml` | push / PR / schedule | Security scanning |
| `release.yml` | GitHub Release published | Docker push to Hub + Helm chart publish |

Helm chart version is set from the release tag automatically — no manual `Chart.yaml` bump needed.
