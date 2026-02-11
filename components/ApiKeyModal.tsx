import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialKey }) => {
  const [key, setKey] = useState(initialKey);

  useEffect(() => {
    setKey(initialKey);
  }, [initialKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-purple-500/20">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-300">
            <Key size={24} />
          </div>
          <h2 className="text-xl font-display font-bold text-white">Gemini API Key</h2>
          <p className="text-sm text-gray-400 text-center mt-2">
            Enter your Google Gemini API key to start generating images.
            Your key is stored locally in your browser.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="glass-input w-full rounded-xl px-4 py-3 placeholder-gray-600 font-mono text-sm"
            />
          </div>

          <button
            onClick={() => onSave(key)}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
          >
            Save API Key
          </button>

          <div className="text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Get your API Key here <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;