import React, { useState, useEffect, useRef } from 'react';
import { HoroscopeReading } from '../types';
import { pcmToWav, base64ToUint8Array } from '../services/audioUtils';
import ImageEditor from './ImageEditor';
import { formatTextForSpeech, generateHoroscopeVideo } from '../services/geminiService';
import { AmbientService, AmbientType } from '../services/ambientService';

// --- Scroll Animation Component ---
const FadeInSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    }, { threshold: 0.15 }); // Trigger when 15% visible
    
    const ref = domRef.current;
    if (ref) observer.observe(ref);
    
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
};

interface Props {
  data: HoroscopeReading;
  imageData: string; // base64
  preloadedAudio: Uint8Array | null;
  audioUrl?: string; // Optional URL for streaming/direct playback
  timestamp?: number;
  onLiveClick: () => void;
  onReset: () => void;
  onSave?: () => void;
}

const HoroscopeView: React.FC<Props> = ({ 
  data, 
  imageData: initialImage, 
  preloadedAudio, 
  audioUrl: externalAudioUrl,
  timestamp, 
  onLiveClick, 
  onReset, 
  onSave 
}) => {
  const [currentImage, setCurrentImage] = useState(initialImage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [ambientMode, setAmbientMode] = useState<AmbientType>('winds'); 
  const [ambientVolume, setAmbientVolume] = useState(0.2);
  const [narrationVolume, setNarrationVolume] = useState(1.0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientServiceRef = useRef<AmbientService | null>(null);

  // Initialize Audio (Voice)
  useEffect(() => {
    let src = externalAudioUrl;
    
    if (!src && preloadedAudio) {
      try {
        const wavBlob = pcmToWav(preloadedAudio, 24000); 
        src = URL.createObjectURL(wavBlob);
      } catch (e) {
        console.error("Audio Conversion Error", e);
      }
    }

    if (!src) return;

    const audio = new Audio(src);
    audio.playbackRate = 1.0; 
    // Set initial volume based on state
    audio.volume = narrationVolume;
    
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => {
      setIsPlaying(true);
      setAutoPlayBlocked(false);
    };
    
    audioRef.current = audio;
    
    // Attempt Auto-play
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Auto-play prevented (Voice):", error);
        setAutoPlayBlocked(true);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke Object URL if we created one
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedAudio, externalAudioUrl]); // Exclude narrationVolume to prevent restart on volume change

  // Handle Narration Volume Change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = narrationVolume;
    }
  }, [narrationVolume]);

  // Initialize Ambient Service
  useEffect(() => {
    ambientServiceRef.current = new AmbientService();
    ambientServiceRef.current.play(ambientMode);
    ambientServiceRef.current.setVolume(ambientVolume);

    return () => {
      if (ambientServiceRef.current) {
        ambientServiceRef.current.cleanup();
      }
    };
  }, []);

  // Update Ambient Mode
  useEffect(() => {
    if (ambientServiceRef.current) {
      ambientServiceRef.current.play(ambientMode);
    }
  }, [ambientMode]);

  // Update Ambient Volume
  useEffect(() => {
    if (ambientServiceRef.current) {
      ambientServiceRef.current.setVolume(ambientVolume);
    }
  }, [ambientVolume]);

  const handlePlayPause = async () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        // Resume ambient if not in void mode
        if (ambientServiceRef.current && ambientMode !== 'void') {
          ambientServiceRef.current.play(ambientMode);
        }
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    // Stop ambient sound too
    if (ambientServiceRef.current) {
      ambientServiceRef.current.stop();
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }
  };

  // --- Download Handlers ---
  const downloadAudio = () => {
    if (audioRef.current && audioRef.current.src) {
        const a = document.createElement('a');
        a.href = audioRef.current.src;
        a.download = 'omni-cosmos-reading.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${currentImage}`;
    a.download = 'omni-cosmos-art.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadText = () => {
    const textContent = formatTextForSpeech(data);
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omni-cosmos-reading.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    // Construct a comprehensive share text
    let fullText = `✨ Omni-Cosmos Reading ✨\n\n"${data.summary}"\n\n`;
    
    data.sections.forEach(section => {
      fullText += `[ ${section.icon} ${section.title} ]\n${section.content}\n\n`;
    });

    fullText += `🔮 Lucky Numbers: ${data.luckyNumbers.join(' • ')}\n`;
    fullText += `🎨 Power Colors: ${data.luckyColors.join(', ')}\n\n`;
    fullText += `~ Generated by Omni-Cosmos`;

    const shareData: ShareData = {
      title: 'Omni-Cosmos Reading',
      text: fullText,
    };

    if (navigator.share) {
      try {
        // Attempt to convert current image to file for sharing
        let files: File[] = [];
        try {
          const imageBytes = base64ToUint8Array(currentImage);
          const blob = new Blob([imageBytes as any], { type: 'image/png' });
          const file = new File([blob], 'omni-cosmos-art.png', { type: 'image/png' });
          files = [file];
        } catch (e) {
          console.warn("Could not prepare image for sharing", e);
        }

        const shareDataWithFiles = { ...shareData, files };
        
        // Check if browser supports sharing files
        if (files.length > 0 && navigator.canShare && navigator.canShare(shareDataWithFiles)) {
           await navigator.share(shareDataWithFiles);
        } else {
           // Fallback to text-only share
           await navigator.share(shareData);
        }
      } catch (err) {
        console.log('Error sharing', err);
        // Retry with text only if file sharing caused the error (and wasn't just a cancellation)
        try {
            await navigator.share(shareData);
        } catch(e) {
            console.log('Fallback text share failed', e);
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.text || "");
      alert("Full reading copied to clipboard!");
    }
  };

  const handleSectionShare = async (title: string, content: string) => {
    const shareData = {
      title: `Omni-Cosmos: ${title}`,
      text: `${title}\n\n${content}\n\n~ Omni-Cosmos Reading`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing section', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert(`${title} insight copied to clipboard!`);
    }
  };

  const handleManualSave = () => {
    if (onSave) {
      onSave();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleAnimate = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    try {
      const url = await generateHoroscopeVideo(currentImage, data.summary);
      setVideoUrl(url);
    } catch (err) {
      console.error("Video generation failed", err);
      alert("The cosmic threads are tangled. Video generation failed.");
    } finally {
      setIsAnimating(false);
    }
  };

  const getCardStyle = (index: number) => {
    const gradients = [
      "from-slate-900/60 to-indigo-900/40 border-indigo-500/20",
      "from-slate-900/60 to-cyan-900/40 border-cyan-500/20",
      "from-slate-900/60 to-teal-900/40 border-teal-500/20",
      "from-slate-900/60 to-blue-900/40 border-blue-500/20",
      "from-slate-900/60 to-violet-900/40 border-violet-500/20",
    ];
    return gradients[index % gradients.length];
  };

  const hasAudioSource = preloadedAudio || externalAudioUrl;

  return (
    <div className="relative min-h-screen w-full font-quicksand text-slate-100 overflow-hidden">
      
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <img 
          src={`data:image/png;base64,${currentImage}`} 
          alt="Cosmic Background" 
          className="w-full h-full object-cover opacity-20 blur-md scale-105 transition-all duration-[3s]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#0b101a]/90 to-[#050510]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-pulse"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10 pb-32">
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-center backdrop-blur-md bg-white/5 p-4 rounded-full border border-white/10 sticky top-4 z-50 shadow-2xl">
           <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors text-sm font-bold uppercase tracking-wider text-cyan-200">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
             </svg>
             <span>Restart</span>
           </button>

           <div className="hidden md:flex flex-col items-center justify-center">
             <h1 className="text-xl font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-indigo-200 leading-none">
               Omni-Cosmos Reading
             </h1>
             {timestamp && (
                <span className="text-[10px] text-cyan-400/50 uppercase tracking-widest mt-1 font-semibold">
                  {new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
             )}
           </div>

           <div className="flex gap-2">
            {onSave && (
              <button 
                onClick={handleManualSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isSaved ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-white/5 hover:bg-white/10 text-cyan-200 border border-white/10'}`}
              >
                {isSaved ? (
                  <>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                     </svg>
                     <span>Saved</span>
                  </>
                ) : (
                  <>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                     </svg>
                     <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            )}

            <button onClick={onLiveClick} className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-transform hover:scale-105 text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
               </svg>
               <span className="hidden sm:inline">Live Oracle</span>
            </button>
           </div>
        </div>

        {/* Audio Player Card & Downloads */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-lg font-cinzel text-cyan-100">Cosmic Transmission</h2>
                 {autoPlayBlocked && (
                   <button onClick={handlePlayPause} className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 animate-pulse hover:bg-cyan-500/40">
                     Click to Play
                   </button>
                 )}
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                 <p className="text-xs text-slate-400">
                   {hasAudioSource ? "Audio ready. Listen to the stars." : "Audio recording not available for this session."}
                 </p>
                 
                 {/* Narration Volume Control */}
                 {hasAudioSource && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-indigo-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                            <span>Voice:</span>
                            <div className="flex items-center gap-2 w-20 group" title="Narration Volume">
                                <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden relative cursor-pointer">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05" 
                                        value={narrationVolume}
                                        onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div 
                                        className="h-full bg-indigo-400 rounded-full transition-all" 
                                        style={{width: `${narrationVolume * 100}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* Ambient Selector & Volume */}
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-cyan-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                        <span>Ambience:</span>
                        <select 
                        value={ambientMode} 
                        onChange={(e) => setAmbientMode(e.target.value as AmbientType)}
                        className="bg-transparent text-cyan-200 focus:outline-none cursor-pointer hover:text-white"
                        >
                        <option value="void">Silent Void</option>
                        <option value="winds">Cosmic Winds</option>
                        <option value="chimes">Distant Chimes</option>
                        </select>
                    </div>

                    {/* Ambient Volume Slider */}
                    {ambientMode !== 'void' && (
                        <div className="flex items-center gap-2 w-20 group" title="Ambience Volume">
                           <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden relative cursor-pointer">
                              <input 
                                type="range" 
                                min="0" 
                                max="0.5" 
                                step="0.01" 
                                value={ambientVolume}
                                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                              />
                              <div 
                                className="h-full bg-cyan-500 rounded-full transition-all" 
                                style={{width: `${(ambientVolume / 0.5) * 100}%`}}
                              ></div>
                           </div>
                        </div>
                    )}
                 </div>
              </div>

              
              {/* Downloads Row */}
              <div className="flex gap-4 mt-3 justify-center md:justify-start">
                  {hasAudioSource && (
                    <button onClick={downloadAudio} className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Audio
                    </button>
                  )}
                  <button onClick={downloadImage} className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Art
                  </button>
                  <button onClick={downloadText} className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Full Text
                  </button>
              </div>
           </div>
           
           <div className={`flex items-center gap-4 ${!hasAudioSource ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
               <button onClick={handleShare} className="p-3 rounded-full hover:bg-white/10 text-slate-300 transition-colors pointer-events-auto" title="Share Reading">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
               </button>

               <button onClick={downloadAudio} className="p-3 rounded-full hover:bg-white/10 text-slate-300 transition-colors" title="Download Audio">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
               </button>

               <button onClick={handleRewind} className="p-3 rounded-full hover:bg-white/10 text-slate-300 transition-colors" title="-15s">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3" />
                  </svg>
               </button>

               <button 
                 onClick={handlePlayPause} 
                 className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/40 hover:scale-105 transition-transform"
               >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  )}
               </button>

               <button onClick={handleStop} className="p-3 rounded-full hover:bg-white/10 text-slate-300 transition-colors" title="Stop">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                  </svg>
               </button>
           </div>
        </div>

        {/* Visualization & Edit Toggle */}
        <div className="group relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-video md:aspect-[21/9]">
           {videoUrl ? (
             <video 
               src={videoUrl} 
               autoPlay 
               loop 
               muted 
               playsInline 
               className="w-full h-full object-cover"
             />
           ) : (
             <img 
                src={`data:image/png;base64,${currentImage}`} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 cursor-zoom-in"
                onClick={() => setIsFullScreen(true)}
             />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
           <div className="absolute bottom-4 right-4 pointer-events-auto flex gap-2">
              <button 
                onClick={handleAnimate}
                disabled={isAnimating}
                className="bg-indigo-600/50 hover:bg-indigo-600/70 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isAnimating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Animating...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                    <span>Veo Animate</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowEditor(!showEditor)}
                className="bg-black/50 hover:bg-black/70 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white flex items-center gap-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                {showEditor ? "Close Editor" : "Refine Vision"}
              </button>
           </div>
           {showEditor && (
             <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in z-20">
                <div className="w-full max-w-lg">
                   <ImageEditor initialImage={currentImage} onImageUpdate={(img) => {
                     setCurrentImage(img);
                     setShowEditor(false);
                   }} />
                </div>
             </div>
           )}
        </div>

        {/* Integrated Reading Flow */}
        <div className="space-y-16">
           
           {/* Summary Section */}
           <FadeInSection>
            <section className="relative">
                <div className="absolute -left-4 -top-6 text-8xl text-cyan-500/10 font-serif z-0 select-none">“</div>
                <div className="relative z-10 backdrop-blur-md bg-white/5 border border-cyan-500/20 p-8 rounded-[2rem]">
                    <p className="text-xl md:text-2xl font-light leading-relaxed text-cyan-100 italic">
                    {data.summary}
                    </p>
                    
                    <div className="mt-8 border-t border-white/5 pt-6 flex flex-col items-center gap-6">
                        <div className="flex flex-wrap gap-6 items-center justify-center">
                            <div className="flex gap-2 items-center px-4 py-2 bg-black/30 rounded-full border border-white/5">
                            <span className="text-xs uppercase text-slate-400">Lucky Numbers</span>
                            <span className="font-cinzel font-bold text-white">{data.luckyNumbers.join(" • ")}</span>
                            </div>
                            <div className="flex gap-2 items-center px-4 py-2 bg-black/30 rounded-full border border-white/5">
                            <span className="text-xs uppercase text-slate-400">Colors</span>
                            <div className="flex gap-1">
                                {data.luckyColors.map((c, i) => (
                                <div key={i} className="w-4 h-4 rounded-full" style={{backgroundColor: c.toLowerCase()}}></div>
                                ))}
                            </div>
                            </div>
                        </div>

                        {/* Prominent Share Button */}
                        <button 
                            onClick={handleShare}
                            className="group relative px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                           <div className="relative flex items-center gap-3">
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                               </svg>
                               <span>Share Full Reading</span>
                           </div>
                        </button>
                    </div>
                </div>
            </section>
           </FadeInSection>

           {/* Aspects Timeline with Graphic Backgrounds */}
           <div className="relative border-l-2 border-slate-700/50 ml-4 md:ml-0 space-y-12">
              {data.sections.map((section, idx) => (
                <FadeInSection key={idx}>
                    <section className="relative pl-8 md:pl-12">
                       {/* Timeline Node */}
                       <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-900 border-2 border-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                       
                       {/* Header */}
                       <div className="flex items-center gap-4 mb-4">
                          <span className="text-4xl filter drop-shadow-lg">{section.icon}</span>
                          <h3 className="text-3xl font-cinzel text-white tracking-wide">{section.title}</h3>
                       </div>
                       
                       {/* Graphic Card */}
                       <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getCardStyle(idx)} border backdrop-blur-xl p-6 md:p-8 hover:scale-[1.01] transition-transform duration-500 group`}>
                          {/* Share Button - Absolute Top Right */}
                          <button 
                            onClick={() => handleSectionShare(section.title, section.content)}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                            title="Share this insight"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                             </svg>
                          </button>

                          {/* Abstract Graphic Element */}
                          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                             {/* Dynamic Background Icon based on index */}
                             <svg width="150" height="150" viewBox="0 0 100 100" fill="currentColor" className="transform rotate-12">
                               {idx % 3 === 0 && <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" />}
                               {idx % 3 === 1 && <rect x="20" y="20" width="60" height="60" stroke="currentColor" strokeWidth="1" fill="none" transform="rotate(45 50 50)" />}
                               {idx % 3 === 2 && <path d="M50 10 L90 80 L10 80 Z" stroke="currentColor" strokeWidth="1" fill="none" />}
                             </svg>
                          </div>

                          <p className="relative z-10 text-lg text-slate-100 leading-8 font-light tracking-wide shadow-black drop-shadow-md">
                            {section.content}
                          </p>
                       </div>
                    </section>
                </FadeInSection>
              ))}
           </div>

           <div className="text-center pt-12 pb-8">
              <p className="font-cinzel text-slate-500 text-sm">~ The Universe has spoken ~</p>
           </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setIsFullScreen(false)}
        >
           <button 
              onClick={() => setIsFullScreen(false)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
           <img 
             src={`data:image/png;base64,${currentImage}`}
             className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_100px_rgba(100,200,255,0.1)] scale-100 animate-fade-in-up"
             onClick={(e) => e.stopPropagation()} 
           />
        </div>
      )}
    </div>
  );
};

export default HoroscopeView;