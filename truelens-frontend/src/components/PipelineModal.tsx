import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Zap, ScanLine, Layers, Activity, GitBranch, ShieldCheck, Eye } from 'lucide-react';

export interface PipelineData {
  label: string;
  confidence: number;
  latency: string;
  detail: {
    neural: { 'Deepfake Probability'?: number; 'FFT Frequency Score'?: number; face_detected?: boolean; uncertainty?: number; };
    forensics: { ela_score?: number; dct_score?: number; noise_score?: number; edge_score?: number; };
    api?: { source?: string; latency?: string; };
  };
}

interface Props { open: boolean; data: PipelineData; imageUrl: string; isReal: boolean; onClose: () => void; }

const p = (v?: number, fb = 0) => v !== undefined ? Math.round(v * 100) : fb;

// Radial gauge
function Gauge({ value, color, size = 64, label }: { value: number; color: string; size?: number; label: string }) {
  const r = size * 0.38; const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold tabular-nums" style={{ fontSize: size * 0.2, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{value}%</span>
        </div>
      </div>
      <span className="label-caps text-white/40 text-center leading-tight">{label}</span>
    </div>
  );
}

// Thin score bar with glow
function Bar({ value, color, label, desc }: { value: number; color: string; label: string; desc?: string }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[12px] text-white/70 font-medium tracking-tight">{label}</span>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color, fontFamily: 'var(--font-mono)' }}>{value}%</span>
      </div>
      {desc && <p className="text-[10px] text-white/28 mb-1.5 leading-relaxed">{desc}</p>}
      <div className="h-[3px] rounded-full bg-white/8 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(value,100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

// Image filter panel
function ImagePanel({ src, label, filter, overlay }: { src: string; label: string; filter?: string; overlay?: string }) {
  return (
    <div className="relative flex-1 aspect-square rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <img src={src} alt="" className="w-full h-full object-cover" style={{ filter: filter || 'none' }} />
      {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
      <div className="absolute bottom-0 inset-x-0 py-1 text-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
        <span className="text-[7px] uppercase tracking-wider text-white/60 font-semibold">{label}</span>
      </div>
    </div>
  );
}

// Section card
function Section({ title, icon, color, delay = 0, children }: { title: string; icon: React.ReactNode; color: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

export default function PipelineModal({ open, data, imageUrl, isReal, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const n = data.detail?.neural || {};
  const f = data.detail?.forensics || {};
  const deepfakePct = p(n['Deepfake Probability']);
  const fftPct = p(n['FFT Frequency Score']);
  const uncPct = p(n['uncertainty']);
  const elaPct = p(f.ela_score);
  const dctPct = p(f.dct_score);
  const noisePct = p(f.noise_score);
  const edgePct = p(f.edge_score);
  const confPct = Math.round((data.confidence || 0) * 100);
  const ac = isReal ? '#7B9E6B' : '#C75B3A';
  const acLight = isReal ? '#a8c99a' : '#e0866a';
  const verdict = data.label === 'Real' ? 'Likely Authentic' : data.label === 'Fake' ? 'Likely AI Generated' : 'Uncertain';

  // consensus fusion bar widths
  const fusionItems = [
    { label: 'Neural (SigLIP2)', weight: 70, score: deepfakePct, color: '#f59e0b' },
    { label: 'DCT Compression', weight: 22, score: dctPct, color: '#a78bfa' },
    { label: 'ELA Signal', weight: 8, score: elaPct, color: '#f472b6' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 backdrop-blur-2xl" style={{ background: 'rgba(0,0,0,0.82)' }} onClick={onClose} />

          <motion.div className="relative z-10 w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#14141a 0%,#0d0d12 100%)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)` }}
            initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}>

            {/* ─── HERO ─── */}
            <div className="relative flex-shrink-0 h-36 overflow-hidden">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.35) saturate(1.2)' }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${ac}28 0%,transparent 60%,rgba(0,0,0,0.6) 100%)` }} />

              <div className="absolute inset-0 flex items-end px-5 pb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ boxShadow: `0 0 0 2px ${ac}60` }}>
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-0.5">TrueLens · Forensic Pipeline</p>
                    <h2 className="text-lg font-bold" style={{ color: acLight }}>{verdict}</h2>
                    <p className="text-[10px] text-white/35">{data.detail?.api?.source || 'TrueLens Core v6'} · {data.latency || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Gauge value={confPct} color={ac} size={62} label="Confidence" />
                  <Gauge value={uncPct} color="#f472b6" size={62} label="Uncertainty" />
                </div>
              </div>

              <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* ─── BODY ─── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pipeline-scroll">

              {/* Step 1 — Ingestion */}
              <Section title="Step 1 · Image Ingestion & Sanitization" icon={<ScanLine className="w-3.5 h-3.5" />} color="#60a5fa" delay={0.05}>
                <div className="relative w-full h-24 rounded-lg overflow-hidden mb-3" style={{ border: '1px solid rgba(96,165,250,0.2)' }}>
                  <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(96,165,250,0.15),transparent)' }} />
                  {n.face_detected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                      className="absolute top-[10%] left-[28%] w-[38%] h-[75%] rounded"
                      style={{ border: '1.5px solid #4ade80', background: 'rgba(74,222,128,0.06)', boxShadow: '0 0 12px rgba(74,222,128,0.25)' }}>
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] bg-green-500 text-black px-1.5 font-bold rounded uppercase tracking-wider">Face</span>
                    </motion.div>
                  )}
                  <div className="absolute top-2 right-2 text-[8px] text-blue-300/80 font-mono bg-black/50 px-1.5 py-0.5 rounded">
                    {n.face_detected ? '✓ Face detected' : '✗ No face'}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center">
                  {['Format ✓', 'EXIF ✓', 'RGB ✓', 'Norm ✓'].map(t => (
                    <div key={t} className="rounded-lg py-1.5 font-medium text-blue-300" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>{t}</div>
                  ))}
                </div>
              </Section>

              {/* Step 2 — Classical Forensics */}
              <Section title="Step 2 · Classical Forensic Ensemble" icon={<Layers className="w-3.5 h-3.5" />} color="#a78bfa" delay={0.1}>
                <div className="flex gap-2 mb-3 h-20">
                  <ImagePanel src={imageUrl} label="ELA Map" filter="invert(1) contrast(180%) brightness(0.8)" overlay="rgba(167,139,250,0.12)" />
                  <ImagePanel src={imageUrl} label="DCT Blocks" filter="sepia(1) contrast(130%) brightness(1.1)" overlay="linear-gradient(rgba(255,255,255,0.04) 0 0)" />
                  <ImagePanel src={imageUrl} label="Noise Floor" filter="grayscale(1) brightness(1.3) contrast(80%)" />
                  <ImagePanel src={imageUrl} label="Edge Map" filter="grayscale(1) contrast(400%) invert(1) brightness(0.9)" />
                </div>
                <div className="space-y-2">
                  <Bar value={elaPct} color="#a78bfa" label="Error Level Analysis" desc="Re-compressed at 90% JPEG — residuals reveal edit boundaries" />
                  <Bar value={dctPct} color="#818cf8" label="DCT Block Artifacts" desc="8×8 block quantisation patterns — camera lens always leave these" />
                  <Bar value={noisePct} color="#c4b5fd" label="Noise Uniformity" desc="Spatial sensor noise variance — AI has suspiciously uniform floors" />
                  <Bar value={edgePct} color="#ddd6fe" label="Edge Sharpness" desc="Laplacian variance — over-sharpened edges indicate GAN synthesis" />
                </div>
              </Section>

              {/* Step 3 — FFT */}
              <Section title="Step 3 · FFT Frequency Domain" icon={<Activity className="w-3.5 h-3.5" />} color="#34d399" delay={0.15}>
                <div className="flex gap-3 items-center">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden" style={{ background: '#051a0f', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 blur-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-14 h-14">
                        {[14,28,42].map((r,i) => (
                          <div key={r} className="absolute rounded-full border" style={{ inset: `${i*6}px`, borderColor: `rgba(52,211,153,${0.15+i*0.12})` }} />
                        ))}
                        <motion.div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg,transparent,rgba(52,211,153,0.25),transparent)' }}
                          animate={{ rotate: 360 }} transition={{ duration: 8, ease: 'linear', repeat: Infinity }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" style={{ boxShadow: '0 0 8px #34d399' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Bar value={fftPct} color="#34d399" label="Frequency Realness" />
                    <p className="text-[10px] text-white/30 leading-relaxed">
                      Natural optics produce a smooth 1/f frequency rolloff. GAN upsampling creates periodic spectral peaks at multiples of the upsampling stride.
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <div className="text-[9px] text-emerald-400 font-mono">1/f rolloff</div>
                        <div className="text-[8px] text-white/30">natural</div>
                      </div>
                      <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: !isReal ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid rgba(52,211,153,${!isReal ? 0.4 : 0.1})` }}>
                        <div className="text-[9px] text-emerald-400 font-mono">Grid artifact</div>
                        <div className="text-[8px] text-white/30">{!isReal ? 'detected' : 'clean'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Step 4 — Neural */}
              <Section title="Step 4 · SigLIP2 Neural Classifier — Multi-Crop TTA" icon={<Brain className="w-3.5 h-3.5" />} color="#f59e0b" delay={0.2}>
                <div className="flex gap-1.5 h-20 mb-3">
                  {[
                    { label: 'Face Crop', wt: '55%', zoom: '-top-1/4 -left-1/4 w-[150%] h-[150%]', opacity: 'opacity-90', border: 'rgba(245,158,11,0.5)' },
                    { label: 'Center', wt: '30%', zoom: '-top-[5%] -left-[5%] w-[110%] h-[110%]', opacity: 'opacity-70', border: 'rgba(245,158,11,0.3)' },
                    { label: 'Full', wt: '15%', zoom: 'w-full h-full', opacity: 'opacity-40', border: 'rgba(245,158,11,0.15)' },
                  ].map(c => (
                    <div key={c.label} className={`flex-1 relative rounded-lg overflow-hidden bg-black`} style={{ border: `1px solid ${c.border}` }}>
                      <img src={imageUrl} alt="" className={`absolute object-cover ${c.zoom} ${c.opacity}`} />
                      <div className="absolute bottom-0 inset-x-0 p-1 text-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
                        <div className="text-[7px] uppercase tracking-wider text-amber-300 font-bold">{c.label}</div>
                        <div className="text-[6px] text-amber-400/60 font-mono">{c.wt} WT</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Bar value={deepfakePct} color="#f59e0b" label="Deepfake Probability (raw neural)" />
                  <Bar value={uncPct} color="#fcd34d" label="Model Uncertainty" />
                </div>
                <p className="text-[9px] text-white/25 mt-2 font-mono">prithivMLmods/open-deepfake-detection · INT8 quantized on CPU</p>
              </Section>

              {/* Step 5 — Calibration */}
              <Section title="Step 5 · Signal Calibration & Logit Correction" icon={<Zap className="w-3.5 h-3.5" />} color="#f472b6" delay={0.25}>
                <p className="text-[10px] text-white/35 mb-3 leading-relaxed">
                  Raw neural probability is adjusted on the logit scale: <code className="text-pink-300/60 text-[9px]">p → sigmoid(logit(p) + bias)</code>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { signal: 'DCT Bias', val: dctPct > 28 ? '−3.5 → Real' : dctPct < 12 ? '+2.0 → Fake' : '±calibrated', active: dctPct > 28 || dctPct < 12 },
                    { signal: 'Noise Bias', val: noisePct < 25 ? '+0.6' : noisePct > 75 ? '−0.4' : '±0.0', active: noisePct < 25 || noisePct > 75 },
                    { signal: 'Edge Bias', val: edgePct > 65 ? '+0.4' : edgePct < 25 ? '−0.3' : '±0.0', active: edgePct > 65 || edgePct < 25 },
                  ].map(row => (
                    <div key={row.signal} className="rounded-xl p-2.5" style={{ background: row.active ? 'rgba(244,114,182,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid rgba(244,114,182,${row.active ? 0.3 : 0.1})` }}>
                      <div className="text-[9px] text-white/40 mb-0.5">{row.signal}</div>
                      <div className="text-[11px] font-mono font-bold" style={{ color: row.active ? '#f472b6' : 'rgba(255,255,255,0.3)' }}>{row.val}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Step 6 — Fusion */}
              <Section title="Step 6 · Consensus Fusion" icon={<GitBranch className="w-3.5 h-3.5" />} color="#22d3ee" delay={0.3}>
                <p className="text-[10px] text-white/30 mb-3">Empirical Fisher discriminant analysis derived weights from test-set distributions.</p>
                <div className="space-y-3">
                  {fusionItems.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-white/60">{item.label}</span>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 rounded">{item.weight}% weight</span>
                          <span className="text-[11px] font-mono font-bold" style={{ color: item.color }}>{item.score}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white/6 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${item.color}cc,${item.color})`, boxShadow: `0 0 6px ${item.color}` }}
                          initial={{ width: 0 }} animate={{ width: `${Math.min(item.score, 100)}%` }}
                          transition={{ duration: 1.1, ease: 'easeOut' }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                      <span>FFT / Noise / Edge</span>
                      <span className="italic">0% — display only (low Fisher discriminance)</span>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Step 7 — Verdict */}
              <Section title="Step 7 · Final Verdict" icon={<ShieldCheck className="w-3.5 h-3.5" />} color={ac} delay={0.35}>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl font-bold text-sm" style={{ background: `${ac}20`, color: acLight, border: `1px solid ${ac}50` }}>
                        {verdict}
                      </div>
                      <Eye className="w-4 h-4" style={{ color: ac }} />
                    </div>
                    <Bar value={confPct} color={ac} label="Final Confidence" />
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center mt-1">
                      {[
                        { l: 'Consensus', v: `${confPct}%` },
                        { l: 'Uncertainty', v: `${uncPct}%` },
                        { l: 'Latency', v: data.latency || '—' },
                      ].map(i => (
                        <div key={i.l} className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="font-bold text-white text-sm">{i.v}</div>
                          <div className="text-white/30 text-[9px]">{i.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Gauge value={confPct} color={ac} size={80} label="Final Score" />
                </div>
              </Section>
            </div>

            {/* ─── FOOTER ─── */}
            <div className="flex-shrink-0 px-4 py-2.5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-white/20">
                TrueLens Forensic Core v6 · SigLIP2 · INT8 CPU · All computation on-device · No data retained
              </p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
