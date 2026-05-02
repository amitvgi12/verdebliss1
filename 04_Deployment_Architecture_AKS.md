
# Deployment Architecture - AKS
```mermaid
graph TD
    DEV[Developer Workstation] --> CI[CI/CD (GitHub Actions)]
    CI --> DOCKER[Docker Build]
    DOCKER --> TESTS[Tests]
    TESTS --> ACR[Azure Container Registry]
    ACR --> AKS[AKS - Kubernetes]
    AKS --> FASTAPI[FastAPI x3]
    AKS --> TRITON[Triton x2 GPU]
    AKS --> REDIS[Redis]
    AKS --> CELERY[Celery Workers]
    AKS --> MONITOR[Monitoring: Prometheus, Grafana, Fluentd]
    AKS --> POSTGRESQL[Azure PostgreSQL Flex]
    AKS --> BLOB[Azure Blob Storage]
    AKS --> KEYVAULT[Azure Key Vault]
    AKS --> MONITOR2[Azure Monitor]
    AKS --> MAPS[Google Maps]
    AKS --> FCM[FCM]
    AKS --> STORE[App Store]
```
