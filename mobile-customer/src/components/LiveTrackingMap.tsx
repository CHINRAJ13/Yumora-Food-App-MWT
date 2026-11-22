import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getRouteApi } from '../api';

const WebViewComponent = WebView as any;

interface LiveTrackingMapProps {
  customerLocation?: { lat: number; lng: number } | null;
  driverCoords?: { lat: number; lng: number } | null;
  liveETA?: string | null;
  liveDistance?: string | null;
  isDelivered?: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  customerLocation,
  driverCoords,
  liveETA,
  liveDistance,
  isDelivered = false,
}) => {
  const webViewRef = useRef<any>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const lastFetchedDriverPos = useRef<{ lat: number; lng: number } | null>(null);

  // Default coordinates (Coimbatore) if customerLocation is missing
  const customerLat = customerLocation?.lat || 11.0168;
  const customerLng = customerLocation?.lng || 76.9558;

  // Fetch road-following route from OpenRouteService backend
  useEffect(() => {
    if (!driverCoords?.lat || !driverCoords?.lng) return;

    // Avoid refetching if driver hasn't moved significantly (> 20 meters)
    if (lastFetchedDriverPos.current) {
      const dLat = Math.abs(driverCoords.lat - lastFetchedDriverPos.current.lat);
      const dLng = Math.abs(driverCoords.lng - lastFetchedDriverPos.current.lng);
      if (dLat < 0.0002 && dLng < 0.0002) return;
    }

    lastFetchedDriverPos.current = { lat: driverCoords.lat, lng: driverCoords.lng };

    const fetchRoute = async () => {
      try {
        const res: any = await getRouteApi(
          { lat: driverCoords.lat, lng: driverCoords.lng },
          { lat: customerLat, lng: customerLng }
        );

        if (res?.data?.features?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] = res.data.features[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          setRouteCoords(coords);

          // If map is already loaded, inject route dynamically
          if (mapLoaded && webViewRef.current) {
            const script = `if (window.updateRoute) { window.updateRoute(${JSON.stringify(coords)}); }`;
            webViewRef.current.injectJavaScript(script);
          }
        }
      } catch (err) {
        console.log('Road route fetch fallback:', err);
      }
    };

    fetchRoute();
  }, [driverCoords?.lat, driverCoords?.lng, customerLat, customerLng, mapLoaded]);

  // When driverCoords updates, inject position to WebView smoothly
  useEffect(() => {
    if (mapLoaded && driverCoords && webViewRef.current) {
      const script = `if (window.updateDriverPosition) { window.updateDriverPosition(${driverCoords.lat}, ${driverCoords.lng}); }`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [driverCoords?.lat, driverCoords?.lng, mapLoaded]);

  // Generate Leaflet HTML
  const leafletHtml = useMemo(() => {
    const dLat = driverCoords?.lat || null;
    const dLng = driverCoords?.lng || null;
    const initialRouteJson = JSON.stringify(routeCoords);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f3f4f6; }
    
    @keyframes pulse-driver {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(124, 58, 237, 0.55); }
      50% { transform: scale(1.1); box-shadow: 0 4px 25px rgba(124, 58, 237, 0.85); }
    }
    
    .driver-pin {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border: 3px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse-driver 2s ease-in-out infinite;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.6);
    }
    
    .customer-pin {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #fb923c);
      border: 3px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.6);
    }
    
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255, 255, 255, 0.75) !important;
      backdrop-filter: blur(4px);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var cLat = ${customerLat};
    var cLng = ${customerLng};
    var dLat = ${dLat !== null ? dLat : 'null'};
    var dLng = ${dLng !== null ? dLng : 'null'};
    var routeCoords = ${initialRouteJson};

    var map = L.map('map', {
      center: dLat ? [(cLat + dLat) / 2, (cLng + dLng) / 2] : [cLat, cLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Customer marker icon (Orange location pin)
    var customerIcon = L.divIcon({
      className: '',
      html: '<div class="customer-pin"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    var customerMarker = L.marker([cLat, cLng], { icon: customerIcon }).addTo(map);

    // Driver marker icon (Purple bicycle with pulsing glow)
    var driverIcon = L.divIcon({
      className: '',
      html: '<div class="driver-pin"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    var driverMarker = null;
    if (dLat && dLng) {
      driverMarker = L.marker([dLat, dLng], { icon: driverIcon }).addTo(map);
    }

    // Road Polyline
    var polyline = null;
    function renderRoute(coords) {
      if (polyline) map.removeLayer(polyline);
      if (coords && coords.length > 0) {
        polyline = L.polyline(coords, {
          color: '#7c3aed',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      }
    }

    if (routeCoords && routeCoords.length > 0) {
      renderRoute(routeCoords);
    }

    // Auto fit bounds
    function fitAll() {
      if (dLat && dLng) {
        var bounds = L.latLngBounds([[cLat, cLng], [dLat, dLng]]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else {
        map.setView([cLat, cLng], 15);
      }
    }
    fitAll();

    // Global injection endpoints
    window.updateDriverPosition = function(lat, lng) {
      dLat = lat;
      dLng = lng;
      if (!driverMarker) {
        driverMarker = L.marker([lat, lng], { icon: driverIcon }).addTo(map);
      } else {
        driverMarker.setLatLng([lat, lng]);
      }
      fitAll();
    };

    window.updateRoute = function(coords) {
      routeCoords = coords;
      renderRoute(coords);
      if (coords && coords.length > 0) {
        var b = L.latLngBounds(coords);
        map.fitBounds(b, { padding: [45, 45], maxZoom: 16 });
      }
    };

    window.centerOnRider = function() {
      if (dLat && dLng) map.setView([dLat, dLng], 16);
    };

    window.centerOnAll = fitAll;
  </script>
</body>
</html>
    `;
  }, [customerLat, customerLng]);

  return (
    <View style={styles.cardContainer}>
      {/* WebView Map Component */}
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webView}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => setMapLoaded(true)}
      />

      {/* Floating ETA & Distance Badge (Top Left - Matches Web) */}
      {(liveETA || liveDistance) && (
        <View style={styles.etaPillContainer}>
          <View style={styles.etaPillRow}>
            {liveETA && (
              <View style={styles.metricItem}>
                <View style={styles.clockIconBg}>
                  <Ionicons name="time" size={14} color="#7c3aed" />
                </View>
                <View>
                  <Text style={styles.metricLabel}>ETA</Text>
                  <Text style={styles.etaValue}>{liveETA}</Text>
                </View>
              </View>
            )}

            {liveETA && liveDistance && <View style={styles.metricDivider} />}

            {liveDistance && (
              <View style={styles.metricItem}>
                <View style={styles.navIconBg}>
                  <Ionicons name="navigate" size={13} color="#ea580c" />
                </View>
                <View>
                  <Text style={styles.metricLabel}>DISTANCE</Text>
                  <Text style={styles.distanceValue}>{liveDistance}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Floating Live Indicator Badge (Top Right - Matches Web) */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Centering Quick Action Controls (Bottom Right) */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => webViewRef.current?.injectJavaScript('if(window.centerOnAll)window.centerOnAll();')}
          style={styles.controlBtn}
        >
          <Ionicons name="scan-outline" size={16} color="#4b5563" />
        </TouchableOpacity>
        {driverCoords && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => webViewRef.current?.injectJavaScript('if(window.centerOnRider)window.centerOnRider();')}
            style={styles.controlBtn}
          >
            <Ionicons name="bicycle" size={16} color="#7c3aed" />
          </TouchableOpacity>
        )}
      </View>

      {/* Waiting state when driver GPS coordinates haven't arrived yet */}
      {!driverCoords && !isDelivered && (
        <View style={styles.waitingOverlay}>
          <View style={styles.waitingContent}>
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text style={styles.waitingTitle}>Connecting to Rider GPS...</Text>
            <Text style={styles.waitingSubtitle}>Rider signal will update as they start moving</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: 270,
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  webView: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  etaPillContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  etaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIconBg: {
    backgroundColor: '#ede9fe',
    padding: 5,
    borderRadius: 10,
  },
  navIconBg: {
    backgroundColor: '#ffedd5',
    padding: 5,
    borderRadius: 10,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  etaValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6d28d9',
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#c2410c',
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 2,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ef4444',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  controlsRow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'column',
    gap: 6,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  waitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    padding: 16,
  },
  waitingContent: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
  },
  waitingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    marginTop: 8,
  },
  waitingSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
});
