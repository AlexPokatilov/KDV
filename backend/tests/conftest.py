import pytest
from unittest.mock import MagicMock, patch
from starlette.testclient import TestClient

from app.main import app


@pytest.fixture
def mock_k8s():
    return MagicMock()


@pytest.fixture
def client(mock_k8s):
    with patch("app.main.KubernetesClient", return_value=mock_k8s):
        with TestClient(app) as c:
            yield c
