// Generates a pleasant double-beep notification sound using Web Audio API
// No external audio file needed
export function playNewOrderSound() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    function beep(startTime: number, frequency: number, duration: number, volume: number) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    }

    const now = ctx.currentTime;
    // Double beep: high-pitched, pleasant
    beep(now, 880, 0.15, 0.4);
    beep(now + 0.2, 1100, 0.15, 0.4);
  } catch {
    // Silently fail if audio isn't supported
  }
}
