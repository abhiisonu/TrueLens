import { motion } from 'framer-motion';
import { Scan, Brain, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Scan,
    title: 'Deep Pixel Analysis',
    description:
      'Examines pixel-level data to detect underlying inconsistencies, including structural noise and compression artifacts.',
    color: 'terracotta' as const,
    bgClass: 'bg-terracotta/10',
    textClass: 'text-terracotta',
  },
  {
    icon: Brain,
    title: 'Neural Pattern Recognition',
    description:
      'Advanced model inference to identify potential synthetically generated patterns within the media.',
    color: 'gold' as const,
    bgClass: 'bg-gold/10',
    textClass: 'text-gold',
  },
  {
    icon: ShieldCheck,
    title: 'Confidence Scoring',
    description:
      'Aggregated metrics across texture, lighting, and noise provide a calculated assessment of image authenticity.',
    color: 'sage' as const,
    bgClass: 'bg-sage/10',
    textClass: 'text-sage',
  },
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
          <span className="text-[13px] font-semibold text-terracotta tracking-[0.15em] uppercase mb-5 block">
            How It Works
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-warm-black mb-5 leading-tight">
            The logic behind
            <br />
            the verification
          </h2>
          <p className="text-text-muted max-w-lg mx-auto leading-relaxed">
            Our multi-layered approach combines local inference models with
            standard forensic techniques.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="group relative p-8 lg:p-9 rounded-3xl bg-white border border-cream-dark/80 hover:border-warm-gray/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-charcoal/[0.04]"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${feature.bgClass} group-hover:scale-110 transition-transform duration-500`}
              >
                <feature.icon className={`w-5 h-5 ${feature.textClass}`} />
              </div>

              <h3 className="font-display text-xl font-semibold text-warm-black mb-3">
                {feature.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Step number watermark */}
              <div className="absolute top-5 right-7 font-display text-[4.5rem] font-bold text-cream-dark/60 select-none leading-none">
                0{i + 1}
              </div>

              {/* Subtle bottom accent line */}
              <div
                className={`absolute bottom-0 left-8 right-8 h-[2px] rounded-full ${
                  feature.color === 'terracotta'
                    ? 'bg-terracotta/20'
                    : feature.color === 'gold'
                    ? 'bg-gold/20'
                    : 'bg-sage/20'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: '70+ %', label: 'Accuracy Rate' },
            { value: '~2s', label: 'Analysis Time' },
            { value: '7', label: 'Detection Signals' },
            { value: '5', label: 'Detection Layers' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-warm-black mb-1">
                {stat.value}
              </div>
              <div className="text-[13px] text-text-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
