from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.graph import GraphResponse


def _empty_response(namespace: str = "default") -> GraphResponse:
    return GraphResponse(
        namespace=namespace,
        nodes=[],
        edges=[],
        generated_at=datetime.now(tz=timezone.utc),
    )


def test_graph_invalid_namespace(client, mock_k8s):
    resp = client.get("/api/graph?namespace=INVALID_NS!")
    assert resp.status_code == 422


def test_graph_invalid_namespace_uppercase(client, mock_k8s):
    resp = client.get("/api/graph?namespace=MyNamespace")
    assert resp.status_code == 422


def test_graph_empty_namespace(client, mock_k8s):
    # empty string fails the DNS-1123 regex
    resp = client.get("/api/graph?namespace=")
    assert resp.status_code == 422


def test_graph_returns_structure(client, mock_k8s):
    mock_k8s.list_pods.return_value = []
    mock_k8s.list_deployments.return_value = []
    mock_k8s.list_statefulsets.return_value = []
    mock_k8s.list_daemonsets.return_value = []
    mock_k8s.list_jobs.return_value = []
    mock_k8s.list_cronjobs.return_value = []
    mock_k8s.list_services.return_value = []
    mock_k8s.list_ingresses.return_value = []
    mock_k8s.list_configmaps.return_value = []
    mock_k8s.list_secrets.return_value = []
    mock_k8s.list_pvcs.return_value = []
    mock_k8s.list_pvs.return_value = []

    resp = client.get("/api/graph?namespace=default")
    assert resp.status_code == 200
    data = resp.json()
    assert data["namespace"] == "default"
    assert data["nodes"] == []
    assert data["edges"] == []
    assert "generated_at" in data


def test_graph_namespace_not_found(client, mock_k8s):
    mock_k8s.list_pods.side_effect = HTTPException(
        status_code=404, detail="Namespace 'missing' not found"
    )
    resp = client.get("/api/graph?namespace=missing")
    assert resp.status_code == 404


def test_graph_k8s_error_propagates(client, mock_k8s):
    mock_k8s.list_pods.side_effect = HTTPException(
        status_code=502, detail="K8s unavailable"
    )
    resp = client.get("/api/graph?namespace=default")
    assert resp.status_code == 502
