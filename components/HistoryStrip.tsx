import React from 'react';
import { Trash2, X } from 'lucide-react';
import { GeneratedImage } from '../types';

interface HistoryStripProps {
  history: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

const HistoryStrip: React.FC<HistoryStripProps> = ({ history, onSelect, onClear, onDelete }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 glass-panel rounded-2xl p-5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
          <span className="bg-white/10 p-1 rounded">🕒</span> Recent Creations
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
        >
          <Trash2 size={12} /> Clear All
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
        {history.map((img) => (
          <div key={img.id} className="relative group flex-shrink-0 snap-start">
             <button
               onClick={() => onSelect(img)}
               className="w-28 h-28 rounded-xl overflow-hidden border border-white/10 relative focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30"
             >
               <img 
                 src={img.url} 
                 alt={img.prompt} 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
             </button>
             
             {/* Delete Button for Individual Image */}
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(img.id);
               }}
               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-lg hover:bg-red-600 z-10"
               title="Remove from history"
             >
               <X size={12} />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryStrip;