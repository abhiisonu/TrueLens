import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import PipelineModal, { type PipelineData } from './PipelineModal';

export interface AnalysisResult {
  isReal: boolean;
  confidence: number;
  details: Record<string, number>;
}

interface AnalysisOverlayProps {
  imageUrl: string;
  imageFile: File;
  onClose: () => void;
}

type Phase = 'preview' | 'analyzing' | 'results';

const statusMessages = [
  'Preparing image…',
  'Analyzing neural fingerprints…',
  'Interrogating frequency domain…',
  'Detecting generative artifacts…',
  'Mapping error level analysis…',
  'Cross-referencing edge sharpness…',
  'Evaluating block artifacts…',
  'Finalizing consensus…',
];

export default function AnalysisOverlay({ imageUrl, imageFile, onClose }: AnalysisOverlayProps) {
  const [phase, setPhase] = useState<Phase>('preview');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [rawPipelineData, setRawPipelineData] = useState<PipelineData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAnalysis = useCallback(async () => {
    setPhase('analyzing');
    setProgress(0);
    setStatusIndex(0);

    const startTime = Date.now();
    const duration = 3800;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      setStatusIndex(
        Math.min(Math.floor((p / 100) * statusMessages.length), statusMessages.length - 1)
      );
    }, 30);

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const fetchPromise = fetch('/predict', { method: 'POST', body: formData })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });

      const timerPromise = new Promise(resolve => setTimeout(resolve, duration));

      const [data] = await Promise.all([fetchPromise, timerPromise]);

      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);

      const isReal = data.label === 'Real';
      const d = data.detail || {};
      const n = d.neural || {};
      const f = d.forensics || {};

      const mappedDetails: Record<string, number> = {};

      if (n['Deepfake Probability'] !== undefined) 
        mappedDetails['Deepfake Probability'] = Math.round(n['Deepfake Probability'] * 100);
        
      if (n['GenAI Probability'] !== undefined) 
        mappedDetails['GenAI Probability'] = Math.round(n['GenAI Probability'] * 100);
        
      if (n['FFT Frequency Score'] !== undefined) 
        mappedDetails['FFT Frequency (Realness)'] = Math.round(n['FFT Frequency Score'] * 100);
        
      if (n['uncertainty'] !== undefined) 
        mappedDetails['Uncertainty Level'] = Math.round(n['uncertainty'] * 100);

      // Add forensics if present
      if (f.ela_score !== undefined) 
        mappedDetails['Error Level Analysis (ELA)'] = Math.round(f.ela_score * 100);
        
      if (f.dct_score !== undefined) 
        mappedDetails['DCT Compression Artifacts'] = Math.round(f.dct_score * 100);
        
      if (f.noise_score !== undefined) 
        mappedDetails['Noise Uniformity'] = Math.round(f.noise_score * 100);
        
      if (f.edge_score !== undefined) 
        mappedDetails['Edge Sharpness'] = Math.round(f.edge_score * 100);

      // Fallbacks if nothing is provided
      if (Object.keys(mappedDetails).length === 0) {
        mappedDetails['Signal Probability'] = isReal ? 92 : 12;
      }

      const backendResult: AnalysisResult = {
        isReal,
        confidence: data.confidence ? Math.round(data.confidence * 1000) / 10 : (isReal ? 95 : 98),
        details: mappedDetails,
      };

      // Store raw data for pipeline modal
      setRawPipelineData({
        label: data.label,
        confidence: data.confidence || 0,
        latency: data.latency || '',
        detail: data.detail || { neural: {}, forensics: {} },
      });

      setResult(backendResult);
      setTimeout(() => setPhase('results'), 400);

    } catch (err: any) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setErrorMsg(err.message || 'An unexpected error occurred.');
      handleReset();
    }
  }, [imageFile]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('preview');
    setProgress(0);
    setResult(null);
    setStatusIndex(0);
  }, []);

  const handleCloseFull = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  }, [onClose]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Circular progress calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;
  const resultOffset = result
    ? circumference - (result.confidence / 100) * circumference
    : circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-lg"
        onClick={phase === 'preview' ? handleCloseFull : undefined}
      />

      {/* Close button */}
      <button
        onClick={handleCloseFull}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-300"
      >
        <X className="w-5 h-5 text-cream" />
      </button>

      {/* Error toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            key="error-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
            style={{ background: 'rgba(30,10,10,0.96)', border: '1px solid rgba(199,91,58,0.45)', backdropFilter: 'blur(12px)' }}
          >
            <AlertTriangle className="w-4 h-4 text-terracotta flex-shrink-0" />
            <span className="text-sm text-cream/80 font-medium">Analysis failed: {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-cream/40 hover:text-cream/80 transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {/* ===== PREVIEW PHASE ===== */}
        {phase === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -20 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl shadow-charcoal/10">
              {/* Image preview */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Uploaded image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent" />

                {/* Corner badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                  Ready for analysis
                </div>
              </div>

              <div className="p-7 sm:p-8">
                <h3 className="font-display text-2xl font-semibold text-warm-black mb-2">
                  Image uploaded
                </h3>
                <p className="text-text-muted text-sm mb-7 leading-relaxed">
                  Our AI will examine textures, lighting patterns, artifacts, noise distribution,
                  and more to determine if this image is authentic.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseFull}
                    className="flex-1 px-5 py-3.5 rounded-2xl border border-cream-darker text-warm-black text-sm font-medium hover:bg-cream-dark transition-colors duration-300"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={startAnalysis}
                    className="btn-shine flex-1 px-5 py-3.5 rounded-2xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal-light transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    Start Analysis
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== ANALYZING PHASE ===== */}
        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl shadow-charcoal/10">
              {/* Image with scan effect */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Analyzing"
                  className="w-full h-full object-cover"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-charcoal/30" />

                {/* Scan line */}
                <div className="scan-line" />

                {/* Circular progress overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <svg width="120" height="120" className="circular-progress">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="5"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="white"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        style={{ transition: 'stroke-dashoffset 0.08s linear' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-display text-2xl font-bold drop-shadow-lg">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-terracotta animate-pulse-soft" />
                  <span className="text-sm font-semibold text-warm-black tracking-wide">
                    Analyzing
                  </span>
                </div>
                <p className="text-text-muted text-sm">{statusMessages[statusIndex]}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== RESULTS PHASE ===== */}
        {phase === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl shadow-charcoal/10">
              {/* Result header */}
              <div
                className={`p-7 sm:p-8 text-center relative overflow-hidden ${
                  result.isReal ? 'bg-sage/[0.06]' : 'bg-terracotta/[0.06]'
                }`}
              >
                {/* Decorative background circle */}
                <div
                  className={`absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full blur-3xl opacity-30 ${
                    result.isReal ? 'bg-sage' : 'bg-terracotta'
                  }`}
                />

                {/* Image thumbnail */}
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-5 shadow-lg ring-4 ring-white/80">
                  <img
                    src={imageUrl}
                    alt="Analyzed"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Verdict icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, delay: 0.15 }}
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 ${
                    result.isReal ? 'bg-sage/15' : 'bg-terracotta/15'
                  }`}
                >
                  {result.isReal ? (
                    <CheckCircle2 className="w-7 h-7 text-sage-dark" strokeWidth={2} />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-terracotta-dark" strokeWidth={2} />
                  )}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="font-display text-3xl sm:text-4xl font-bold text-warm-black mb-2"
                >
                  {result.isReal ? 'Likely Authentic' : 'Likely AI Generated'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-text-muted text-sm max-w-sm mx-auto"
                >
                  {result.isReal
                    ? 'This image appears to be a genuine photograph with natural characteristics.'
                    : 'This image shows patterns and artifacts consistent with AI generation.'}
                </motion.p>

                {/* View Pipeline button */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  onClick={() => setPipelineOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: result.isReal ? 'rgba(123,158,107,0.12)' : 'rgba(199,91,58,0.12)',
                    border: result.isReal ? '1px solid rgba(123,158,107,0.35)' : '1px solid rgba(199,91,58,0.35)',
                    color: result.isReal ? '#5a8a48' : '#b84a29',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  View Detection Pipeline
                </motion.button>
              </div>

              {/* Confidence + details */}
              <div className="p-7 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                  {/* Confidence gauge */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <svg width="130" height="130" className="circular-progress">
                        <circle
                          cx="65"
                          cy="65"
                          r={radius}
                          fill="none"
                          stroke="#F0EAE0"
                          strokeWidth="7"
                        />
                        <motion.circle
                          cx="65"
                          cy="65"
                          r={radius}
                          fill="none"
                          stroke={result.isReal ? '#7B9E6B' : '#C75B3A'}
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset: resultOffset }}
                          transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          className="font-display text-3xl font-bold text-warm-black"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          {result.confidence}%
                        </motion.span>
                        <span className="text-[11px] text-text-muted font-medium tracking-wider uppercase">
                          Confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detail metrics */}
                  <div className="flex-1 w-full space-y-3.5">
                    {Object.entries(result.details).map(([key, value], i) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] text-warm-black font-medium">
                            {key}
                          </span>
                          <span className="text-[13px] text-text-muted tabular-nums">
                            {value}%
                          </span>
                        </div>
                        <div className="h-[5px] bg-cream-dark rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              result.isReal ? 'bg-sage' : 'bg-terracotta'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{
                              duration: 1.1,
                              delay: 0.6 + i * 0.08,
                              ease: 'easeOut',
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-[11px] text-warm-gray text-center mb-6 leading-relaxed"
                >
                  Results are probabilistic and should be used as a guide. No AI detector is
                  70+ % accurate. Always use human judgment for critical decisions.
                </motion.p>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-5 py-3.5 rounded-2xl border border-cream-darker text-warm-black text-sm font-medium hover:bg-cream-dark transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Analyze Another
                  </button>
                  <button
                    onClick={handleCloseFull}
                    className="btn-shine flex-1 px-5 py-3.5 rounded-2xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal-light transition-colors duration-300"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pipeline Modal ── */}
      {rawPipelineData && (
        <PipelineModal
          open={pipelineOpen}
          data={rawPipelineData}
          imageUrl={imageUrl}
          isReal={result?.isReal ?? true}
          onClose={() => setPipelineOpen(false)}
        />
      )}
    </motion.div>
  );
}
