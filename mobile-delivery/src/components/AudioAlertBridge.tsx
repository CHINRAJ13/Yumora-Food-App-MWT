import React, { useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { soundService } from '../services/soundService';

const WebViewComponent: any = WebView;

const AUDIO_SYNTH_HTML = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script>
  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playAlertChime() {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      
      var tones = [
        { freq: 1046.5, start: 0.0, dur: 0.28 },
        { freq: 1318.5, start: 0.25, dur: 0.28 },
        { freq: 1568.0, start: 0.50, dur: 0.65 }
      ];

      tones.forEach(function(t) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.start);
        gain.gain.setValueAtTime(0.85, ctx.currentTime + t.start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t.start + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t.start);
        osc.stop(ctx.currentTime + t.start + t.dur);
      });
    } catch(err) {
      console.log('Synth error: ' + err);
    }
  }

  window.playAlertChime = playAlertChime;
</script>
</body>
</html>
`;

export default function AudioAlertBridge() {
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const unregister = soundService.registerPlayer({
      onPlay: () => {
        try {
          webViewRef.current?.injectJavaScript('window.playAlertChime(); true;');
        } catch (err) {
          console.warn('[AudioBridge] Error injecting play:', err);
        }
      },
      onStop: () => {
        // Stop audio if needed
      },
    });

    return unregister;
  }, []);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View
      style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
      pointerEvents="none"
    >
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: AUDIO_SYNTH_HTML }}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
      />
    </View>
  );
}
