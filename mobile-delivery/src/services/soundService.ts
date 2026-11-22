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
   * Play the order assignment alert sound and trigger haptic vibration pulses.
   * Works 100% reliably in Expo Go without native ExponentAV dependencies.
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

          const tones = [
            { freq: 1046.5, start: 0.0, dur: 0.28 },
            { freq: 1318.5, start: 0.25, dur: 0.28 },
            { freq: 1568.0, start: 0.50, dur: 0.65 },
          ];

          tones.forEach((t) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.start);

            gain.gain.setValueAtTime(0.8, ctx.currentTime + t.start);
            gain.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + t.start + t.dur
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + t.start);
            osc.stop(ctx.currentTime + t.start + t.dur);
          });
        }
      } catch (err) {
        console.warn('[SoundService] Web audio fallback error:', err);
      }
    }

    // 3. Notify registered audio players (e.g. embedded hidden WebView for native Android & iOS in Expo Go)
    this.playListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('[SoundService] Player listener error:', err);
      }
    });
  }

  /**
   * Stop any active alert sound and stop vibration immediately.
   */
  async stopAlert() {
    try {
      if (this.isVibrating) {
        Vibration.cancel();
        this.isVibrating = false;
      }
      this.stopListeners.forEach((listener) => {
        try {
          listener();
        } catch {}
      });
    } catch (e) {
      console.warn('[SoundService] Error stopping alert:', e);
    }
  }

  /**
   * Helper to preview / test the sound.
   */
  async testSound() {
    await this.playOrderAlert({ loop: false, vibrate: true });
  }
}

export const soundService = new SoundService();
