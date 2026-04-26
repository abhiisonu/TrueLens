import { Eye, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="about" className="relative py-20 px-6 bg-charcoal text-cream overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cream/10 to-transparent" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-terracotta/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-16">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-cream/[0.08] flex items-center justify-center">
                <Eye className="w-5 h-5 text-cream" strokeWidth={2} />
              </div>
              <span className="font-display text-2xl font-semibold">TrueLens</span>
            </div>
            <p className="text-cream/50 text-sm leading-relaxed">
              A streamlined academic deepfake detection framework. Built to demonstrate 
              applied computer vision and neural inference techniques for multimedia authentication.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-4">
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-cream/30 mb-3">
                Product
              </h4>
              <div className="space-y-2.5">
                <a href="#" className="block text-sm text-cream/60 hover:text-cream transition-colors">
                  Documentation
                </a>
                <a href="#" className="block text-sm text-cream/60 hover:text-cream transition-colors">
                  Source Code
                </a>
                <a href="#" className="block text-sm text-cream/60 hover:text-cream transition-colors">
                  Architecture
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-cream/30 mb-3">
                Company
              </h4>
              <div className="space-y-2.5">
                <a href="#" className="block text-sm text-cream/60 hover:text-cream transition-colors">
                  Methodology
                </a>
                <a href="#" className="block text-sm text-cream/60 hover:text-cream transition-colors">
                  Dataset
                </a>
                <a href="#" className="block text-sm text-cream/60 hover:text-cream transition-colors">
                  Research
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cream/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/30 text-sm">
            © 2025 TrueLens. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-cream/30 hover:text-cream/60 text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-cream/30 hover:text-cream/60 text-sm transition-colors">
              Terms
            </a>
            <span className="text-cream/20 text-sm flex items-center gap-1">
              Built for <Heart className="w-3 h-3 text-terracotta/60" /> academic presentation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
