import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, ImageIcon, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onUpload: (file: File) => void;
}

export default function HeroSection({ onUpload }: HeroSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Decorative organic blobs */}
      <div className="absolute top-16 -left-40 w-[500px] h-[500px] bg-terracotta/[0.07] blob-1 animate-float pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-[420px] h-[420px] bg-sage/[0.07] blob-2 animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/3 right-[15%] w-[300px] h-[300px] bg-gold/[0.06] blob-3 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 left-[10%] w-[200px] h-[200px] bg-terracotta/[0.04] blob-2 animate-float pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--color-warm-black) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        className="text-center max-w-4xl mx-auto mb-14 relative z-10"
      >


        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-warm-black leading-[0.92] tracking-tight mb-7"
        >
          See the{' '}
          <span className="relative inline-block">
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-terracotta via-terracotta-light to-gold">
              Truth
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-gold/20 -skew-x-3 rounded-sm" />
          </span>
          <br />
          behind every pixel
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-text-muted max-w-xl mx-auto leading-relaxed"
        >
          Upload any image and our advanced AI reveals whether it's an authentic
          photograph or an AI-generated creation — in seconds.
        </motion.p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.8 }}
        className="w-full max-w-xl relative z-10"
      >
        <div
          className={`upload-zone p-10 sm:p-14 flex flex-col items-center justify-center cursor-pointer min-h-[280px] ${
            isDragOver ? 'drag-over' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Upload icon */}
          <motion.div
            animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-2xl bg-terracotta/[0.08] flex items-center justify-center mb-6"
          >
            <Upload className="w-7 h-7 text-terracotta" />
          </motion.div>

          <h3 className="font-display text-xl sm:text-2xl font-semibold text-warm-black mb-2">
            Drop your image here
          </h3>
          <p className="text-text-muted text-sm mb-5">or click to browse your files</p>

          <div className="flex items-center gap-2 text-xs text-warm-gray">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>JPG, PNG, WEBP — up to 20MB</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Trust indicators below upload */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-6 mt-8 text-xs text-warm-gray"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-sage" />
            <span>No data stored</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>Runs locally</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
            <span>Instant results</span>
          </div>
        </motion.div>
      </motion.div>


    </section>
  );
}
