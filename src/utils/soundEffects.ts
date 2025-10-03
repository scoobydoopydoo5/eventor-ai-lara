// Simple sound effect utility using Web Audio API
export const playSound = (frequency: number, duration: number = 0.2, type: OscillatorType = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export const sounds = {
  correct: () => playSound(800, 0.3, 'sine'),
  wrong: () => playSound(200, 0.3, 'square'),
  reveal: () => playSound(600, 0.2, 'triangle'),
  next: () => playSound(400, 0.15, 'sine'),
  gameStart: () => {
    playSound(400, 0.1);
    setTimeout(() => playSound(600, 0.1), 100);
    setTimeout(() => playSound(800, 0.2), 200);
  },
  gameComplete: () => {
    playSound(600, 0.15);
    setTimeout(() => playSound(800, 0.15), 150);
    setTimeout(() => playSound(1000, 0.3), 300);
  }
};
