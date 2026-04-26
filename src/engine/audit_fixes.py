import numpy as np
import cv2
import torch
import os
from PIL import Image, ImageFilter, ImageStat
from typing import Tuple, Optional


class ForensicAuditorFixes:
    """
    Consolidated forensic processing library.
    v3: Improved face detection, better ELA, enhanced frequency analysis,
         noise consistency checks, and chromatic aberration detection.
    """

    # ==========================================
    # SECTION 1: Input Sanitization
    # ==========================================
    @staticmethod
    def sanitize_image(image: Image.Image) -> Image.Image:
        """
        Handles CMYK, RGBA, Grayscale, and P-mode images securely.
        Prevents black-alpha artifacts on RGBA composites.
        """
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background
        elif image.mode == 'P':
            image = image.convert('RGBA')
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        w, h = image.size
        if w < 64 or h < 64:
            raise ValueError(f"IMAGE_TOO_SMALL: {w}x{h} — minimum 64px for forensic analysis.")
        if w > 8000 or h > 8000:
            image.thumbnail((8000, 8000), Image.Resampling.LANCZOS)

        return image

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        if not filename:
            return "scrubbed_asset.unknown"
        clean = "".join([c for c in filename if c.isalnum() or c in (' ', '.', '_', '-')]).rstrip()
        return clean if clean else "safe_asset_rename.unknown"

    # ==========================================
    # SECTION 2: Face-Aware Region Extraction
    # ==========================================
    @staticmethod
    def extract_face_region(image: Image.Image) -> Tuple[Image.Image, bool]:
        """
        Detects faces using OpenCV DNN face detector (much better than Haar).
        Falls back to Haar if DNN model not available.
        Returns (cropped_face_or_full_image, face_found).
        """
        arr = np.array(image.convert("RGB"))
        h, w = arr.shape[:2]

        # Try DNN face detector first (much more accurate)
        face_box = ForensicAuditorFixes._detect_face_dnn(arr)

        if face_box is None:
            # Fallback to Haar cascade
            face_box = ForensicAuditorFixes._detect_face_haar(arr)

        if face_box is None:
            return image, False

        x, y, fw, fh = face_box

        # Add 40% padding around face for context
        pad_x = int(fw * 0.40)
        pad_y = int(fh * 0.40)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w, x + fw + pad_x)
        y2 = min(h, y + fh + pad_y)

        face_crop = arr[y1:y2, x1:x2]
        return Image.fromarray(face_crop), True

    @staticmethod
    def _detect_face_dnn(arr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Use OpenCV DNN face detector if available."""
        try:
            h, w = arr.shape[:2]
            # Use OpenCV's built-in DNN detector if available
            prototxt = os.path.join(cv2.data.haarcascades, "..", "dnn", "face_detector", "deploy.prototxt")
            caffemodel = os.path.join(cv2.data.haarcascades, "..", "dnn", "face_detector", "res10_300x300_ssd_iter_140000.caffemodel")

            if not os.path.exists(prototxt) or not os.path.exists(caffemodel):
                return None

            net = cv2.dnn.readNetFromCaffe(prototxt, caffemodel)
            blob = cv2.dnn.blobFromImage(cv2.cvtColor(arr, cv2.COLOR_RGB2BGR), 1.0, (300, 300), [104.0, 177.0, 123.0])
            net.setInput(blob)
            detections = net.forward()

            best_conf = 0.0
            best_box = None
            for i in range(detections.shape[2]):
                confidence = detections[0, 0, i, 2]
                if confidence > 0.5 and confidence > best_conf:
                    best_conf = confidence
                    box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                    x1, y1, x2, y2 = box.astype(int)
                    best_box = (x1, y1, x2 - x1, y2 - y1)

            return best_box
        except Exception:
            return None

    @staticmethod
    def _detect_face_haar(arr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Legacy Haar cascade fallback."""
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(48, 48),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        if len(faces) == 0:
            return None

        return max(faces, key=lambda f: f[2] * f[3])

    # ==========================================
    # SECTION 3: Neural Stability
    # ==========================================
    @staticmethod
    def stable_softmax(logits: torch.Tensor, temperature: float = 1.0) -> torch.Tensor:
        logits_f32 = logits.to(torch.float32) / temperature
        return torch.nn.functional.softmax(logits_f32, dim=-1)

    # ==========================================
    # SECTION 4: Multi-Pass ELA (Calibrated v3)
    # ==========================================
    @staticmethod
    def compute_robust_ela(image: Image.Image, quality: int = 90) -> Tuple[Image.Image, float]:
        """
        Improved ELA with better calibration and PNG-aware processing.
        """
        rgb_arr = np.array(image)[:, :, ::-1].copy()

        diff_maps = []
        pass_means = []

        for q in (75, 90, 95):
            _, encimg = cv2.imencode(".jpg", rgb_arr, [int(cv2.IMWRITE_JPEG_QUALITY), q])
            decimg = cv2.imdecode(encimg, 1)
            diff = np.abs(rgb_arr.astype(np.float32) - decimg.astype(np.float32))
            pass_means.append(float(np.mean(diff)))
            diff_maps.append(diff)

        # Cross-pass variance — AI images tend to have more uniform error
        pass_variance = float(np.std(pass_means))
        variance_score = max(0.0, min(1.0, 1.0 - (pass_variance / 4.0)))

        # Magnitude at q=90 — recalibrated so typical images land mid-range
        mean_ela = pass_means[1]
        # Typical mean_ela: real JPEG ~3-8, AI PNG ~1-3, heavily edited ~10+
        magnitude_score = max(0.0, min(1.0, 1.0 - ((mean_ela - 0.5) / 6.0)))

        # Blend
        ela_score = 0.4 * variance_score + 0.6 * magnitude_score
        ela_score = max(0.0, min(1.0, ela_score))

        # Visualization
        best_map = diff_maps[0][:, :, ::-1]
        max_val = float(np.max(best_map))
        if max_val > 0:
            best_map = best_map / max_val * 255.0

        ela_image = Image.fromarray(best_map.astype(np.uint8))
        return ela_image, float(ela_score)

    # ==========================================
    # SECTION 5: Hanning-Windowed FFT (Enhanced)
    # ==========================================
    @staticmethod
    def compute_robust_fft(image: Image.Image) -> Tuple[Image.Image, float, np.ndarray]:
        """
        Frequency domain analysis with GAN artifact detection.
        """
        gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY).astype(np.float32)
        h, w = gray.shape

        # Hanning Window
        win_y = np.hanning(h)
        win_x = np.hanning(w)
        hanning_2d = np.outer(win_y, win_x)
        windowed = gray * hanning_2d

        fshift = np.fft.fftshift(np.fft.fft2(windowed))
        magnitude = 20 * np.log(np.abs(fshift) + 1e-8)

        # High-frequency ring energy
        cy, cx = h // 2, w // 2
        r_inner = min(h, w) // 8
        r_outer = min(h, w) // 3
        y_idx, x_idx = np.ogrid[:h, :w]
        dist_sq = (x_idx - cx) ** 2 + (y_idx - cy) ** 2
        hf_mask = (dist_sq > r_inner ** 2) & (dist_sq <= r_outer ** 2)
        hf_energy = np.mean(magnitude[hf_mask])
        ring_score = min(max(hf_energy / 160.0, 0.0), 1.0)

        # Periodic peak detection
        flat = magnitude[hf_mask].flatten()
        if len(flat) > 0 and np.std(flat) > 0:
            spike_threshold = np.mean(flat) + 2.5 * np.std(flat)
            spike_fraction = np.sum(flat > spike_threshold) / (len(flat) + 1e-8)
            peak_score = min(spike_fraction * 15.0, 1.0)
        else:
            peak_score = 0.0

        fft_score = 0.35 * ring_score + 0.65 * peak_score
        fft_score = max(0.0, min(1.0, fft_score))

        # Visualization
        mag_norm = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        fft_colored = cv2.applyColorMap(mag_norm, cv2.COLORMAP_INFERNO)
        fft_image = Image.fromarray(cv2.cvtColor(fft_colored, cv2.COLOR_BGR2RGB))

        return fft_image, float(fft_score), magnitude

    # ==========================================
    # SECTION 6: DCT Block Boundary Analysis
    # ==========================================
    @staticmethod
    def compute_dct_block_score(image: Image.Image) -> float:
        """
        Detects JPEG DCT block boundary artifacts.
        """
        gray = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY)
        gray_f = gray.astype(np.float32)

        # Use Laplacian for sharper edge detection
        grad = cv2.Laplacian(gray_f, cv2.CV_32F)
        gradient_mag = np.abs(grad)

        h, w = gray.shape

        # Sample at 8x8 boundaries
        boundary_rows = [r for r in range(0, h, 8) if 0 < r < h]
        boundary_cols = [c for c in range(0, w, 8) if 0 < c < w]

        boundary_grad = []
        for r in boundary_rows:
            boundary_grad.append(np.mean(gradient_mag[r, :]))
        for c in boundary_cols:
            boundary_grad.append(np.mean(gradient_mag[:, c]))

        # Sample in block interiors
        interior_rows = [r + 4 for r in range(0, h - 4, 8)]
        interior_cols = [c + 4 for c in range(0, w - 4, 8)]

        interior_grad = []
        for r in interior_rows:
            if r < h:
                interior_grad.append(np.mean(gradient_mag[r, :]))
        for c in interior_cols:
            if c < w:
                interior_grad.append(np.mean(gradient_mag[:, c]))

        if not boundary_grad or not interior_grad:
            return 0.5

        boundary_mean = np.mean(boundary_grad)
        interior_mean = np.mean(interior_grad)

        ratio = boundary_mean / (interior_mean + 1e-8)
        score = min(max((ratio - 0.8) / 2.0, 0.0), 1.0)
        return float(score)

    # ==========================================
    # SECTION 7: Noise Consistency Analysis (NEW)
    # ==========================================
    @staticmethod
    def compute_noise_consistency(image: Image.Image) -> float:
        """
        AI-generated images often have unnaturally uniform noise.
        Real camera photos have photon noise that varies with brightness.
        Returns score where high = likely synthetic.
        """
        gray = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY).astype(np.float32)
        h, w = gray.shape

        # Downsample large images to avoid texture dominating
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            gray = cv2.resize(gray, (int(w * scale), int(h * scale)))

        # Denoise to isolate noise
        denoised = cv2.medianBlur(gray.astype(np.uint8), 5).astype(np.float32)
        noise = np.abs(gray - denoised)

        # Divide into 4x4 grid and measure noise std in each cell
        cells_h, cells_w = 4, 4
        cell_h, cell_w = gray.shape[0] // cells_h, gray.shape[1] // cells_w
        cell_stds = []
        for i in range(cells_h):
            for j in range(cells_w):
                y1, y2 = i * cell_h, (i + 1) * cell_h
                x1, x2 = j * cell_w, (j + 1) * cell_w
                cell = noise[y1:y2, x1:x2]
                if cell.size > 0:
                    cell_stds.append(np.std(cell))

        if len(cell_stds) < 4:
            return 0.5

        # Real photos: noise std varies across image (lighting, focus, ISO variation)
        # AI images: noise std is very uniform across image
        mean_std = np.mean(cell_stds) + 1e-8
        std_of_stds = np.std(cell_stds)
        uniformity = std_of_stds / mean_std  # CV of noise std across cells

        # Real: uniformity > 0.35 (noise varies spatially)
        # AI: uniformity < 0.15 (noise is unnaturally uniform)
        score = 1.0 - ((uniformity - 0.10) / 0.30)
        score = max(0.0, min(1.0, score))
        return float(score)

    # ==========================================
    # SECTION 8: Edge Sharpness Analysis (NEW)
    # ==========================================
    @staticmethod
    def compute_edge_sharpness(image: Image.Image) -> float:
        """
        AI images often have unnaturally perfect edge transitions.
        Real photos have softer, more variable edges due to lens optics.
        Returns score where high = likely synthetic.
        """
        gray = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY)

        # Sobel gradients
        sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        grad_mag = np.sqrt(sobelx**2 + sobely**2)

        # Find strong edges (top 10% gradient magnitude)
        threshold = np.percentile(grad_mag, 90)
        edge_mask = grad_mag > threshold

        if np.sum(edge_mask) < 100:
            return 0.5

        # Measure how sharp edges are: AI has very narrow transition (high local max)
        # Real photos have softer roll-off
        edge_values = grad_mag[edge_mask]
        
        # Coefficient of variation of edge gradients
        # Real: more variation in edge sharpness (CV ~0.5-1.0)
        # AI: very consistent edge sharpness (CV ~0.2-0.4)
        mean_grad = np.mean(edge_values) + 1e-8
        std_grad = np.std(edge_values)
        cv_grad = std_grad / mean_grad

        # Map: cv < 0.25 -> synthetic (score high), cv > 0.6 -> real (score low)
        score = 1.0 - ((cv_grad - 0.25) / 0.35)
        score = max(0.0, min(1.0, score))
        return float(score)
