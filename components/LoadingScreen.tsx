import React, { useEffect, useState } from 'react';

// A mix of mystical, technical, and comical cosmic messages
const MASTER_MESSAGES = [
  "Aligning your cosmic coordinates...",
  "Dialing the Milky Way hotline...",
  "Convincing Mercury not to be retrograde...",
  "Polishing the digital crystal ball...",
  "Downloading celestial firmware v7.7.7...",
  "Untangling the complex threads of fate...",
  "Asking the Moon for a quick favor...",
  "Buffering the infinite Void...",
  "Calculating star charts (and tea leaves)...",
  "Syncing with the Akashic Cloud...",
  "Vacuuming stardust off the lens...",
  "Translating whispers from the nebula...",
  "Consulting the Council of Light...",
  "Waking up the Oracle (she needs coffee)...",
  "Gathering sparkles for your aura...",
  "Calibrating the karmic compass...",
  "Loading destiny.exe...",
  "Pinging the Universe for a signal...",
  "Weaving starlight into pixels...",
  "Charging spiritual batteries...",
  "Reading the binary of the gods...",
  "Synthesizing the music of the spheres...",
  "Interpreting the dance of the planets...",
  "Generating good vibes..."
];

const LoadingScreen: React.FC = () => {
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fisher-Yates shuffle to ensure random order without repeats
    const array = [...MASTER_MESSAGES];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setShuffledMessages(array);
  }, []);

  useEffect(() => {
    if (shuffledMessages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledMessages.length);
    }, 2800); // Slightly longer read time per message

    return () => clearInterval(interval);
  }, [shuffledMessages]);

  // Default to first message if empty to prevent flash of unstyled content
  const currentText = shuffledMessages[currentIndex] || "Connecting to the Cosmos...";

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] animate-fade-in relative overflow-hidden">
      
      {/* Central Mystical Loader */}
      <div className="relative w-48 h-48 mb-16">
        {/* Pulsing Aura */}
        <div className="absolute inset-[-20%] bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Spinning Rings - Multi-layered for depth */}
        <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-4 border border-purple-500/40 rounded-full animate-[spin_12s_linear_infinite_reverse] border-dashed"></div>
        <div className="absolute inset-8 border-2 border-indigo-400/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
        
        {/* Center Orb Container */}
        <div className="absolute inset-12 rounded-full shadow-[0_0_80px_rgba(34,211,238,0.4)] animate-float">
            <div className="w-full h-full bg-[#020205] rounded-full flex items-center justify-center relative overflow-hidden border border-white/10">
                 {/* Internal fluid/galaxy animation */}
                 <div className="absolute inset-[-100%] bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 opacity-40 animate-[spin_4s_linear_infinite] blur-xl"></div>
                 
                 {/* Sparkles texture overlay */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-70 animate-pulse"></div>
                 
                 {/* Core light */}
                 <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_20px_10px_rgba(255,255,255,0.8)] animate-ping-slow"></div>
            </div>
        </div>

        {/* Orbiting Particles */}
        <div className="absolute inset-0 animate-[spin_6s_linear_infinite]">
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
        </div>
         <div className="absolute inset-0 animate-[spin_9s_linear_infinite_reverse]">
            <div className="absolute bottom-4 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
        </div>
      </div>

      {/* Text Container with Animation Key */}
      <div className="relative h-28 w-full max-w-2xl text-center px-4 flex flex-col items-center justify-start">
         <div key={currentIndex} className="animate-slide-up-fade">
             <p className="text-xl md:text-3xl font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-tight">
               {currentText}
             </p>
         </div>
      </div>

      {/* Engaging Progress Indicator */}
      <div className="w-64 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-1/2 animate-shimmer-slide"></div>
      </div>

      <style>{`
        @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(10px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up-fade {
            animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes shimmerSlide {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(250%); }
        }
        .animate-shimmer-slide {
            animation: shimmerSlide 2s linear infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        .animate-float {
            animation: float 4s ease-in-out infinite;
        }
         @keyframes pingSlow {
            0% { transform: scale(0.8); opacity: 0.8; }
            50% { transform: scale(1.5); opacity: 0.3; }
            100% { transform: scale(0.8); opacity: 0.8; }
        }
        .animate-ping-slow {
             animation: pingSlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;