import React from 'react';

const StarField: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050510]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#1a0b2e]/30 to-[#050510]"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
    </div>
  );
};

export default StarField;
