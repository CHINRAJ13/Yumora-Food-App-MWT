import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { soundService } from '../services/soundService';

const WebViewComponent = WebView as any;

const audioHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; background: transparent;">
    <script>
      let audioCtx = null;
      function initAudio() {
        if (!audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            audioCtx = new AudioContext();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }

      function playKitchenBell() {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        // Two-tone bright kitchen bell chime
        [784, 1046, 1318].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.3, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.45);
        });
      }

      window.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'play') {
            playKitchenBell();
          }
        } catch(e) {}
      });
      document.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'play') {
            playKitchenBell();
          }
        } catch(e) {}
      });
    </script>
  </body>
</html>
`;

export default function AudioAlertBridge() {
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    const unregister = soundService.registerPlayer({
      onPlay: () => {
        webViewRef.current?.postMessage(JSON.stringify({ action: 'play' }));
      },
      onStop: () => {
        webViewRef.current?.postMessage(JSON.stringify({ action: 'stop' }));
      },
    });
    return unregister;
  }, []);

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebViewComponent
        ref={webViewRef}
        source={{ html: audioHtml }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        style={styles.hiddenWebView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden',
    bottom: -100,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
});
