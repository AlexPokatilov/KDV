from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ResourceKind(str, Enum):
    Pod = "Pod"
    Deployment = "Deployment"
    StatefulSet = "StatefulSet"
    Service = "Service"
    Ingress = "Ingress"
    ConfigMap = "ConfigMap"
    Secret = "Secret"


class GraphNode(BaseModel):
    id: str
    kind: ResourceKind
    name: str
    namespace: str
    labels: dict[str, str] = {}
    status: Optional[str] = None
    replicas: Optional[int] = None
    selector: Optional[dict[str, str]] = None


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
