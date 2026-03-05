import React, { useEffect, useState, useRef } from 'react';
import { LiveSessionManager } from '../services/liveManager';

interface Props {
  onClose: () => void;
}

const LiveOracle: React.FC<Props> = ({ onClose }) => {
  const [status, setStatus] = useState("Initializing...");
  const [isError, setIsError] = useState(false);
  const managerRef = useRef<LiveSessionManager | null>(null);

  useEffect(() => {
    const manager = new LiveSessionManager(
      (newStatus) => setStatus(newStatus),
      (err) => {
        setStatus(err);
        setIsError(true);
      }
    );
    managerRef.current = manager;
    manager.connect();

    return () => {
      manager.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 p-8 rounded-3xl max-w-lg w-full text-center relative overflow-hidden shadow-2xl shadow-purple-900/50">
        
        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] animate-pulse"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isError ? 'bg-red-500/20' : 'bg-purple-500/20 animate-pulse-slow'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-12 h-12 ${isError ? 'text-red-400' : 'text-purple-300'}`}>
                {isError ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                )}
             </svg>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2 font-cinzel">Cosmic Oracle Live</h3>
          <p className={`text-lg mb-8 ${isError ? 'text-red-400' : 'text-purple-200'}`}>{status}</p>

          {!isError && (
             <div className="flex gap-2 justify-center mb-4">
               <div className="w-1 h-4 bg-purple-400 rounded-full animate-wave" style={{animationDelay: '0s'}}></div>
               <div className="w-1 h-6 bg-purple-400 rounded-full animate-wave" style={{animationDelay: '0.1s'}}></div>
               <div className="w-1 h-8 bg-purple-400 rounded-full animate-wave" style={{animationDelay: '0.2s'}}></div>
               <div className="w-1 h-6 bg-purple-400 rounded-full animate-wave" style={{animationDelay: '0.3s'}}></div>
               <div className="w-1 h-4 bg-purple-400 rounded-full animate-wave" style={{animationDelay: '0.4s'}}></div>
             </div>
          )}

          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Speak naturally. The Oracle listens to your voice and responds with ancient wisdom.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveOracle;
