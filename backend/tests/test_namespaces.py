from fastapi import HTTPException


def test_list_namespaces(client, mock_k8s):
    mock_k8s.list_namespaces.return_value = ["default", "kube-system"]
    resp = client.get("/api/namespaces")
    assert resp.status_code == 200
    assert resp.json()["namespaces"] == ["default", "kube-system"]


def test_list_namespaces_empty(client, mock_k8s):
    mock_k8s.list_namespaces.return_value = []
    resp = client.get("/api/namespaces")
    assert resp.status_code == 200
    assert resp.json()["namespaces"] == []


def test_list_namespaces_k8s_error(client, mock_k8s):
    mock_k8s.list_namespaces.side_effect = HTTPException(
        status_code=502, detail="K8s unavailable"
    )
    resp = client.get("/api/namespaces")
    assert resp.status_code == 502


def test_list_namespaces_forbidden(client, mock_k8s):
    mock_k8s.list_namespaces.side_effect = HTTPException(
        status_code=403, detail="Kubernetes access denied — check RBAC permissions"
    )
    resp = client.get("/api/namespaces")
    assert resp.status_code == 403
