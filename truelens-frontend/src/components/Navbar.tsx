import { motion } from 'framer-motion';
import { Eye, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Navbar({ isDark, onToggleTheme }: NavbarProps) {

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="absolute top-0 left-0 right-0 z-40 px-6 py-5 bg-transparent"
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

        {/* Action area */}
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }}
          >
            {isDark
              ? <Sun className="w-4 h-4 text-gold" />
              : <Moon className="w-4 h-4 text-warm-gray" />}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
