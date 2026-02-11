import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check, Zap, Star } from 'lucide-react';
import { ModelId, ModelOption } from '../types';
import { MODELS } from '../constants';

interface ModelSelectorProps {
  selectedModelId: ModelId;
  onSelect: (id: ModelId) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModelId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to determine icon based on model type
  const getModelIcon = (id: ModelId) => {
      if (id.includes('flash')) return <Zap size={16} />;
      return <Star size={16} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-input w-full rounded-xl px-4 py-3 flex items-center justify-between group transition-all duration-300 ${isOpen ? 'ring-2 ring-purple-500/20 border-purple-500/30' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedModel.badgeColor} bg-opacity-20 flex items-center justify-center`}>
            <Layers size={18} />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              {selectedModel.name}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
              {selectedModel.badge}
            </div>
          </div>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-panel rounded-xl overflow-hidden shadow-2xl animate-scale-in origin-top ring-1 ring-white/10">
          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            {MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${
                    isSelected
                      ? 'bg-purple-600/20 border border-purple-500/30' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md transition-colors ${isSelected ? 'text-purple-300' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        {getModelIcon(model.id)}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                        {model.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-purple-500 rounded-full p-0.5">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;