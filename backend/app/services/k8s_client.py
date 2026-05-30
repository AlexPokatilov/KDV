import logging

from fastapi import HTTPException
from kubernetes import client, config
from kubernetes.client.exceptions import ApiException
from kubernetes.config.config_exception import ConfigException

from app.config import Settings

logger = logging.getLogger(__name__)


def _raise_for_k8s_error(exc: ApiException, namespace: str | None = None) -> None:
    if exc.status == 404:
        detail = (
            f"Namespace '{namespace}' not found" if namespace else "Resource not found"
        )
        raise HTTPException(status_code=404, detail=detail)
    if exc.status == 403:
        raise HTTPException(
            status_code=403, detail="Kubernetes access denied — check RBAC permissions"
        )
    raise HTTPException(status_code=502, detail=f"Kubernetes API error: {exc.reason}")


class KubernetesClient:
    def __init__(self, settings: Settings, _timeout: int = 30):
        self._timeout = _timeout
        if settings.in_cluster:
            config.load_incluster_config()
            logger.info("Loaded in-cluster Kubernetes config")
        else:
            try:
                config.load_kube_config(config_file=settings.kubeconfig_path)
                logger.info(
                    "Loaded kubeconfig from %s",
                    settings.kubeconfig_path or "~/.kube/config",
                )
            except ConfigException:
                config.load_incluster_config()
                logger.info("Fell back to in-cluster Kubernetes config")

        self._core = client.CoreV1Api()
        self._apps = client.AppsV1Api()
        self._networking = client.NetworkingV1Api()
        self._batch = client.BatchV1Api()

    def ping(self) -> None:
        try:
            self._core.list_namespace(_request_timeout=3)
        except ApiException as exc:
            _raise_for_k8s_error(exc)

    def list_namespaces(self) -> list[str]:
        try:
            resp = self._core.list_namespace(_request_timeout=self._timeout)
            return [ns.metadata.name for ns in resp.items]
        except ApiException as exc:
            _raise_for_k8s_error(exc)

    def list_pods(self, namespace: str):
        try:
            return self._core.list_namespaced_pod(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_deployments(self, namespace: str):
        try:
            return self._apps.list_namespaced_deployment(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_services(self, namespace: str):
        try:
            return self._core.list_namespaced_service(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_ingresses(self, namespace: str):
        try:
            return self._networking.list_namespaced_ingress(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_statefulsets(self, namespace: str):
        try:
            return self._apps.list_namespaced_stateful_set(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_daemonsets(self, namespace: str):
        try:
            return self._apps.list_namespaced_daemon_set(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_configmaps(self, namespace: str):
        try:
            return self._core.list_namespaced_config_map(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_secrets(self, namespace: str):
        try:
            return self._core.list_namespaced_secret(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_jobs(self, namespace: str):
        try:
            return self._batch.list_namespaced_job(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_cronjobs(self, namespace: str):
        try:
            return self._batch.list_namespaced_cron_job(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_pvcs(self, namespace: str):
        try:
            return self._core.list_namespaced_persistent_volume_claim(
                namespace=namespace, _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc, namespace)

    def list_pvs(self):
        try:
            return self._core.list_persistent_volume(
                _request_timeout=self._timeout
            ).items
        except ApiException as exc:
            _raise_for_k8s_error(exc)
