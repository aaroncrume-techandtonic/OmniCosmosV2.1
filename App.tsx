import React, { useState, useEffect, Component } from 'react';
import StarField from './components/StarField';
import InputForm from './components/InputForm';
import HoroscopeView from './components/HoroscopeView';
import LiveOracle from './components/LiveOracle';
import HistoryList from './components/HistoryList';
import LoadingScreen from './components/LoadingScreen';
import { UserData, HoroscopeReading, AppState, SavedReading } from './types';
import { generateHoroscopeText, generateHoroscopeImage, generateTTS, formatTextForSpeech } from './services/geminiService';
import { saveReadingToLocal, getReadingsFromLocal, deleteReadingFromLocal } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [readingData, setReadingData] = useState<HoroscopeReading | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [readingTimestamp, setReadingTimestamp] = useState<number | undefined>(undefined);
  const [showLive, setShowLive] = useState(false);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [savedReadings, setSavedReadings] = useState<SavedReading[]>([]);

  // Load history on mount
  useEffect(() => {
    setSavedReadings(getReadingsFromLocal());
  }, []);

  const handleFormSubmit = async (data: UserData) => {
    setCurrentUserData(data); // Store user data for saving later
    setAppState(AppState.GENERATING);
    try {
      // Step 1: Generate Text first (needed for TTS)
      const textResult = await generateHoroscopeText(data.name, data.birthDate, data.birthPlace, data.focusArea);
      
      // Step 2: Prepare Text for Speech
      const speechText = formatTextForSpeech(textResult);

      // Step 3: Parallel Execution - Generate Image AND Audio simultaneously
      const [imageResult, audioResult] = await Promise.all([
        generateHoroscopeImage(
          `Abstract mashup of ${data.focusArea}, zodiac, tarot, totem. ${textResult.summary}`, 
          data.name,
          data.imageSize || "1K",
          data.birthDate,
          data.birthTime,
        ),
        generateTTS(speechText)
      ]);

      setReadingData(textResult);
      setImageData(imageResult);
      setAudioData(audioResult);
      setReadingTimestamp(Date.now());
      setAppState(AppState.READING);
    } catch (error) {
      console.error(error);
      alert("The stars are clouded. Please try again. (API Error)");
      setAppState(AppState.INPUT);
    }
  };

  const handleSaveReading = () => {
    if (!readingData || !imageData || !currentUserData) return;
    
    const newReading: SavedReading = {
      id: Date.now().toString(),
      timestamp: readingTimestamp || Date.now(),
      userData: currentUserData,
      readingData: readingData,
      imageData: imageData
    };
    
    const success = saveReadingToLocal(newReading);
    if (success) {
      setSavedReadings(getReadingsFromLocal()); // Refresh list
    } else {
      alert("Cosmic journal full. Please delete old entries.");
    }
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteReadingFromLocal(id);
    setSavedReadings(updated);
  };

  const handleLoadHistory = (reading: SavedReading) => {
    setReadingData(reading.readingData);
    setImageData(reading.imageData);
    setAudioData(null); // No audio in history
    setCurrentUserData(reading.userData);
    setReadingTimestamp(reading.timestamp);
    setShowHistory(false);
    setAppState(AppState.READING);
  };

  const resetApp = () => {
    setAppState(AppState.INPUT);
    setReadingData(null);
    setImageData(null);
    setAudioData(null);
    setCurrentUserData(null);
    setReadingTimestamp(undefined);
  };

  return (
    <div className="min-h-screen text-slate-200 relative overflow-x-hidden">
      <StarField />

      <main className="container mx-auto px-4 py-8 relative z-10 flex flex-col items-center justify-center min-h-screen">
        
        {/* Logo/Header - Only show large on Input screen */}
        {appState === AppState.INPUT && (
           <header className="text-center mb-12 animate-fade-in">
             <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-100 to-indigo-500 mb-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
               Omni-Cosmos
             </h1>
             <p className="text-xl text-cyan-200/80 font-light tracking-widest uppercase">
               Universal Horoscope & Guide
             </p>
           </header>
        )}

        {appState === AppState.INPUT && (
          <InputForm 
            onSubmit={handleFormSubmit} 
            isLoading={false} 
            onOpenHistory={() => setShowHistory(true)}
          />
        )}

        {appState === AppState.GENERATING && (
          <LoadingScreen />
        )}

        {appState === AppState.READING && readingData && imageData && (
          <HoroscopeView 
            data={readingData} 
            imageData={imageData} 
            preloadedAudio={audioData} // May be null if loaded from history
            timestamp={readingTimestamp}
            onLiveClick={() => setShowLive(true)}
            onReset={resetApp}
            onSave={handleSaveReading}
          />
        )}
      </main>

      {showLive && (
        <LiveOracle onClose={() => setShowLive(false)} />
      )}

      {showHistory && (
        <HistoryList 
          readings={savedReadings}
          onSelect={handleLoadHistory}
          onDelete={handleDeleteHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
        .animate-wave {
          animation: wave 1s infinite ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

interface ErrorBoundaryState { hasError: boolean; error: string }
class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error: String(error) };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('OmniCosmos render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#050510', color: '#e2e8f0', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'serif', margin: 0 }}>Omni-Cosmos</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>An unexpected error occurred. Please refresh the page.</p>
          <details style={{ color: '#64748b', fontSize: '0.75rem', maxWidth: '480px', wordBreak: 'break-all' }}>
            <summary>Error details</summary>
            <pre style={{ textAlign: 'left', marginTop: '0.5rem' }}>{this.state.error}</pre>
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem', background: '#0e7490', color: '#fff', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppWithBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithBoundary;