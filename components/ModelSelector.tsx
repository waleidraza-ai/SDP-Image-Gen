import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check } from 'lucide-react';
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input w-full rounded-xl px-4 py-3 flex items-center justify-between group transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedModel.badgeColor} bg-opacity-10`}>
            <Layers size={18} />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
              {selectedModel.name}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              {selectedModel.badge}
            </div>
          </div>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-panel rounded-xl overflow-hidden shadow-2xl animate-scale-in origin-top">
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  model.id === selectedModelId 
                    ? 'bg-purple-600/20 border border-purple-500/30' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-medium ${model.id === selectedModelId ? 'text-white' : 'text-gray-300'}`}>
                      {model.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border mt-1 ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                  </div>
                </div>
                {model.id === selectedModelId && (
                  <Check size={16} className="text-purple-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;