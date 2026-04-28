import { motion } from 'framer-motion';
import { Scan, Brain, ShieldCheck, Layers } from 'lucide-react';

const features = [
  {
    icon: Scan,
    title: 'Deep Pixel Analysis',
    description:
      'Inspects raw pixel distributions to surface structural noise and statistical anomalies that betray synthetic generation or post-processing manipulation.',
    color: 'terracotta' as const,
    bgClass: 'bg-terracotta/10',
    textClass: 'text-terracotta',
  },
  {
    icon: Brain,
    title: 'Neural Pattern Recognition',
    description:
      'Runs each image through a quantized SigLIP2 vision model trained to distinguish natural photographic patterns from AI-generated texture and frequency signatures.',
    color: 'gold' as const,
    bgClass: 'bg-gold/10',
    textClass: 'text-gold',
  },
  {
    icon: ShieldCheck,
    title: 'Confidence Scoring',
    description:
      'Aggregates raw logit outputs across texture, lighting, and noise channels into a calibrated confidence score — giving you a transparent, numeric verdict, not a black-box label.',
    color: 'sage' as const,
    bgClass: 'bg-sage/10',
    textClass: 'text-sage',
  },
  {
    icon: Layers,
    title: 'Multi-Layer Fusion',
    description:
      'Combines five independent forensic detection layers — pixel stats, frequency residuals, edge coherence, compression history, and model inference — into a single unified result.',
    color: 'terracotta' as const,
    bgClass: 'bg-terracotta/[0.08]',
    textClass: 'text-terracotta',
  },
];

const stats = [
  { value: '~80%', label: 'Accuracy Rate', sub: 'on benchmark sets' },
  { value: '~5s', label: 'Analysis Time', sub: 'end-to-end, on CPU' },
  { value: '7', label: 'Detection Signals', sub: 'per inference pass' },
  { value: '5', label: 'Forensic Layers', sub: 'fused at output' },
];

export default function Features() {
  return (
    <section id="how-it-works" className="relative py-28 px-6 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cream-darker to-transparent" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-terracotta/[0.03] blob-3 animate-float-slow pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-sage/[0.03] blob-1 animate-float-reverse pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-terracotta tracking-[0.18em] uppercase mb-5">
            <span className="w-6 h-px bg-terracotta/50" />
            How It Works
            <span className="w-6 h-px bg-terracotta/50" />
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-warm-black mb-5 leading-tight">
            The logic behind
            <br />
            the verification
          </h2>
          <p className="text-text-muted max-w-lg mx-auto leading-relaxed text-base">
            A multi-layered forensic pipeline that combines a quantized neural
            vision model with classical image analysis to surface hidden
            manipulation signals.
          </p>
        </motion.div>

        {/* Feature cards — 2×2 grid on md+, stacked on mobile */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="feature-card group relative p-7 rounded-3xl bg-white border border-cream-dark/80 hover:border-warm-gray/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-charcoal/[0.04] flex flex-col"
            >
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${feature.bgClass} group-hover:scale-110 transition-transform duration-500`}
              >
                <feature.icon className={`w-4.5 h-4.5 ${feature.textClass}`} strokeWidth={2} />
              </div>

              <h3 className="font-display text-lg font-semibold text-warm-black mb-2.5 leading-snug">
                {feature.title}
              </h3>
              <p className="text-text-muted text-[13.5px] leading-relaxed flex-1">
                {feature.description}
              </p>

              {/* Step number watermark */}
              <div className="absolute top-4 right-6 font-display text-[3.5rem] font-bold text-cream-dark/50 select-none leading-none">
                0{i + 1}
              </div>

              {/* Bottom accent */}
              <div
                className={`absolute bottom-0 left-7 right-7 h-[2px] rounded-full ${
                  feature.color === 'terracotta'
                    ? 'bg-terracotta/30'
                    : feature.color === 'gold'
                    ? 'bg-gold/30'
                    : 'bg-sage/30'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-20 mb-0 h-px bg-gradient-to-r from-transparent via-cream-darker to-transparent" />

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-cream-dark/60"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center px-6 py-2">
              <div className="font-display text-3xl sm:text-4xl font-bold text-warm-black mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-[13px] font-medium text-warm-black/70 mb-0.5">{stat.label}</div>
              <div className="text-[11px] text-text-muted">{stat.sub}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
