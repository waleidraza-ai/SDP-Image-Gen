import React, { useEffect, useState } from 'react';
import { X, Download, RotateCw, Copy, ChevronLeft, ChevronRight, Calendar, Check, Layers } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `pixelforge-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(image.prompt);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 text-white/70 px-2">
           <div className="flex items-center gap-1.5 text-xs font-mono bg-white/10 px-2 py-1 rounded-md">
             <Layers size={12} />
             {image.model}
           </div>
           <div className="flex items-center gap-1.5 text-xs font-mono bg-white/10 px-2 py-1 rounded-md">
             <Calendar size={12} />
             {formatDate(image.timestamp)}
           </div>
        </div>
        
        <button 
          onClick={onClose}
          className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Controls (Desktop) */}
      {hasPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all z-40 hidden md:flex items-center justify-center group"
        >
          <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      )}

      {hasNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all z-40 hidden md:flex items-center justify-center group"
        >
          <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Main Content */}
      <div 
        className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 pb-24 md:pb-24" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img 
            src={image.url} 
            alt={image.prompt} 
            className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl shadow-purple-900/20 ring-1 ring-white/10"
          />
        </div>
        
        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-4">
          
          <p className="text-white/80 text-sm md:text-base text-center max-w-3xl font-light leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-default">
            {image.prompt}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 active:scale-95 text-sm"
            >
              <Download size={16} />
              Download
            </button>

            {onRemix && (
              <button 
                onClick={() => {
                  onRemix(image);
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/30 active:scale-95 text-sm"
              >
                <RotateCw size={16} />
                Remix
              </button>
            )}
            
            <button 
               onClick={handleCopyPrompt}
               className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-full transition-all border active:scale-95 text-sm ${
                 copied 
                   ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                   : 'bg-white/10 text-white hover:bg-white/20 border-white/10'
               }`}
               title="Copy Prompt"
             >
               {copied ? <Check size={16} /> : <Copy size={16} />}
               {copied ? 'Copied' : 'Copy Prompt'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;