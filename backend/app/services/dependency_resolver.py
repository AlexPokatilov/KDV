from datetime import datetime, timezone

from app.models.graph import (
    GraphEdge,
    GraphNode,
    GraphResponse,
    IngressRule,
    ResourceKind,
    ServicePort,
)
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


def _ingress_port(port_spec) -> str | None:
    if port_spec is None:
        return None
    if port_spec.number:
        return str(port_spec.number)
    return port_spec.name or None


def _pod_pvc_refs(pod) -> set[str]:
    refs: set[str] = set()
    spec = pod.spec
    if not spec:
        return refs
    for vol in (spec.volumes or []):
        if vol.persistent_volume_claim and vol.persistent_volume_claim.claim_name:
            refs.add(vol.persistent_volume_claim.claim_name)
    return refs


def _pod_configmap_refs(pod) -> set[str]:
    refs: set[str] = set()
    spec = pod.spec
    if not spec:
        return refs

    for vol in (spec.volumes or []):
        if vol.config_map and vol.config_map.name:
            refs.add(vol.config_map.name)
        if vol.projected and vol.projected.sources:
            for src in vol.projected.sources:
                if src.config_map and src.config_map.name:
                    refs.add(src.config_map.name)

    all_containers = list(spec.containers or []) + list(spec.init_containers or [])
    for c in all_containers:
        for env in (c.env or []):
            vf = env.value_from
            if vf and vf.config_map_key_ref and vf.config_map_key_ref.name:
                refs.add(vf.config_map_key_ref.name)
        for ef in (c.env_from or []):
            if ef.config_map_ref and ef.config_map_ref.name:
                refs.add(ef.config_map_ref.name)
    return refs


def _pod_secret_refs(pod) -> set[str]:
    refs: set[str] = set()
    spec = pod.spec
    if not spec:
        return refs

    for s in (spec.image_pull_secrets or []):
        if s.name:
            refs.add(s.name)

    for vol in (spec.volumes or []):
        if vol.secret and vol.secret.secret_name:
            refs.add(vol.secret.secret_name)
        if vol.projected and vol.projected.sources:
            for src in vol.projected.sources:
                if src.secret and src.secret.name:
                    refs.add(src.secret.name)

    all_containers = list(spec.containers or []) + list(spec.init_containers or [])
    for c in all_containers:
        for env in (c.env or []):
            vf = env.value_from
            if vf and vf.secret_key_ref and vf.secret_key_ref.name:
                refs.add(vf.secret_key_ref.name)
        for ef in (c.env_from or []):
            if ef.secret_ref and ef.secret_ref.name:
                refs.add(ef.secret_ref.name)
    return refs


