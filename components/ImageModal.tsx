import React, { useEffect } from 'react';
import { X, Download, RotateCw, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onRemix?: (image: GeneratedImage) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  image, 
  onClose, 
  onRemix, 
  onPrev, 
  onNext,
  hasNext,
  hasPrev 
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose, onPrev, onNext]);

  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `pixelforge-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 p-4" onClick={onClose}>
      {/* Top Controls */}
      <button 
        onClick={onClose}
        className="absolute right-6 top-6 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all z-50"
      >
        <X size={24} />
      </button>

      {/* Navigation Controls */}
      {hasPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all z-40 hidden md:block"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {hasNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all z-40 hidden md:block"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Content */}
      <div 
        className="relative max-w-full max-h-full flex flex-col items-center group" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <img 
            src={image.url} 
            alt={image.prompt} 
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl shadow-purple-900/20 border border-white/5"
          />
        </div>
        
        {/* Action Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-slide-up">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 active:scale-95"
          >
            <Download size={18} />
            Download
          </button>

          {onRemix && (
            <button 
              onClick={() => {
                onRemix(image);
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/30 active:scale-95"
            >
              <RotateCw size={18} />
              Remix Settings
            </button>
          )}
          
          <button 
             onClick={() => {
               navigator.clipboard.writeText(image.prompt);
             }}
             className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors border border-white/10 active:scale-95"
             title="Copy Prompt"
           >
             <Copy size={18} />
           </button>
        </div>
        
        <div className="w-full flex justify-center mt-4 px-4">
          <p className="text-white/60 text-sm text-center max-w-2xl font-light leading-relaxed">
            {image.prompt}
          </p>
        </div>
        
        {/* Mobile Navigation Indicators (Dots or arrows if needed, but swipe usually preferred. For now keeping minimal) */}
      </div>
    </div>
  );
};

export default ImageModal;