import React from 'react';
import FaceScanner from './components/FaceScanner';
import ParticleBackground from './components/ParticleBackground';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-slate-900 text-cyan-400 flex flex-col items-center justify-center p-4 overflow-hidden">
      <ParticleBackground />
      <header className="relative z-10 w-full top-0 left-0 right-0 p-4 md:p-6 bg-slate-900/50 backdrop-blur-sm border-b border-cyan-500/20">
        <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-center text-cyan-400 uppercase">
          Biometric Authentication
        </h1>
        <p className="text-center text-sm text-cyan-600">Project Chimera // Secure Access System v2.7</p>
      </header>

      <main className="relative z-10 w-full max-w-2xl flex-grow flex items-center justify-center">
        <FaceScanner />
      </main>
      
      <footer className="relative z-10 w-full bottom-0 left-0 right-0 p-3 text-center text-xs text-cyan-700">
        <p>&copy; 2025 Labuan Financial Service Authority. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;