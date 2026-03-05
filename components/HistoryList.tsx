import React from 'react';
import { SavedReading } from '../types';

interface Props {
  readings: SavedReading[];
  onSelect: (reading: SavedReading) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const HistoryList: React.FC<Props> = ({ readings, onSelect, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0b101a] border border-cyan-500/20 p-6 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col relative shadow-2xl shadow-cyan-900/40">
        
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-indigo-200">
            Cosmic Journal
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar flex-1">
          {readings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p>Your journal is empty. Consult the stars to begin.</p>
            </div>
          ) : (
            readings.map((reading) => (
              <div key={reading.id} className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all duration-300 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                   <img src={`data:image/png;base64,${reading.imageData}`} alt="Thumb" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 cursor-pointer" onClick={() => onSelect(reading)}>
                  <h3 className="text-white font-cinzel text-lg">{reading.userData.focusArea}</h3>
                  <div className="text-xs text-cyan-300 mb-1">{reading.userData.name} • {new Date(reading.timestamp).toLocaleDateString()}</div>
                  <p className="text-sm text-slate-400 line-clamp-1">{reading.readingData.summary}</p>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(reading.id); }}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Entry"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.4);
        }
      `}</style>
    </div>
  );
};

export default HistoryList;