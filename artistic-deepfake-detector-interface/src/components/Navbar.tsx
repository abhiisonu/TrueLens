import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-40 px-6 py-4 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/80 backdrop-blur-xl shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-charcoal flex items-center justify-center group-hover:bg-terracotta transition-colors duration-300">
            <Eye className="w-4 h-4 text-cream" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold text-warm-black tracking-tight">
            TrueLens
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-text-muted hover:text-warm-black transition-colors duration-300"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="text-sm text-text-muted hover:text-warm-black transition-colors duration-300"
          >
            About
          </a>
          <button className="btn-shine text-sm px-5 py-2.5 rounded-full bg-charcoal text-cream hover:bg-charcoal-light transition-colors duration-300 font-medium">
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-warm-black" />
          ) : (
            <Menu className="w-5 h-5 text-warm-black" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-cream/95 backdrop-blur-xl border-t border-cream-dark p-6"
        >
          <div className="flex flex-col gap-4">
            <a
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-text-muted hover:text-warm-black transition-colors"
            >
              How It Works
            </a>
            <a
              href="#about"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-text-muted hover:text-warm-black transition-colors"
            >
              About
            </a>
            <button className="text-sm px-5 py-2.5 rounded-full bg-charcoal text-cream w-full mt-2">
              Get Started
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
