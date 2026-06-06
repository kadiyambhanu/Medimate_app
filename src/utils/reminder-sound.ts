let audioContext: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) audioContext = new AudioCtx();
  return audioContext;
}

export function unlockReminderSound() {
  const ctx = getAudioContext();
  if (!ctx || unlocked) return;
  ctx.resume().then(() => {
    unlocked = true;
  });
}

export function playDoseReminderSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  ctx.resume().then(() => {
    const now = ctx.currentTime;
    playTone(880, now, 0.25);
    playTone(660, now + 0.3, 0.25);
    playTone(880, now + 0.6, 0.35);
  });
}
