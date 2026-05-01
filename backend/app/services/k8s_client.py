import logging
from typing import Optional

from kubernetes import client, config
from kubernetes.config.config_exception import ConfigException

from app.config import Settings

logger = logging.getLogger(__name__)


class KubernetesClient:
    def __init__(self, settings: Settings):
        if settings.in_cluster:
            config.load_incluster_config()
            logger.info("Loaded in-cluster Kubernetes config")
        else:
            try:
                config.load_incluster_config()
                logger.info("Loaded in-cluster Kubernetes config")
            except ConfigException:
                config.load_kube_config(config_file=settings.kubeconfig_path)
                logger.info("Loaded kubeconfig from %s", settings.kubeconfig_path or "~/.kube/config")

        self._core = client.CoreV1Api()
        self._apps = client.AppsV1Api()
        self._networking = client.NetworkingV1Api()
        self._batch = client.BatchV1Api()

    def list_namespaces(self) -> list[str]:
        resp = self._core.list_namespace()
        return [ns.metadata.name for ns in resp.items]

    def list_pods(self, namespace: str):
        return self._core.list_namespaced_pod(namespace=namespace).items

    def list_deployments(self, namespace: str):
        return self._apps.list_namespaced_deployment(namespace=namespace).items

    def list_services(self, namespace: str):
        return self._core.list_namespaced_service(namespace=namespace).items

    def list_ingresses(self, namespace: str):
        return self._networking.list_namespaced_ingress(namespace=namespace).items

    def list_statefulsets(self, namespace: str):
        return self._apps.list_namespaced_stateful_set(namespace=namespace).items

    def list_daemonsets(self, namespace: str):
        return self._apps.list_namespaced_daemon_set(namespace=namespace).items

    def list_configmaps(self, namespace: str):
        return self._core.list_namespaced_config_map(namespace=namespace).items

    def list_secrets(self, namespace: str):
        return self._core.list_namespaced_secret(namespace=namespace).items

    def list_jobs(self, namespace: str):
        return self._batch.list_namespaced_job(namespace=namespace).items

    def list_cronjobs(self, namespace: str):
        return self._batch.list_namespaced_cron_job(namespace=namespace).items

    def list_pvcs(self, namespace: str):
        return self._core.list_namespaced_persistent_volume_claim(namespace=namespace).items

    def list_pvs(self):
        return self._core.list_persistent_volume().items
