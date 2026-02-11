import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Image as ImageIcon, Sparkles, 
  Download, Copy, Maximize2, Zap, Dices, RotateCw, Key,
  RefreshCcw, Wand2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { GeneratedImage, GenerationSettings, ModelId } from './types';
import { ASPECT_RATIOS, MODELS, SAMPLE_PROMPTS } from './constants';
import * as GeminiService from './services/geminiService';
import ImageModal from './components/ImageModal';
import HistoryStrip from './components/HistoryStrip';
import ModelSelector from './components/ModelSelector';
import Toast, { ToastType } from './components/Toast';

const LOADING_MESSAGES = [
  "Dreaming up your masterpiece...",
  "Mixing digital colors...",
  "Consulting the AI muses...",
  "Polishing pixels...",
  "Adding magical sparkles...",
  "Almost there..."
];

// Helper to safely generate IDs
const generateId = (): string => {
  try {
    if (typeof uuidv4 === 'function') {
      return uuidv4();
    }
    throw new Error('uuidv4 not available');
  } catch (e) {
    // Fallback ID generator
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<GenerationSettings>({
    prompt: '',
    negativePrompt: '',
    model: ModelId.GEMINI_2_FLASH,
    aspectRatio: '1:1',
    imageCount: 1,
    seed: undefined,
    guidanceScale: 5,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);
  const [isExpandedNegative, setIsExpandedNegative] = useState(false);
  const [isExpandedAdvanced, setIsExpandedAdvanced] = useState(false);

  // Refs
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const loadingIntervalRef = useRef<number | null>(null);

  // Derived State
  const selectedImage = history.find(img => img.id === selectedImageId) || null;
  const isImagenModel = settings.model.includes('imagen');

  // Initialize
  useEffect(() => {
    const storedHistory = localStorage.getItem('IMAGE_HISTORY');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save History
  useEffect(() => {
    localStorage.setItem('IMAGE_HISTORY', JSON.stringify(history));
  }, [history]);

  // Loading Message Cycle
  useEffect(() => {
    if (isGenerating) {
      setLoadingMsgIndex(0);
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isGenerating]);

  // Handlers
  const showToast = (msg: string, type: ToastType = 'info') => {
    setToast({ msg, type });
  };

  const handleClearHistory = () => {
    if(confirm("Are you sure you want to clear your history?")) {
      setHistory([]);
      setCurrentImages([]);
      showToast("History cleared", "info");
    }
  };

  const handleDeleteImage = (id: string) => {
     setHistory(prev => prev.filter(img => img.id !== id));
     setCurrentImages(prev => prev.filter(img => img.id !== id));
     if (selectedImageId === id) setSelectedImageId(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Prompt copied to clipboard!", "success");
    } catch (err) {
      console.error('Failed to copy', err);
      showToast("Failed to copy", "error");
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setSettings(prev => ({ ...prev, prompt: randomPrompt }));
    showToast("Random prompt applied!", "info");
  };

  const handleRemix = (image: GeneratedImage) => {
    const modelOption = MODELS.find(m => m.name === image.model) || MODELS.find(m => m.id === ModelId.GEMINI_2_FLASH);
    
    setSettings({
      prompt: image.prompt,
      negativePrompt: '',
      model: modelOption ? modelOption.id : ModelId.GEMINI_2_FLASH,
      aspectRatio: image.aspectRatio,
      imageCount: 1,
      seed: undefined, // Don't carry over seed to allow variations
      guidanceScale: 5,
    });
    
    showToast("Settings restored from image!", "success");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    textAreaRef.current?.focus();
  };

  const handleGenerate = async () => {
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    if (!settings.prompt.trim()) {
      showToast("Please enter a prompt first", "error");
      textAreaRef.current?.focus();
      return;
    }

    setIsGenerating(true);
    setCurrentImages([]); 

    try {
      const base64Images = await GeminiService.generateImages(
        settings.model,
        settings.prompt,
        settings.aspectRatio,
        settings.negativePrompt,
        settings.imageCount,
        settings.seed,
        settings.guidanceScale
      );

      if (base64Images.length === 0) {
        throw new Error("No images returned from the API.");
      }

      const newImages: GeneratedImage[] = base64Images.map(url => ({
        id: generateId(), // Use safe ID generator
        url,
        prompt: settings.prompt,
        model: MODELS.find(m => m.id === settings.model)?.name || 'Unknown',
        timestamp: Date.now(),
        aspectRatio: settings.aspectRatio
      }));

      // Add to history (newest first)
      setHistory(prev => [...newImages, ...prev]);
      setCurrentImages(newImages);
      showToast("Image generation complete!", "success");

    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Generation failed", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!isGenerating) handleGenerate();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings, isGenerating]);

  // Modal Navigation
  const handleNextImage = () => {
    if (!selectedImageId) return;
    const currentIndex = history.findIndex(img => img.id === selectedImageId);
    if (currentIndex > 0) {
      setSelectedImageId(history[currentIndex - 1].id); // History is newest first
    }
  };

  const handlePrevImage = () => {
    if (!selectedImageId) return;
    const currentIndex = history.findIndex(img => img.id === selectedImageId);
    if (currentIndex < history.length - 1) {
      setSelectedImageId(history[currentIndex + 1].id);
    }
  };

  // Helper to get CSS aspect ratio class or style
  const getAspectRatioStyle = (ratioId: string) => {
    const ratioMap: Record<string, { width: number, height: number }> = {
      '1:1': { width: 1, height: 1 },
      '16:9': { width: 16, height: 9 },
      '9:16': { width: 9, height: 16 },
      '4:3': { width: 4, height: 3 },
      '3:4': { width: 3, height: 4 },
    };
    const r = ratioMap[ratioId] || { width: 1, height: 1 };
    return { aspectRatio: `${r.width} / ${r.height}` };
  };

  return (
    <div className="min-h-screen font-sans text-slate-100 pb-10 selection:bg-purple-500/30">
      
      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full glass-panel border-b-0 border-t-0 border-x-0 rounded-b-2xl px-6 py-4 mb-4 shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:rotate-12 transition-transform duration-300">
              <Palette className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 tracking-tight">
                PixelForge AI
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide hidden sm:block">POWERED BY GOOGLE GEMINI</p>
            </div>
          </div>
          
          <button 
            onClick={async () => {
               if ((window as any).aistudio) {
                   await (window as any).aistudio.openSelectKey();
               }
            }}
            className="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-gray-300 hover:text-white transition-all hover:border-purple-500/50"
            title="API Settings"
          >
            <Key size={16} />
            <span className="text-sm font-medium hidden sm:block">
              API Key
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Controls */}
          <section className="w-full lg:w-[380px] flex-shrink-0 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-7 animate-slide-up duration-500 border-t border-white/10">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Zap size={18} className="text-yellow-400 fill-yellow-400/20" />
                  <h2 className="font-display font-bold text-lg">Create</h2>
                </div>
                <button 
                  onClick={handleSurpriseMe}
                  className="glass-button flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1.5 rounded-full border-cyan-500/20"
                >
                  <Dices size={14} /> Random
                </button>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Prompt</label>
                <div className="relative group">
                  <textarea
                    ref={textAreaRef}
                    value={settings.prompt}
                    onChange={(e) => setSettings({...settings, prompt: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleGenerate();
                      }
                    }}
                    placeholder="Describe your imagination... e.g. A futuristic city made of crystal, neon lights, 8k render"
                    className="glass-input w-full rounded-2xl p-4 text-sm placeholder-gray-500 resize-y min-h-[140px] focus:min-h-[180px] transition-all duration-300 leading-relaxed"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 font-mono bg-black/40 px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm pointer-events-none">
                     {settings.prompt.length}/1000
                  </div>
                </div>
              </div>

              {/* Model Selector - Custom Component */}
              <div className="space-y-2 z-20 relative">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Model</label>
                <ModelSelector 
                  selectedModelId={settings.model} 
                  onSelect={(id) => setSettings({...settings, model: id})} 
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2 z-10">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map((ratio) => {
                    const isSelected = settings.aspectRatio === ratio.id;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setSettings({...settings, aspectRatio: ratio.id})}
                        className={`
                          flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group
                          ${isSelected 
                            ? 'glass-button-selected' 
                            : 'glass-button hover:bg-white/5'}
                        `}
                      >
                         {isSelected && <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />}
                        <div 
                          className={`border-2 ${isSelected ? 'border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-gray-500 group-hover:border-gray-400'} rounded-[2px] transition-all duration-300`}
                          style={{
                            width: '16px',
                            height: `${(16 / ratio.width) * ratio.height}px`
                          }}
                        />
                        <span className={`text-[9px] font-bold tracking-tight ${isSelected ? 'text-purple-200' : 'text-gray-500 group-hover:text-gray-400'}`}>
                          {ratio.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image Count */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Quantity</label>
                <div className="grid grid-cols-4 gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
                  {[1, 2, 3, 4].map((count) => {
                    const isSelected = settings.imageCount === count;
                    return (
                      <button
                        key={count}
                        onClick={() => setSettings({...settings, imageCount: count})}
                        className={`
                          py-2 rounded-lg text-xs font-bold transition-all duration-200
                          ${isSelected 
                            ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                        `}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-1 pt-2">
                {/* Negative Prompt */}
                <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
                  <button 
                    onClick={() => setIsExpandedNegative(!isExpandedNegative)}
                    className="flex items-center justify-between w-full p-3 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>Negative Prompt</span>
                    <span className={`transition-transform duration-300 ${isExpandedNegative ? 'rotate-180' : ''}`}>
                      <RotateCw size={12} className={isExpandedNegative ? 'rotate-180 opacity-0' : 'opacity-0'} /> {/* Spacer/Icon placeholder */}
                      ▼
                    </span>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${isExpandedNegative ? 'max-h-32 opacity-100 p-3 pt-0' : 'max-h-0 opacity-0 p-0 overflow-hidden'}`}>
                    <textarea
                      value={settings.negativePrompt}
                      onChange={(e) => setSettings({...settings, negativePrompt: e.target.value})}
                      placeholder="e.g. blurry, distorted, low quality"
                      className="glass-input w-full rounded-lg p-2.5 text-xs placeholder-gray-600 resize-none h-20"
                    />
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
                  <button 
                    onClick={() => setIsExpandedAdvanced(!isExpandedAdvanced)}
                    className="flex items-center justify-between w-full p-3 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>Advanced</span>
                    <span className={`transition-transform duration-300 ${isExpandedAdvanced ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  <div className={`transition-all duration-300 ease-in-out ${isExpandedAdvanced ? 'max-h-64 opacity-100 p-3 pt-0' : 'max-h-0 opacity-0 p-0 overflow-hidden'}`}>
                    <div className="space-y-4">
                        {/* Seed */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-bold text-gray-500">Seed</label>
                              <button 
                                onClick={() => setSettings({...settings, seed: undefined})}
                                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
                                title="Randomize seed"
                              >
                                <RefreshCcw size={10} /> Reset
                              </button>
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              value={settings.seed ?? ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSettings({...settings, seed: isNaN(val) ? undefined : val});
                              }}
                              placeholder="Random (-1)"
                              className="glass-input w-full rounded-lg px-3 py-2 text-xs placeholder-gray-600 font-mono"
                            />
                          </div>
                        </div>

                        {/* Guidance Scale (Imagen Only) */}
                        {isImagenModel ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] uppercase font-bold text-gray-500">Guidance Scale</label>
                                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                  {settings.guidanceScale}
                                </span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="20"
                              step="0.1"
                              value={settings.guidanceScale}
                              onChange={(e) => setSettings({...settings, guidanceScale: parseFloat(e.target.value)})}
                              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                            />
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-600 italic px-2">
                            Guidance scale unavailable for this model.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Right Column: Output */}
          <section className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Generate Button Area */}
            <div className="relative z-20">
              <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`
                    w-full relative overflow-hidden group rounded-2xl p-[1px]
                    ${!isGenerating ? 'hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-purple-500/10' : 'cursor-wait opacity-90'}
                    transition-all duration-300
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 ${isGenerating ? 'animate-shimmer' : 'group-hover:opacity-100'} transition-opacity duration-500`} style={{ backgroundSize: '200% 100%' }} />
                  <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl h-16 flex items-center justify-center gap-3 transition-colors group-hover:bg-gray-900/60">
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white font-bold tracking-wide text-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                          {LOADING_MESSAGES[loadingMsgIndex]}
                        </span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="text-purple-300 group-hover:rotate-12 transition-transform duration-300 group-hover:text-white" size={22} />
                        <span className="text-white font-bold tracking-wide text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all">
                          Generate Images
                        </span>
                      </>
                    )}
                  </div>
                </button>
            </div>
            
            <div className="flex items-center gap-2 text-white/80 border-b border-white/5 pb-2">
               <ImageIcon size={18} className="text-purple-400" />
               <h2 className="font-display font-bold text-lg tracking-wide">Results</h2>
            </div>

            {/* Main Display Area */}
            <div className={`
              glass-panel
              w-full min-h-[500px] lg:min-h-[600px] rounded-3xl p-6 relative flex flex-col transition-all duration-500
              ${currentImages.length === 0 && !isGenerating ? 'justify-center items-center bg-black/20' : ''}
            `}>
              
              {/* Empty State */}
              {currentImages.length === 0 && !isGenerating && (
                <div className="text-center space-y-6 max-w-sm animate-float">
                  <div className="w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-white/5 group shadow-2xl shadow-purple-900/20">
                    <Sparkles size={48} className="text-purple-400/40 group-hover:text-purple-300/80 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      Imagine Anything
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed px-4">
                      Enter a detailed prompt to generate high-quality images powered by Gemini & Imagen models.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600 font-mono border-t border-white/5 pt-4 w-fit mx-auto px-6">
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">⌘</span> + <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Enter</span> to generate
                  </div>
                </div>
              )}

              {/* Loading Skeleton */}
              {isGenerating && (
                <div className={`grid gap-6 w-full ${settings.imageCount === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                   {Array.from({ length: settings.imageCount }).map((_, i) => (
                     <div 
                        key={i} 
                        className="rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden shadow-2xl"
                        style={getAspectRatioStyle(settings.aspectRatio)}
                      >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />
                       
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-purple-500 animate-spin" />
                            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
                          </div>
                       </div>
                     </div>
                   ))}
                </div>
              )}

              {/* Results Grid */}
              {currentImages.length > 0 && !isGenerating && (
                <div className={`grid gap-6 ${currentImages.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {currentImages.map((img) => (
                    <div 
                      key={img.id} 
                      className="group relative rounded-2xl overflow-hidden glass-card shadow-2xl animate-scale-in ring-1 ring-white/10"
                      style={getAspectRatioStyle(img.aspectRatio)}
                    >
                      <img 
                        src={img.url} 
                        alt={img.prompt} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                         <div className="flex gap-3 justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                           <button 
                             onClick={() => setSelectedImageId(img.id)}
                             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 border border-white/10"
                             title="View Fullscreen"
                           >
                             <Maximize2 size={20} />
                           </button>
                           <button 
                             onClick={() => handleRemix(img)}
                             className="p-3 bg-purple-500/20 hover:bg-purple-500/40 backdrop-blur-md rounded-full text-purple-200 transition-all hover:scale-110 border border-purple-500/20"
                             title="Remix"
                           >
                             <RotateCw size={20} />
                           </button>
                           <button 
                             onClick={() => {
                               const link = document.createElement('a');
                               link.href = img.url;
                               link.download = `pixelforge-${img.id}.png`;
                               link.click();
                             }}
                             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 border border-white/10"
                             title="Download"
                           >
                             <Download size={20} />
                           </button>
                           <button 
                             onClick={() => copyToClipboard(img.prompt)}
                             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 border border-white/10"
                             title="Copy Prompt"
                           >
                             <Copy size={20} />
                           </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Strip */}
            <HistoryStrip 
              history={history} 
              onSelect={(img) => setSelectedImageId(img.id)}
              onClear={handleClearHistory}
              onDelete={handleDeleteImage}
            />

          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 mt-12 py-8 text-center">
         <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
           Made with <span className="text-purple-500 animate-pulse">💜</span> using Google Gemini AI
         </p>
         <p className="text-gray-700 text-xs mt-2 font-mono opacity-50">PixelForge v1.3.0</p>
      </footer>

      {/* Modals */}
      
      <ImageModal 
        image={selectedImage} 
        onClose={() => setSelectedImageId(null)}
        onRemix={handleRemix}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        hasNext={history.length > 1 && selectedImageId !== history[0].id} // history[0] is newest
        hasPrev={history.length > 1 && selectedImageId !== history[history.length - 1].id}
      />

    </div>
  );
};

export default App;