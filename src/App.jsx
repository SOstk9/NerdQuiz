import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameBoard from './components/GameBoard';
import AdminPanel from './components/AdminPanel';

function App() {
  const [page, setPage] = useState('start'); // 'start' | 'game' | 'admin'


  const fadeOutAudio = (audio, duration = 2000) => {
    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      const volume = Math.max(0, 1 - currentStep / steps);
      audio.volume = volume;

      if (volume <= 0) {
        clearInterval(fade);
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepTime);
  };

  const handleStart = () => {
    setPage('game');
    const audio = new Audio('public/sounds/brainybounce.mp3');
    audio.play().catch(err => console.error("Audio Playback failed:", err));

    setTimeout(() => {
      fadeOutAudio(audio, 11000);
    }, 16000); // Start fading out after 1 second
  };

  const handleAdmin = () => {
    setPage('admin');
  };

  return (
    <>
      {page === 'start' && <StartScreen onStart={handleStart} onAdmin={handleAdmin} />}
      {page === 'game' && <GameBoard />}
      {page === 'admin' && <AdminPanel />}
    </>
  );
}

export default App;
