"""
=============================================================================
 TrueLens Forensic Gateway -- Production v6
=============================================================================
 Endpoints:
   GET  /         → Analytics Workbench
   POST /predict  → Multi-modal Inference Pipeline
=============================================================================
"""
import os
import uuid
import time
import logging
import threading
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from src.engine.core_engine import ForensicScanner

# --- Configuration Management ---
CONFIG = {
    "UPLOAD_FOLDER":      os.path.join("static", "uploads"),
    "MAX_FILE_SIZE":      20 * 1024 * 1024,   # 20 MB
    "INFERENCE_TIMEOUT":  30,                  # Optimized for API response
    "LOG_FILE":           "deepfake_server.log",
    "ALLOWED_EXTENSIONS": {'png', 'jpg', 'jpeg', 'webp', 'heic'}
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in CONFIG["ALLOWED_EXTENSIONS"]

os.makedirs(CONFIG["UPLOAD_FOLDER"], exist_ok=True)

print("Initializing Forensic Engine and loading SigLIP2. This may take ~15-30 seconds...")
scanner = ForensicScanner(mode="CPU")
print("Engine Initialized. ACTIVE MODE: LOCAL_FORENSIC_MODEL")

# --- Logging Infrastructure ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(CONFIG["LOG_FILE"]),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ForensicGateway")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = CONFIG["MAX_FILE_SIZE"]

# --- Hardened Security Layer ---
@app.after_request
def apply_security_headers(response):
    """Injects rigorous privacy and security headers at the edge."""
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:; connect-src 'self';"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Absolute zero-caching for inference results to maintain privacy
    if request.path == '/predict':
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
    return response

EXPLANATIONS = {
    "Fake":      "Advanced biometric inconsistency detected. Media exhibits signatures of generative synthetic manipulation.",
    "Real":      "Integrity verified. Forensic analysis suggests the source material is authentic and unprocessed.",
    "Uncertain": "Ambiguous signals detected. High-confidence verification not possible with current sample data."
}

# --- Core Business Logic ---

def _run_inference(path: str, container: dict) -> None:
    """Wrapped inference unit for threaded execution and safety."""
    try:
        container["data"] = scanner.predict_image(path)
    except Exception as e:
        container["error"] = str(e)
        logger.exception(f"Inference failure: {e}")
    finally:
        # Belt-and-suspenders: cleanup original upload immediately
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.error(f"Cleanup failed for {path}: {e}")

@app.route("/")
def home():
    """Serves the primary forensics workbench UI."""
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    """
    Main ingestion endpoint for media analysis.
    Supports JPG, PNG, WEBP.
    """
    # Accept 'file' (Elite UI) or 'image' (Legacy/Mobile)
    file = request.files.get("file") or request.files.get("image")
    if not file:
        return jsonify({"error": "No media payload identified."}), 400
    if not file or file.filename == "":
        return jsonify({"error": "Null payload provided."}), 400

    # Privacy & Security Check: Validate Extension
    if not allowed_file(file.filename):
        logger.warning(f"Security Alert: Unapproved file type rejected -> {file.filename}")
        return jsonify({"error": "Illegal file format. Security policy violation."}), 415

    # Sanitize and generate persistence path
    safe_name = secure_filename(file.filename) or "payload.bin"
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    save_path = os.path.join(CONFIG["UPLOAD_FOLDER"], unique_name)
    file.save(save_path)

    # Isolated Threaded Execution with Watchdog
    container = {}
    t = threading.Thread(target=_run_inference, args=(save_path, container), daemon=True)
    t0 = time.time()
    t.start()
    t.join(timeout=CONFIG["INFERENCE_TIMEOUT"])
    latency = round(time.time() - t0, 3)

    if t.is_alive():
        logger.error(f"Inference Watchdog: Timeout reached for {unique_name}")
        return jsonify({"error": "Compute timeout. Sample may be too complex for rapid analysis."}), 504

    if "error" in container:
        return jsonify({"error": f"Internal Core Processing Error: {container['error']}"}), 500

    if "data" not in container:
        return jsonify({"error": "Inference engine returned no valid telemetry."}), 500

    # Destructuring and response construction
    label, confidence, status, margin, detail = container["data"]
    explanation = EXPLANATIONS.get(label, EXPLANATIONS["Uncertain"])

    logger.info(f"Verdict: {label} | Conf: {confidence:.4f} | Latency: {latency}s")

    return jsonify({
        "label":       label,
        "confidence":  round(confidence, 4),
        "status":      status,
        "margin":      round(margin, 4),
        "explanation": explanation,
        "latency":     latency,
        "detail":      detail
    }), 200

# --- Exception Handling Matrix ---

@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({"error": "Media exceeds maximum ingest limit (20MB)."}), 413

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "System fault detected. Forensic gateway offline."}), 500

if __name__ == "__main__":
    # Enable debug=True for Lumina Elite development and template reloading
    # Switch to 5005 to avoid common port 5000 conflicts; bind to 0.0.0.0
    app.run(host="0.0.0.0", port=5006, debug=True, use_reloader=False)
