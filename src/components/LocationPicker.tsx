import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAddressFromCoords, getCoordsFromPincode } from '../utils/location';
import { motion, AnimatePresence } from 'framer-motion';

// Google-style red pin SVG
const googlePinSvg = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
  </svg>
`;

let DefaultIcon = L.divIcon({
  html: `<div style="width: 36px; height: 36px; margin-top: -36px; margin-left: -18px; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3))">${googlePinSvg}</div>`,
  className: 'custom-google-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  onAddressFound?: (address: string) => void;
  isFetchingAddress?: (status: boolean) => void;
}

function ClickHandler({ setPosition }: { setPosition: (pos: any) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterMap({ position, trigger, onDone }: { position: any; trigger: boolean; onDone: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (trigger && position) {
      map.flyTo([position.lat, position.lng], 18, { animate: true, duration: 1.5 });
      onDone();
    }
  }, [trigger, position, map, onDone]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange, onAddressFound, isFetchingAddress }: LocationPickerProps) {
  const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
  const initialPosition = lat && lng ? { lat, lng } : null;
  
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialPosition);
  const [shouldFlyTo, setShouldFlyTo] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [precisionLock, setPrecisionLock] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeSearching, setPincodeSearching] = useState(false);
  
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported.');
      return;
    }

    setGpsLoading(true);
    setPrecisionLock(true);
    if (isFetchingAddress) isFetchingAddress(true);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPosition(newPos);
        setShouldFlyTo(true);
        setPrecisionLock(false);
        setGpsLoading(false);
        if (isFetchingAddress) isFetchingAddress(false);
      },
      (err) => {
        setGpsLoading(false);
        setPrecisionLock(false);
        if (isFetchingAddress) isFetchingAddress(false);
        console.warn('Location access denied or unavailable:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [isFetchingAddress]);

  const searchPincode = useCallback(async () => {
    const query = pincodeInput.trim();
    if (!query) return;
    setPincodeSearching(true);
    if (isFetchingAddress) isFetchingAddress(true);
    try {
      const result = await getCoordsFromPincode(query);
      if (result) {
        const newPos = { lat: result.lat, lng: result.lng };
        setPosition(newPos);
        setShouldFlyTo(true);
        if (onAddressFound && result.display) {
          onAddressFound(result.display);
        }
      }
    } catch (e) {
      console.error('Pincode search failed:', e);
    } finally {
      setPincodeSearching(false);
      if (isFetchingAddress) isFetchingAddress(false);
    }
  }, [isFetchingAddress, onAddressFound, pincodeInput]);

  useEffect(() => {
    if (!initialPosition) locateUser();
  }, [initialPosition, locateUser]);

  useEffect(() => {
    if (!position) return;
    onChange(position.lat, position.lng);

    const timer = setTimeout(async () => {
      const address = await getAddressFromCoords(position.lat, position.lng);
      if (address && onAddressFound) onAddressFound(address);
    }, 600);

    return () => clearTimeout(timer);
  }, [position, onChange, onAddressFound]);

  // Pincode auto-search with debounce
  useEffect(() => {
    if (!pincodeInput || pincodeInput.length < 3) return;
    
    const timer = setTimeout(async () => {
      setPincodeSearching(true);
      if (isFetchingAddress) isFetchingAddress(true);
      try {
        const result = await getCoordsFromPincode(pincodeInput);
        if (result) {
          const newPos = { lat: result.lat, lng: result.lng };
          setPosition(newPos);
          setShouldFlyTo(true);
          if (onAddressFound && result.display) {
            onAddressFound(result.display);
          }
        }
      } catch (e) {
        console.error('Pincode search failed:', e);
      }
      setPincodeSearching(false);
      if (isFetchingAddress) isFetchingAddress(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [pincodeInput]);

  const mapCenter = position || INDIA_CENTER;
  const mapZoom = position ? 18 : 5;

  return (
    <div className="w-full rounded-[2rem] overflow-hidden border border-border relative shadow-2xl bg-card">
      {/* Pincode Search Bar */}
      <div className="relative z-[500] flex items-center gap-2 p-3 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <span className="text-primary text-sm">📍</span>
        <input
          type="text"
          value={pincodeInput}
          onChange={e => setPincodeInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchPincode(); } }}
          placeholder="Type pincode or area name..."
          className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/30"
        />
        <button
          onClick={(e) => { e.preventDefault(); searchPincode(); }}
          className="px-3 py-2 rounded-2xl bg-white/10 text-white text-xs font-black border border-white/10 hover:bg-white/20 transition-all"
        >
          Search
        </button>
        {pincodeSearching && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="h-72 relative">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapZoom}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={!L.Browser.mobile}
          className="w-full h-full"
          style={{ zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={22}
          />
          <ClickHandler setPosition={setPosition} />
          {position && <Marker position={[position.lat, position.lng]} />}
          <RecenterMap
            position={position}
            trigger={shouldFlyTo}
            onDone={() => setShouldFlyTo(false)}
          />
        </MapContainer>

        {/* Pulsing Radar UI for Precision Lock */}
        <AnimatePresence>
          {precisionLock && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-primary/30 rounded-full absolute -inset-0"
                />
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 border-4 border-white/20">
                  <span className="text-3xl animate-bounce">🛰️</span>
                </div>
              </div>
              <p className="mt-6 text-white font-black text-xs uppercase tracking-[0.3em] animate-pulse">Locking Position...</p>
              <p className="mt-2 text-white/60 text-xs font-bold">Optimizing GPS Accuracy</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={(e) => { e.preventDefault(); locateUser(); }}
          className="absolute bottom-4 right-4 z-[400] w-12 h-12 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center text-lg hover:scale-105 active:scale-95 transition-all"
        >
          🎯
        </button>

        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-[400]">
          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-black uppercase tracking-widest border border-white/10 shadow-xl">
             GPS Active
          </div>
          {position && (
            <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-primary text-xs font-mono border border-primary/20">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
