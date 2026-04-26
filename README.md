# TrueLens Forensic Suite

<div align="center">
  <h3>Professional-Grade Deepfake & Generative Image Detection</h3>
  <p>A high-performance forensic hybrid engine combining Neural Network classification (SigLIP2) with Classical Digital Forensics.</p>
</div>

---

## 🔬 System Overview

TrueLens is a multi-modal forensic architecture designed to authenticate visual media. It integrates state-of-the-art vision transformers with pixel-level mathematical forensics (DCT, ELA, FFT, Noise Analysis) to detect generative manipulation, structural alterations, and deepfakes with extremely high accuracy.

Built as an academic forensic project, TrueLens accurately models the subtle but consistent differences between authentic optical camera data (hardware artifacts) and synthetic generations (algorithmic artifacts).

---

## 🛠 Architecture & Pipeline

```text
User Input (Image/Media)
    │
    ▼
[ Preprocessing Module ] ───────► Format Sanitization & EXIF Normalization
    │
    ▼
[ Saliency & Crop Extraction ] ─► DNN Face-Aware Cropping (55% weight)
    │                             Center Crop (30% weight)
    │                             Global Context (15% weight)
    ▼
[ Classical Forensics ]
    ├── DCT Block Boundary Detection (JPEG Compression Traces)
    ├── Error Level Analysis (ELA) (Re-compression Detection)
    ├── FFT Frequency Spectrum (GAN Artifact Detection)
    ├── Spatial Noise Uniformity (Optical vs Algorithmic Noise)
    └── Edge Sharpness Analysis (Roll-off Variation Modeling)
    │
    ▼
[ Neural Inference Engine ] ────► Multi-Crop SigLIP2 Classification
    │
    ▼
[ Forensic Consensus Gate ] ────► DCT-Biased Neural Calibration
    │                             Cross-Signal Variance Testing
    ▼
[ Verification Output ] ────────► AUTHENTIC / SYNTHETIC / AMBIGUOUS
```

---

## ✨ Key Capabilities

1. **Dual-Mode Operation:** 
   - **Local Forensic Engine:** Runs 100% on-device using a quantized SigLIP2 model and our classical forensic ensemble. High accuracy, total privacy, zero API dependencies.
   - **Cloud API Fallback:** Seamless optional fallback to external APIs for edge cases.
2. **Advanced Neural Fusion:** Does not blindly trust AI models. Calibrates neural outputs using hard mathematical laws (like JPEG grid properties) to drastically reduce false positives on professional stock photography.
3. **Rigorous Evaluator:** Built-in evaluation pipeline delivering granular metrics (Precision, Recall, F1-Score, Specificity) over local datasets.
4. **Interactive Workbench:** Modern, highly responsive web-based analysis interface.

---

## 🚀 Quick Start Guide

### 1. Installation Requirements

Ensure you have Python 3.9+ installed. Install the dependencies via pip:

```bash
pip install -r requirements.txt
```

### 2. Launch the Application

Run the backend telemetry server. Note: Initializing the neural engine and loading the weights into VRAM/RAM will take ~10 seconds upon first boot.

```bash
python app.py
```

The TrueLens dashboard will be accessible via your browser at `http://localhost:5006`.

### 3. Running an Evaluation

To validate the engine against a dataset and review precision/accuracy metrics:

```bash
# Evaluate using the Local Forensic Engine
python evaluate.py --fake-dir "v1 fake" --real-dir "v1 real"
```

---

## 📂 Project Structure

```text
TrueLens/
│
├── app.py                      # Flask Server API & Routing Gateway
├── evaluate.py                 # Forensic Benchmark & Analytics Script
├── requirements.txt            # Python Dependencies
│
├── src/                        # Core Application Code
│   ├── __init__.py
│   └── engine/
│       ├── __init__.py
│       ├── core_engine.py      # Core Fusion Engine & Consensus Logic
│       └── audit_fixes.py      # Mathematical Array & Image Forensics
│
├── templates/                  # Server-Rendered HTML Templates
│   └── index.html              # Frontend Dashboard
│
├── static/                     # Web Assets 
│   ├── css/style.css
│   └── js/app.js               # Frontend Controller
│
└── data/                       # Local SQLite Telemetry Database
```

---

## 📊 Technical Analysis Matrix

| Forensic Sub-System | Target Analytical Feature | Weight Contribution |
|---------------------|---------------------------|---------------------|
| **SigLIP2 Backbone** | Holistic structural and semantic anomalies | 70% |
| **DCT Gating** | Mathematical compression differences (JPEG vs PNG block patterns) | 22% |
| **Error Level (ELA)** | Image alteration and secondary save artifacts | 8% |
| **Noise Matrix** | Uniformity vs. ISO/Photon variation patterns | Soft Calibration |
| **Edge Variation** | Perfect synthetic lines vs. lens refraction | Soft Calibration |
| **FFT Mapping** | Frequency-domain periodicity | Visual Reporting |

---

## 🛡️ Privacy & Security

TrueLens operates strictly with `in-memory` analysis. Any media processed is automatically, safely discarded immediately following vector analysis. Absolute zero-caching policies are heavily enforced to maintain professional-grade operational security and subject privacy. 

---

*Authored by the TrueLens Lead Technical Development Team for Academic Research & Demonstration.*