def build_graph(namespace: str, k8s: KubernetesClient) -> GraphResponse:
    pods = k8s.list_pods(namespace)
    deployments = k8s.list_deployments(namespace)
    statefulsets = k8s.list_statefulsets(namespace)
    daemonsets = k8s.list_daemonsets(namespace)
    jobs = k8s.list_jobs(namespace)
    cronjobs = k8s.list_cronjobs(namespace)
    services = k8s.list_services(namespace)
    ingresses = k8s.list_ingresses(namespace)
    configmaps = k8s.list_configmaps(namespace)
    secrets = k8s.list_secrets(namespace)
    pvcs = k8s.list_pvcs(namespace)
    all_pvs = k8s.list_pvs()

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

    # Pods
    for pod in pods:
        nodes.append(GraphNode(
            id=_node_id("Pod", namespace, pod.metadata.name),
            kind=ResourceKind.Pod,
            name=pod.metadata.name,
            namespace=namespace,
            labels=pod.metadata.labels or {},
            status=_pod_status(pod),
        ))

    # Deployments -> Pods
    for dep in deployments:
        selector = {}
        if dep.spec.selector and dep.spec.selector.match_labels:
            selector = dep.spec.selector.match_labels
        ready = dep.status.ready_replicas or 0
        desired = dep.spec.replicas or 0
        dep_id = _node_id("Deployment", namespace, dep.metadata.name)
        nodes.append(GraphNode(
            id=dep_id,
            kind=ResourceKind.Deployment,
            name=dep.metadata.name,
            namespace=namespace,
            labels=dep.metadata.labels or {},
            status=f"{ready}/{desired}",
            replicas=desired,
            selector=selector,
        ))
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(dep_id, _node_id("Pod", namespace, pod.metadata.name), "selects")

    # StatefulSets -> Pods
    for sts in statefulsets:
        selector = {}
        if sts.spec.selector and sts.spec.selector.match_labels:
            selector = sts.spec.selector.match_labels
        ready = sts.status.ready_replicas or 0
        desired = sts.spec.replicas or 0
        sts_id = _node_id("StatefulSet", namespace, sts.metadata.name)
        nodes.append(GraphNode(
            id=sts_id,
            kind=ResourceKind.StatefulSet,
            name=sts.metadata.name,
            namespace=namespace,
            labels=sts.metadata.labels or {},
            status=f"{ready}/{desired}",
            replicas=desired,
            selector=selector,
        ))
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(sts_id, _node_id("Pod", namespace, pod.metadata.name), "selects")

    # DaemonSets -> Pods
    for ds in daemonsets:
        selector = {}
        if ds.spec.selector and ds.spec.selector.match_labels:
            selector = ds.spec.selector.match_labels
        ready = ds.status.number_ready or 0
        desired = ds.status.desired_number_scheduled or 0
        ds_id = _node_id("DaemonSet", namespace, ds.metadata.name)
        nodes.append(GraphNode(
            id=ds_id,
            kind=ResourceKind.DaemonSet,
            name=ds.metadata.name,
            namespace=namespace,
            labels=ds.metadata.labels or {},
            status=f"{ready}/{desired}",
            replicas=desired,
            selector=selector,
        ))
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(ds_id, _node_id("Pod", namespace, pod.metadata.name), "selects")

    # CronJobs
    cronjob_by_name: dict[str, str] = {}
    for cj in cronjobs:
        cj_id = _node_id("CronJob", namespace, cj.metadata.name)
        cronjob_by_name[cj.metadata.name] = cj_id
        schedule = cj.spec.schedule or ""
        nodes.append(GraphNode(
            id=cj_id,
            kind=ResourceKind.CronJob,
            name=cj.metadata.name,
            namespace=namespace,
            labels=cj.metadata.labels or {},
            status=schedule,
        ))

    # Jobs -> Pods
    for job in jobs:
        selector = {}
        if job.spec.selector and job.spec.selector.match_labels:
            selector = job.spec.selector.match_labels
        succeeded = job.status.succeeded or 0
        completions = job.spec.completions or 1
        job_id = _node_id("Job", namespace, job.metadata.name)
        nodes.append(GraphNode(
            id=job_id,
            kind=ResourceKind.Job,
            name=job.metadata.name,
            namespace=namespace,
            labels=job.metadata.labels or {},
            status=f"{succeeded}/{completions}",
            replicas=completions,
            selector=selector,
        ))
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(job_id, _node_id("Pod", namespace, pod.metadata.name), "selects")
        for ref in (job.metadata.owner_references or []):
            if ref.kind == "CronJob" and ref.name in cronjob_by_name:
                add_edge(cronjob_by_name[ref.name], job_id, "owns")

    # Services -> Pods
    service_by_name: dict[str, str] = {}
    for svc in services:
        selector = svc.spec.selector or {}
        svc_id = _node_id("Service", namespace, svc.metadata.name)
        service_by_name[svc.metadata.name] = svc_id
        svc_ports = [
            ServicePort(
                name=p.name,
                port=p.port,
                target_port=str(p.target_port) if p.target_port is not None else None,
                protocol=p.protocol or "TCP",
            )
            for p in (svc.spec.ports or [])
        ]
        nodes.append(GraphNode(
            id=svc_id,
            kind=ResourceKind.Service,
            name=svc.metadata.name,
            namespace=namespace,
            labels=svc.metadata.labels or {},
            selector=selector,
            ports=svc_ports or None,
        ))
        for pod in pods:
            if _labels_match(selector, pod.metadata.labels or {}):
                add_edge(svc_id, _node_id("Pod", namespace, pod.metadata.name), "selects")

    # ConfigMaps
    configmap_by_name: dict[str, str] = {}
    for cm in configmaps:
        cm_id = _node_id("ConfigMap", namespace, cm.metadata.name)
        configmap_by_name[cm.metadata.name] = cm_id
        nodes.append(GraphNode(
            id=cm_id,
            kind=ResourceKind.ConfigMap,
            name=cm.metadata.name,
            namespace=namespace,
            labels=cm.metadata.labels or {},
        ))

    # Secrets
    secret_by_name: dict[str, str] = {}
    for sec in secrets:
        sec_id = _node_id("Secret", namespace, sec.metadata.name)
        secret_by_name[sec.metadata.name] = sec_id
        nodes.append(GraphNode(
            id=sec_id,
            kind=ResourceKind.Secret,
            name=sec.metadata.name,
            namespace=namespace,
            labels=sec.metadata.labels or {},
            status=sec.type,
        ))

    # PVCs -> PVs
    pvc_by_name: dict[str, str] = {}
    pv_names_needed: set[str] = set()
    for pvc in pvcs:
        pvc_id = _node_id("PersistentVolumeClaim", namespace, pvc.metadata.name)
        pvc_by_name[pvc.metadata.name] = pvc_id
        nodes.append(GraphNode(
            id=pvc_id,
            kind=ResourceKind.PersistentVolumeClaim,
            name=pvc.metadata.name,
            namespace=namespace,
            labels=pvc.metadata.labels or {},
            status=pvc.status.phase or "Unknown",
        ))
        if pvc.spec.volume_name:
            pv_names_needed.add(pvc.spec.volume_name)

    pv_by_name: dict[str, str] = {}
    for pv in all_pvs:
        if pv.metadata.name not in pv_names_needed:
            continue
        pv_id = _node_id("PersistentVolume", "", pv.metadata.name)
        pv_by_name[pv.metadata.name] = pv_id
        nodes.append(GraphNode(
            id=pv_id,
            kind=ResourceKind.PersistentVolume,
            name=pv.metadata.name,
            namespace="",
            labels=pv.metadata.labels or {},
            status=pv.status.phase or "Unknown",
        ))

    for pvc in pvcs:
        if pvc.spec.volume_name and pvc.spec.volume_name in pv_by_name:
            add_edge(pvc_by_name[pvc.metadata.name], pv_by_name[pvc.spec.volume_name], "bound-to")

    # Pods -> ConfigMap / Secret / PVC
    for pod in pods:
        pod_id = _node_id("Pod", namespace, pod.metadata.name)
        for cm_name in _pod_configmap_refs(pod):
            if cm_name in configmap_by_name:
                add_edge(pod_id, configmap_by_name[cm_name], "uses-config")
        for sec_name in _pod_secret_refs(pod):
            if sec_name in secret_by_name:
                add_edge(pod_id, secret_by_name[sec_name], "uses-secret")
        for pvc_name in _pod_pvc_refs(pod):
            if pvc_name in pvc_by_name:
                add_edge(pod_id, pvc_by_name[pvc_name], "mounts")

    # Ingresses -> Services + Ingresses -> Secret (TLS)
    for ing in ingresses:
        ing_id = _node_id("Ingress", namespace, ing.metadata.name)
        ing_rules: list[IngressRule] = []

        if ing.spec.default_backend and ing.spec.default_backend.service:
            db_svc = ing.spec.default_backend.service
            port_val = _ingress_port(db_svc.port)
            ing_rules.append(IngressRule(
                path="/ (default backend)",
                service_name=db_svc.name,
                service_port=port_val,
            ))
            if db_svc.name in service_by_name:
                add_edge(ing_id, service_by_name[db_svc.name], "routes-to")

        for rule in (ing.spec.rules or []):
            if not rule.http:
                continue
            for path in (rule.http.paths or []):
                if path.backend and path.backend.service:
                    svc = path.backend.service
                    port_val = _ingress_port(svc.port)
                    ing_rules.append(IngressRule(
                        host=rule.host,
                        path=path.path or "/",
                        service_name=svc.name,
                        service_port=port_val,
                    ))
                    if svc.name in service_by_name:
                        add_edge(ing_id, service_by_name[svc.name], "routes-to")

        nodes.append(GraphNode(
            id=ing_id,
            kind=ResourceKind.Ingress,
            name=ing.metadata.name,
            namespace=namespace,
            labels=ing.metadata.labels or {},
            ingress_rules=ing_rules or None,
        ))

        for tls in (ing.spec.tls or []):
            if tls.secret_name and tls.secret_name in secret_by_name:
                add_edge(ing_id, secret_by_name[tls.secret_name], "uses-tls")

    return GraphResponse(
        namespace=namespace,
        nodes=nodes,
        edges=edges,
        generated_at=datetime.now(tz=timezone.utc),
    )
