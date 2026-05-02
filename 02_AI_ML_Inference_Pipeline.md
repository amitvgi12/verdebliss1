
# AI/ML Inference Pipeline
```mermaid
graph TD
    CAM[Camera 1920x1080] --> PRE[Preprocessing]
    PRE --> DET[Stage 1 Detection (YOLOv8m)]
    DET --> ROI[Crop ROIs]
    ROI --> CLS[Stage 2 Classification (EfficientNet-B3)]
    DET --> SEG[Stage 3 Segmentation (DeepLabV3+ MobileNetV2)]
    DET --> OCR[Stage 4 OCR (PaddleOCR Hindi+English)]
    CLS --> OUT[Combined Results]
    SEG --> OUT
    OCR --> OUT
    OUT --> ALERT[Audio Alert]
    OUT --> GEOTAG[Geo-Tag]
    OUT --> DB[Save to DB]
```
