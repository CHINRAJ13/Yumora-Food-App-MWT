import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { socketService } from "@/services/socket";
import axios from "axios";
import { Bike, MapPin, Navigation, Clock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Custom icons
const driverIcon = new L.DivIcon({
    className: "driver-marker",
    html: `<div style="
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 15px rgba(124,58,237,0.5);
    border: 3px solid white;
    animation: pulse-driver 2s ease-in-out infinite;
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="15" cy="5" r="1"/>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const customerIcon = new L.DivIcon({
    className: "customer-marker",
    html: `<div style="
    background: linear-gradient(135deg, #f97316, #fb923c);
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 15px rgba(249,115,22,0.5);
    border: 3px solid white;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

// Auto-fit map bounds
function FitBounds({ driverPos, customerPos }: { driverPos: [number, number] | null; customerPos: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (driverPos && customerPos) {
            const bounds = L.latLngBounds([driverPos, customerPos]);
            map.fitBounds(bounds, { padding: [60, 60] });
        } else if (driverPos) {
            map.setView(driverPos, 15);
        } else if (customerPos) {
            map.setView(customerPos, 15);
        }
    }, [driverPos, customerPos, map]);
    return null;
}

interface LiveTrackingMapProps {
    orderId: string;
    orderLocation?: { lat: number; lng: number };
}

const LiveTrackingMap = ({ orderId, orderLocation }: LiveTrackingMapProps) => {
    const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
    const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
    const [distance, setDistance] = useState<string | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [route, setRoute] = useState<[number, number][]>([]);
    const [trackingActive, setTrackingActive] = useState(true);
    const routeFetchedRef = useRef(false);

    useEffect(() => {
        const socket = socketService.connect();

        // Join the tracking room as customer
        socketService.joinTracking(orderId, "customer");

        // Send customer's location (from the order's delivery location, or current browser location)
        if (orderLocation?.lat && orderLocation?.lng) {
            setCustomerPos([orderLocation.lat, orderLocation.lng]);
            socketService.sendCustomerLocation(orderId, orderLocation.lat, orderLocation.lng);
        } else {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCustomerPos([latitude, longitude]);
                    socketService.sendCustomerLocation(orderId, latitude, longitude);
                },
                (err) => console.error("Geolocation error:", err),
                { enableHighAccuracy: true, timeout: 15000 }
            );
        }

        // Listen for driver location updates
        socketService.onLocationUpdated((data) => {
            if (data.orderId === orderId) {
                setDriverPos([data.lat, data.lng]);
                if (data.distance) setDistance(data.distance);
                if (data.eta) setEta(data.eta);
            }
        });

        // Listen for tracking ended
        socketService.onTrackingEnded((data) => {
            if (data.orderId === orderId) {
                setTrackingActive(false);
            }
        });

        return () => {
            socketService.offTrackingEvents();
        };
    }, [orderId, orderLocation]);

    // Fetch route when both positions are available
    useEffect(() => {
        if (!driverPos || !customerPos || routeFetchedRef.current) return;

        const fetchRoute = async () => {
            try {
                const res = await axios.post(`${API_URL}/api/locations/route`, {
                    start: { lat: driverPos[0], lng: driverPos[1] },
                    end: { lat: customerPos[0], lng: customerPos[1] },
                });
                if (res.data?.features?.[0]?.geometry?.coordinates) {
                    const coords = res.data.features[0].geometry.coordinates.map(
                        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
                    );
                    setRoute(coords);
                    routeFetchedRef.current = true;
                }
            } catch (err) {
                console.error("Route fetch error:", err);
            }
        };
        fetchRoute();
    }, [driverPos, customerPos]);

    // Refresh route periodically (every 30s) as driver moves
    useEffect(() => {
        if (!driverPos || !customerPos) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.post(`${API_URL}/api/locations/route`, {
                    start: { lat: driverPos[0], lng: driverPos[1] },
                    end: { lat: customerPos[0], lng: customerPos[1] },
                });
                if (res.data?.features?.[0]?.geometry?.coordinates) {
                    const coords = res.data.features[0].geometry.coordinates.map(
                        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
                    );
                    setRoute(coords);
                }
            } catch { }
        }, 30000);
        return () => clearInterval(interval);
    }, [driverPos, customerPos]);

    if (!trackingActive) {
        return (
            <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-200">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-bold text-green-700">Order Delivered!</p>
                <p className="text-sm text-green-600 mt-1">Your order has been delivered successfully.</p>
            </div>
        );
    }

    return (
        <div className="relative rounded-2xl overflow-hidden border border-white/30 shadow-2xl">
            {/* ETA & Distance Overlay */}
            {(distance || eta) && (
                <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/50">
                    <div className="flex items-center gap-4">
                        {eta && (
                            <div className="flex items-center gap-1.5">
                                <div className="bg-violet-100 p-1.5 rounded-lg">
                                    <Clock className="w-3.5 h-3.5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">ETA</p>
                                    <p className="text-sm font-black text-violet-700">{eta}</p>
                                </div>
                            </div>
                        )}
                        {distance && (
                            <div className="flex items-center gap-1.5">
                                <div className="bg-orange-100 p-1.5 rounded-lg">
                                    <Navigation className="w-3.5 h-3.5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Distance</p>
                                    <p className="text-sm font-black text-orange-700">{distance}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Live Badge */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
            </div>

            {/* Map */}
            <MapContainer
                center={customerPos || [12.9716, 77.5946]}
                zoom={14}
                style={{ height: "350px", width: "100%" }}
                zoomControl={false}
            >
                <FitBounds driverPos={driverPos} customerPos={customerPos} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                {/* Driver marker */}
                {driverPos && (
                    <Marker position={driverPos} icon={driverIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong>🏍️ Your Rider</strong>
                                <br />
                                {distance && <span>📍 {distance}</span>}
                                {eta && <span> | ⏱️ {eta}</span>}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Customer marker */}
                {customerPos && (
                    <Marker position={customerPos} icon={customerIcon}>
                        <Popup><strong>📍 Your Location</strong></Popup>
                    </Marker>
                )}

                {/* Route polyline */}
                {route.length > 0 && (
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: "#7c3aed",
                            weight: 5,
                            opacity: 0.8,
                            dashArray: "10, 8",
                        }}
                    />
                )}
            </MapContainer>

            {/* Waiting state when no driver position yet */}
            {!driverPos && (
                <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="font-bold text-gray-700">Waiting for rider location...</p>
                        <p className="text-xs text-gray-500 mt-1">The rider will appear once they start moving</p>
                    </div>
                </div>
            )}

            {/* Pulse animation styles */}
            <style>{`
        @keyframes pulse-driver {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(124,58,237,0.5); }
          50% { transform: scale(1.1); box-shadow: 0 4px 25px rgba(124,58,237,0.7); }
        }
        .driver-marker > div { animation: pulse-driver 2s ease-in-out infinite; }
        .leaflet-container { border-radius: 1rem; }
      `}</style>
        </div>
    );
};

export default LiveTrackingMap;
