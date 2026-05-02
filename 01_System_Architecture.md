
# System Architecture
```mermaid
graph TD
    A[Flutter App] -->|Live Detection| API[API Gateway]
    B[Dash Cam] --> API
    C[Web Dashboard] --> API
    API -->|Auth| AUTH[Auth Service]
    API -->|Detection| DETECT[Detection API]
    API -->|Sign Catalog| SIGN[Sign Catalog Service]
    API --> MAP[Map Service]
    API --> REPORT[Report Service]
    API --> ANALYTICS[Analytics Service]
    API --> USER[User Service]
    API --> NOTIFY[Notification Service]
    DETECT --> AI_ENGINE[AI Engine (YOLOv8m, EfficientNet-B3, DeepLabV3+, PaddleOCR, Triton)]
    AI_ENGINE --> DEVICE[On-Device AI (TFLite, ONNX, CoreML)]
    MAP --> DATA[Data Layer (PostgreSQL+PostGIS, Redis, Blob Storage, SQLite)]
    NOTIFY --> MONITOR[Monitoring (Prometheus, Grafana, ELK, Sentry)]
    API -.->|Rate Limiting| LOADBAL[Load Balancer]
    API -->|AKS| CLOUD[AKS]
```
