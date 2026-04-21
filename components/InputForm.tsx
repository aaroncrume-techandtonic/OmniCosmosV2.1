import React, { useState, useEffect } from 'react';
import { UserData } from '../types';

interface Props {
  onSubmit: (data: UserData) => void;
  onOpenHistory: () => void;
  isLoading: boolean;
}

const InputForm: React.FC<Props> = ({ onSubmit, onOpenHistory, isLoading }) => {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    focusArea: 'General guidance',
    imageSize: '1K'
  });

  // Load saved form data on mount
  useEffect(() => {
    const saved = localStorage.getItem('omni_cosmos_user_form');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved form data", e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    // Persist to local storage immediately
    localStorage.setItem('omni_cosmos_user_form', JSON.stringify(newData));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit(formData);
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 glass-panel rounded-3xl shadow-[0_0_50px_rgba(30,30,60,0.5)] border border-white/10 relative z-10 animate-fade-in-up">
      {/* Journal Button */}
      <button 
        onClick={onOpenHistory}
        type="button"
        className="absolute top-6 right-6 text-slate-400 hover:text-cyan-300 transition-colors"
        title="My Cosmic Journal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </button>

      <div className="text-center mb-8">
        {/* Glowing Mystical Orb */}
        <div className="relative w-24 h-24 mx-auto mb-6 group cursor-pointer transition-transform hover:scale-105">
            {/* Outer Glow Animation */}
            <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
            <div className="absolute inset-[-4px] bg-gradient-to-tr from-purple-600 via-transparent to-cyan-500 rounded-full opacity-30 animate-spin-slow"></div>
            
            {/* The Orb Body */}
            <div className="relative w-full h-full bg-gradient-to-br from-[#0b1026] via-[#1e1b4b] to-[#0f3040] rounded-full flex items-center justify-center border border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.4)] overflow-hidden">
                
                {/* Sparkles / Texture */}
                <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[spin_20s_linear_infinite]"></div>
                
                {/* Inner Highlight (Gloss) */}
                <div className="absolute top-3 left-5 w-8 h-4 bg-white/10 rounded-full blur-md transform -rotate-45 pointer-events-none"></div>

                {/* Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="relative z-10 w-10 h-10 text-cyan-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
            </div>
        </div>

        <h2 className="text-3xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-indigo-200 mb-2 drop-shadow-md">Cosmic Gateway</h2>
        <p className="text-cyan-200/70 text-sm tracking-wide">Enter your details to align with the stars.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Name</label>
          <input 
            type="text" name="name" required value={formData.name} onChange={handleChange} 
            className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder="Your name"
          />
        </div>

        <div>
            <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                Email <span className="text-slate-500 normal-case tracking-normal">(Optional for daily insights)</span>
            </label>
            <input 
                type="email" name="email" value={formData.email} onChange={handleChange} 
                className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="cosmos@example.com"
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Date of Birth</label>
            <input 
              type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} 
              className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Time (Approx)</label>
            <input 
              type="time" name="birthTime" value={formData.birthTime} onChange={handleChange} 
              className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Place of Birth</label>
          <input 
            type="text" name="birthPlace" required value={formData.birthPlace} onChange={handleChange} 
            className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder="City, Country"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Focus Area</label>
          <select 
            name="focusArea" value={formData.focusArea} onChange={handleChange} 
            className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          >
            <option value="General guidance">General guidance</option>
            <option value="Love & Relationships">Love & Relationships</option>
            <option value="Career & Wealth">Career & Wealth</option>
            <option value="Spiritual Growth">Spiritual Growth</option>
            <option value="Health & Vitality">Health & Vitality</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Image Quality (Nano Banana Pro)</label>
          <select 
            name="imageSize" value={formData.imageSize} onChange={handleChange} 
            className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          >
            <option value="1K">1K (Standard)</option>
            <option value="2K">2K (High Def)</option>
            <option value="4K">4K (Ultra High Def)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-cyan-600/30 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
             <>
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span>Consulting the Stars...</span>
             </>
          ) : (
            <>
              <span className="group-hover:tracking-wider transition-all">Reveal My Destiny</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;