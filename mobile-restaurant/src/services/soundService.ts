import { Vibration, Platform } from 'react-native';

type PlayCallback = () => void;
type StopCallback = () => void;

class SoundService {
  private playListeners: Set<PlayCallback> = new Set();
  private stopListeners: Set<StopCallback> = new Set();
  private isVibrating: boolean = false;

  /**
   * Register a WebView or Web audio player trigger.
   */
  registerPlayer(callbacks: { onPlay: PlayCallback; onStop: StopCallback }) {
    this.playListeners.add(callbacks.onPlay);
    this.stopListeners.add(callbacks.onStop);
    return () => {
      this.playListeners.delete(callbacks.onPlay);
      this.stopListeners.delete(callbacks.onStop);
    };
  }

  /**
   * Play the restaurant kitchen alert sound and trigger haptic vibration pulses.
   * Reliable in Expo Go without native ExponentAV dependencies.
   */
  async playOrderAlert(options: { loop?: boolean; vibrate?: boolean } = {}) {
    const { loop = false, vibrate = true } = options;

    // 1. Device Haptic Vibration
    if (vibrate) {
      try {
        Vibration.vibrate([0, 500, 200, 500, 200, 500], loop);
        this.isVibrating = true;
      } catch (e) {
        console.warn('[SoundService] Vibration error:', e);
      }
    }

    // 2. Direct Web Audio API for Web browsers
    if (Platform.OS === 'web') {
      try {
        const AudioContextClass =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => {});
          }
          const now = ctx.currentTime;
          // Dual frequency bell chime
          [880, 1100, 1320].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.2, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.35);
          });
          return;
        }
      } catch (e) {
        console.warn('[SoundService] Web audio error:', e);
      }
    }

    // 3. Native Android/iOS: trigger registered WebView audio player
    this.playListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.warn('[SoundService] Player trigger error:', e);
      }
    });
  }

  stopAlert() {
    if (this.isVibrating) {
      Vibration.cancel();
      this.isVibrating = false;
    }
    this.stopListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.warn('[SoundService] Stop trigger error:', e);
      }
    });
  }
}

export const soundService = new SoundService();
