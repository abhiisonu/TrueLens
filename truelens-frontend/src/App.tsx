import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AnalysisOverlay from './components/AnalysisOverlay';
import Features from './components/Features';
import Footer from './components/Footer';

export default function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(d => !d), []);

  const handleUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
    setUploadedFile(file);
  }, []);

  const handleClose = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
  }, []);

  return (
    <div className="min-h-screen bg-cream grain-overlay">
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />
      <HeroSection onUpload={handleUpload} />
      <Features />
      <Footer />

      {/* Analysis overlay modal */}
      <AnimatePresence>
        {uploadedImage && uploadedFile && (
          <AnalysisOverlay
            key={uploadedImage}
            imageUrl={uploadedImage}
            imageFile={uploadedFile}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
