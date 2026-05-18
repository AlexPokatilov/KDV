from fastapi import HTTPException


def test_health_ok(client, mock_k8s):
    mock_k8s.ping.return_value = None
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_health_degraded_on_k8s_error(client, mock_k8s):
    mock_k8s.ping.side_effect = HTTPException(status_code=502, detail="K8s unavailable")
    resp = client.get("/api/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"
    assert "K8s unavailable" in resp.json()["reason"]


def test_health_degraded_on_generic_error(client, mock_k8s):
    mock_k8s.ping.side_effect = Exception("connection refused")
    resp = client.get("/api/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"
