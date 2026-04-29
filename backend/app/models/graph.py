from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ResourceKind(str, Enum):
    Pod = "Pod"
    Deployment = "Deployment"
    StatefulSet = "StatefulSet"
    DaemonSet = "DaemonSet"
    Service = "Service"
    Ingress = "Ingress"
    ConfigMap = "ConfigMap"
    Secret = "Secret"


class ServicePort(BaseModel):
    name: Optional[str] = None
    port: int
    target_port: Optional[str] = None
    protocol: str = "TCP"


class IngressRule(BaseModel):
    host: Optional[str] = None
    path: str
    service_name: str
    service_port: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    kind: ResourceKind
    name: str
    namespace: str
    labels: dict[str, str] = {}
    status: Optional[str] = None
    replicas: Optional[int] = None
    selector: Optional[dict[str, str]] = None
    ports: Optional[list[ServicePort]] = None
    ingress_rules: Optional[list[IngressRule]] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: str


class GraphResponse(BaseModel):
    namespace: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    generated_at: datetime
