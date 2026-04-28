from datetime import datetime, timezone
from typing import Optional

from app.models.graph import GraphEdge, GraphNode, GraphResponse, ResourceKind
from app.services.k8s_client import KubernetesClient


def _node_id(kind: str, namespace: str, name: str) -> str:
    return f"{kind}/{namespace}/{name}"


def _labels_match(selector: dict[str, str], labels: dict[str, str]) -> bool:
    """Returns True if every key-value in selector is present in labels.
    Empty selector matches nothing to avoid wildcard connections."""
    if not selector:
        return False
    return all(labels.get(k) == v for k, v in selector.items())


def _pod_status(pod) -> str:
    phase = pod.status.phase or "Unknown"
    if pod.status.conditions:
        for cond in pod.status.conditions:
            if cond.type == "Ready" and cond.status == "False":
                return "NotReady"
    return phase


def build_graph(namespace: str, k8s: KubernetesClient) -> GraphResponse:
    pods = k8s.list_pods(namespace)
    deployments = k8s.list_deployments(namespace)
    services = k8s.list_services(namespace)
    ingresses = k8s.list_ingresses(namespace)

    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen_edges: set[tuple[str, str]] = set()

    def add_edge(source: str, target: str, relation: str):
        key = (source, target)
        if key not in seen_edges:
            seen_edges.add(key)
            edges.append(GraphEdge(
                id=f"{source}->{target}",
                source=source,
                target=target,
                relation=relation,
            ))

    for pod in pods:
        nodes.append(GraphNode(
            id=_node_id("Pod", namespace, pod.metadata.name),
            kind=ResourceKind.Pod,
            name=pod.metadata.name,
            namespace=namespace,
            labels=pod.metadata.labels or {},
            status=_pod_status(pod),
        ))

    for dep in deployments:
        selector = {}
        if dep.spec.selector and dep.spec.selector.match_labels:
            selector = dep.spec.selector.match_labels
        ready = dep.status.ready_replicas or 0
        desired = dep.spec.replicas or 0
        nodes.append(GraphNode(
            id=_node_id("Deployment", namespace, dep.metadata.name),
            kind=ResourceKind.Deployment,
            name=dep.metadata.name,
            namespace=namespace,
            labels=dep.metadata.labels or {},
            status=f"{ready}/{desired}",
            replicas=desired,
            selector=selector,
        ))
        dep_id = _node_id("Deployment", namespace, dep.metadata.name)
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(dep_id, _node_id("Pod", namespace, pod.metadata.name), "selects")

    service_by_name: dict[str, str] = {}
    for svc in services:
        selector = svc.spec.selector or {}
        svc_id = _node_id("Service", namespace, svc.metadata.name)
        service_by_name[svc.metadata.name] = svc_id
        nodes.append(GraphNode(
            id=svc_id,
            kind=ResourceKind.Service,
            name=svc.metadata.name,
            namespace=namespace,
            labels=svc.metadata.labels or {},
            selector=selector,
        ))
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(svc_id, _node_id("Pod", namespace, pod.metadata.name), "selects")

    for ing in ingresses:
        ing_id = _node_id("Ingress", namespace, ing.metadata.name)
        nodes.append(GraphNode(
            id=ing_id,
            kind=ResourceKind.Ingress,
            name=ing.metadata.name,
            namespace=namespace,
            labels=ing.metadata.labels or {},
        ))
        # Default backend
        if ing.spec.default_backend and ing.spec.default_backend.service:
            svc_name = ing.spec.default_backend.service.name
            if svc_name in service_by_name:
                add_edge(ing_id, service_by_name[svc_name], "routes-to")
        # Rules
        for rule in (ing.spec.rules or []):
            if not rule.http:
                continue
            for path in (rule.http.paths or []):
                if path.backend and path.backend.service:
                    svc_name = path.backend.service.name
                    if svc_name in service_by_name:
                        add_edge(ing_id, service_by_name[svc_name], "routes-to")

    return GraphResponse(
        namespace=namespace,
        nodes=nodes,
        edges=edges,
        generated_at=datetime.now(tz=timezone.utc),
    )
