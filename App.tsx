import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Settings, Image as ImageIcon, Sparkles, 
  Download, Copy, Maximize2, Zap, Dices, RotateCw, Key,
  Sliders, RefreshCcw
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
  // Fix: Remove manual API key state management as per guidelines
  
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
    // Fix: Remove manual API key loading from localStorage
    
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
    // Fix: Use window.aistudio for API key selection
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
      // Fix: Call service without apiKey argument
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
  }, [settings, isGenerating]); // Dependencies for closure

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
      <nav className="sticky top-0 z-40 w-full glass-panel border-b-0 border-t-0 border-x-0 rounded-b-2xl px-6 py-4 mb-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:rotate-12 transition-transform duration-300">
              <Palette className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                PixelForge AI
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Create stunning AI images in seconds</p>
            </div>
          </div>
          
          <button 
            onClick={async () => {
               if ((window as any).aistudio) {
                   await (window as any).aistudio.openSelectKey();
               }
            }}
            className="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-gray-400 hover:text-white"
            title="API Settings"
          >
            <Key size={16} />
            <span className="text-sm font-medium hidden sm:block">
              Select API Key
            </span>
            <span className="text-sm font-medium sm:hidden">
              Key
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Controls */}
          <section className="w-full lg:w-[400px] flex-shrink-0 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-8 animate-slide-up duration-500">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300">
                  <Zap size={18} />
                  <h2 className="font-display font-bold text-lg">Image Settings</h2>
                </div>
                <button 
                  onClick={handleSurpriseMe}
                  className="glass-button flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1.5 rounded-full"
                >
                  <Dices size={14} /> Surprise Me
                </button>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">Prompt</label>
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
                    className="glass-input w-full rounded-2xl p-4 text-sm placeholder-gray-500 resize-y min-h-[140px]"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-600 font-mono flex items-center gap-2">
                    <span className="opacity-50 hidden sm:inline">⌘+Enter to generate</span>
                    <span>{settings.prompt.length}/1000</span>
                  </div>
                </div>
              </div>

              {/* Model Selector - Custom Component */}
              <div className="space-y-2 z-20 relative">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">Model</label>
                <ModelSelector 
                  selectedModelId={settings.model} 
                  onSelect={(id) => setSettings({...settings, model: id})} 
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2 z-10">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map((ratio) => {
                    const isSelected = settings.aspectRatio === ratio.id;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setSettings({...settings, aspectRatio: ratio.id})}
                        className={`
                          flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all duration-300
                          ${isSelected 
                            ? 'glass-button-selected transform scale-105' 
                            : 'glass-button hover:bg-white/5'}
                        `}
                      >
                        <div 
                          className={`border-2 ${isSelected ? 'border-purple-300' : 'border-gray-500'} rounded-sm opacity-80 transition-colors`}
                          style={{
                            width: '18px',
                            height: `${(18 / ratio.width) * ratio.height}px`
                          }}
                        />
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                          {ratio.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image Count */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">Number of Images</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((count) => {
                    const isSelected = settings.imageCount === count;
                    return (
                      <button
                        key={count}
                        onClick={() => setSettings({...settings, imageCount: count})}
                        className={`
                          py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                          ${isSelected 
                            ? 'glass-button-selected shadow-lg' 
                            : 'glass-button text-gray-400'}
                        `}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Negative Prompt */}
              <div className="border-t border-white/5 pt-4">
                <button 
                  onClick={() => setIsExpandedNegative(!isExpandedNegative)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-white transition-colors w-full"
                >
                  <span className={`transition-transform duration-300 ${isExpandedNegative ? 'rotate-90 text-purple-400' : ''}`}>▶</span>
                  <span className={isExpandedNegative ? 'text-purple-400' : ''}>Negative Prompt</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpandedNegative ? 'max-h-32 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <textarea
                    value={settings.negativePrompt}
                    onChange={(e) => setSettings({...settings, negativePrompt: e.target.value})}
                    placeholder="Things to avoid... e.g. blurry, distorted, low quality"
                    className="glass-input w-full rounded-xl p-3 text-xs placeholder-gray-500 resize-none h-24 mt-2"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="border-t border-white/5 pt-4">
                <button 
                  onClick={() => setIsExpandedAdvanced(!isExpandedAdvanced)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-white transition-colors w-full"
                >
                  <span className={`transition-transform duration-300 ${isExpandedAdvanced ? 'rotate-90 text-purple-400' : ''}`}>▶</span>
                  <span className={isExpandedAdvanced ? 'text-purple-400' : ''}>Advanced Settings</span>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpandedAdvanced ? 'max-h-64 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                   <div className="space-y-5 p-1">
                      {/* Seed */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-400">Seed (for reproducibility)</label>
                            <button 
                              onClick={() => setSettings({...settings, seed: undefined})}
                              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              title="Randomize seed"
                            >
                              <RefreshCcw size={10} /> Randomize
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
                             placeholder="Random"
                             className="glass-input w-full rounded-xl px-4 py-2 text-sm placeholder-gray-600 font-mono"
                           />
                           {settings.seed !== undefined && (
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-green-400 flex items-center gap-1 bg-green-900/30 px-2 py-0.5 rounded-full border border-green-500/20">
                               Fixed
                             </div>
                           )}
                         </div>
                      </div>

                      {/* Guidance Scale (Imagen Only) */}
                      {isImagenModel && (
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <label className="text-xs text-gray-400">Guidance Scale</label>
                              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
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
                             className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                           />
                           <div className="flex justify-between text-[10px] text-gray-500 px-1">
                             <span>Freedom</span>
                             <span>Strict</span>
                           </div>
                        </div>
                      )}
                      
                      {!isImagenModel && (
                         <div className="text-[10px] text-gray-500 italic p-2 bg-white/5 rounded-lg border border-white/5">
                           Guidance scale is not customizable for this model.
                         </div>
                      )}
                   </div>
                </div>
              </div>

            </div>
          </section>

          {/* Right Column: Output */}
          <section className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Generate Button MOVED HERE */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`
                  w-full relative overflow-hidden group rounded-2xl p-[1px]
                  ${!isGenerating ? 'hover:scale-[1.01] active:scale-[0.99]' : 'cursor-wait'}
                  transition-all duration-300 shadow-xl shadow-purple-900/20
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 ${isGenerating ? 'animate-shimmer' : 'opacity-70 group-hover:opacity-100'}`} style={{ backgroundSize: '200% 100%' }} />
                <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl h-full px-6 py-4 flex items-center justify-center gap-3">
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-white font-bold tracking-wide text-sm">{LOADING_MESSAGES[loadingMsgIndex]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="text-yellow-300 group-hover:rotate-12 transition-transform" />
                      <span className="text-white font-bold tracking-wide text-lg">Generate Image</span>
                    </>
                  )}
                </div>
              </button>
            
            <div className="flex items-center gap-2 text-purple-300 mb-2">
               <ImageIcon size={18} />
               <h2 className="font-display font-bold text-lg">Generated Results</h2>
            </div>

            {/* Main Display Area */}
            <div className={`
              glass-panel
              w-full min-h-[400px] lg:min-h-[600px] rounded-3xl p-6 relative flex flex-col transition-all duration-500 border-opacity-50
              ${currentImages.length === 0 && !isGenerating ? 'justify-center items-center' : ''}
            `}>
              
              {/* Empty State */}
              {currentImages.length === 0 && !isGenerating && (
                <div className="text-center space-y-4 max-w-xs animate-float">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 group">
                    <Sparkles size={40} className="text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-display font-medium text-white/80">Ready to Create</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Enter your prompt on the left.
                    <br/>
                    <span className="text-xs text-gray-600">Tip: Use ⌘+Enter to generate quickly</span>
                  </p>
                </div>
              )}

              {/* Loading Skeleton */}
              {isGenerating && (
                <div className={`grid gap-6 w-full ${settings.imageCount === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                   {Array.from({ length: settings.imageCount }).map((_, i) => (
                     <div 
                        key={i} 
                        className="rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden shadow-xl"
                        style={getAspectRatioStyle(settings.aspectRatio)}
                      >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />
                       
                       {/* Center loading indicator */}
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin" />
                          <span className="text-xs text-white/40 font-mono animate-pulse text-center px-4">
                            {LOADING_MESSAGES[loadingMsgIndex]}
                          </span>
                       </div>
                       
                       {/* Abstract shapes to simulate content loading */}
                       <div className="absolute bottom-6 left-6 right-6 h-2 bg-white/5 rounded-full" />
                       <div className="absolute bottom-10 left-6 w-1/2 h-2 bg-white/5 rounded-full" />
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
                      className="group relative rounded-2xl overflow-hidden glass-card shadow-2xl animate-scale-in"
                      style={getAspectRatioStyle(img.aspectRatio)}
                    >
                      <img 
                        src={img.url} 
                        alt={img.prompt} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                         <div className="flex gap-3 justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                           <button 
                             onClick={() => setSelectedImageId(img.id)}
                             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 tooltip-trigger"
                             title="View Fullscreen"
                           >
                             <Maximize2 size={20} />
                           </button>
                           <button 
                             onClick={() => handleRemix(img)}
                             className="p-3 bg-purple-500/20 hover:bg-purple-500/40 backdrop-blur-md rounded-full text-purple-200 transition-all hover:scale-110"
                             title="Remix (Use Settings)"
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
                             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110"
                             title="Download"
                           >
                             <Download size={20} />
                           </button>
                           <button 
                             onClick={() => copyToClipboard(img.prompt)}
                             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110"
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
         <p className="text-gray-700 text-xs mt-2 font-mono">v1.2.0 • PixelForge</p>
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