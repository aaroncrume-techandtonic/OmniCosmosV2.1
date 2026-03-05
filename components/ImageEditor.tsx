import React, { useState } from 'react';
import { editHoroscopeImage } from '../services/geminiService';

interface Props {
  initialImage: string; // base64
  onImageUpdate: (newImage: string) => void;
}

const ImageEditor: React.FC<Props> = ({ initialImage, onImageUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setIsEditing(true);
    setError('');
    try {
      const newImage = await editHoroscopeImage(initialImage, prompt);
      onImageUpdate(newImage);
      setPrompt('');
    } catch (err) {
      setError("Failed to edit image. The cosmic winds are turbulent.");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-white/10">
      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
           <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        Refine Vision
      </h4>
      <p className="text-sm text-slate-400 mb-3">
        Use Nano Banana to transform the image. E.g. "Add a retro filter", "Make it cyberpunk", "Add golden aura".
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your change..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
        />
        <button
          onClick={handleEdit}
          disabled={isEditing || !prompt.trim()}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isEditing ? 'Weaving...' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default ImageEditor;
