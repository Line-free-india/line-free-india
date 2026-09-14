import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useApp, BUSINESS_CATEGORIES } from '../store/AppContext';
import { FaArrowLeft, FaSearch, FaLocationArrow, FaLayerGroup, FaDotCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

// --- Assets ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// --- Components ---
const MapRecenter = ({ pos }: { pos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (pos[0] !== 0) {
      map.flyTo(pos, 15, { duration: 2, easeLinearity: 0.25 });
    }
  }, [pos, map]);
  return null;
};

const MapController = ({ onMove }: { onMove: () => void }) => {
  useMapEvents({ dragstart: onMove });
  return null;
};

export default function SalonsMap() {
  const { allSalons } = useApp();
  const nav = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [userLoc, setUserLoc] = useState<[number, number]>([28.6139, 77.2090]); // Default Delhi
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [pinQuery, setPinQuery] = useState('');
  const [searchingPin, setSearchingPin] = useState(false);

  // Filter salons
  const filteredSalons = useMemo(() => {
    return allSalons.filter(s => {
      const matchSearch = s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'all' || s.businessType === activeCategory;
      return matchSearch && matchCat && s.lat && s.lng;
    });
  }, [allSalons, searchQuery, activeCategory]);

  const categories = useMemo(() => [
    { id: 'all', label: 'All Businesses', icon: '🌐' },
    ...BUSINESS_CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }))
  ], []);

  const locateUser = () => {
    setLoadingLoc(true);
    triggerHaptic('light');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setLoadingLoc(false);
        triggerHaptic('success');
      },
      () => {
        setLoadingLoc(false);
        alert("Permission denied or location unavailable. Showing center map.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handlePinSearch = async () => {
    if (!pinQuery || pinQuery.length < 6) return;
    setSearchingPin(true);
    triggerHaptic('medium');
    try {
      // Using Nominatim for Indian PIN geocoding
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pinQuery}&country=India&format=json`);
      const data = await res.json();
      if (data && data[0]) {
        setUserLoc([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        triggerHaptic('success');
      } else {
        alert("PIN code not found. Please try another.");
      }
    } catch (err) {
      console.error(err);
      alert("Search failed. Check your connection.");
    }
    setSearchingPin(false);
  };

  return (
    <div className="h-screen w-screen bg-bg relative overflow-hidden font-sans">
      {/* Search HUD */}
      <div className="absolute top-0 inset-x-0 z-[1100] p-6 pointer-events-none">
        <div className="max-w-xl mx-auto flex flex-col gap-4 pointer-events-auto">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex gap-2">
             <button 
               onClick={() => { triggerHaptic('light'); nav('/customer/home'); }} 
               className="w-14 h-14 bg-card rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center text-text active:scale-95 transition-all"
             >
                <FaArrowLeft />
             </button>
              <div className="flex-1 bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex items-center px-5 h-14 group focus-within:ring-2 ring-primary/30 transition-all">
                <FaSearch className="text-text-dim mr-3 group-focus-within:text-primary transition-colors" />
                <input 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search 200+ Industries..." 
                   className="w-full bg-transparent border-none outline-none font-black text-white placeholder:text-text-dim text-sm"
                />
              </div>
              <div className="w-32 bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex items-center px-3 h-14 relative group">
                <input 
                   value={pinQuery}
                   onChange={e => setPinQuery(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handlePinSearch()}
                   placeholder="PIN" 
                   maxLength={6}
                   className="w-full bg-transparent border-none outline-none font-black text-white placeholder:text-text-dim text-xs"
                />
                <button 
                  onClick={handlePinSearch}
                  className="absolute right-2 text-primary hover:scale-110 transition-transform disabled:opacity-50"
                  disabled={searchingPin}
                >
                  {searchingPin ? '...' : '📍'}
                </button>
              </div>
           </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="flex gap-2 overflow-x-auto no-scrollbar py-2"
          >
             <div className="flex-shrink-0 px-4 py-2.5 rounded-2xl bg-primary/20 border border-primary/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-black text-primary uppercase tracking-[2px]">Line Free India</span>
             </div>
             {categories.map(c => (
               <button 
                 key={c.id} 
                 onClick={() => { triggerHaptic('light'); setActiveCategory(c.id); }}
                 className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-lg flex items-center gap-3 ${activeCategory === c.id ? 'bg-primary border-transparent text-white scale-105' : 'bg-card/90 backdrop-blur-xl border-white/10 text-text-dim hover:border-white/20'}`}
               >
                 <span>{c.icon}</span> {c.label}
               </button>
             ))}
          </motion.div>
        </div>
      </div>

      <MapContainer
        center={userLoc}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url={mapType === 'streets' 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
        />
        <MapRecenter pos={userLoc} />
        <MapController onMove={() => {}} />

        {/* User Marker */}
        <Marker 
          position={userLoc} 
          icon={L.divIcon({
            className: 'user-marker',
            html: '<div class="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-[0_0_20px_rgba(0,240,255,0.8)] animate-pulse"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}
        />

        {/* Business Markers with Live Crowd Status */}
        {filteredSalons.map(salon => {
          const waitTime = salon.queueDelayMinutes || 0;
          const statusColor = !salon.isOpen ? '#ef4444' : (waitTime < 15 ? '#10b981' : (waitTime < 45 ? '#f59e0b' : '#ef4444'));
          const statusIcon = !salon.isOpen ? '😴' : (waitTime < 15 ? '⚡' : (waitTime < 45 ? '🚶' : '🔥'));
          
          return (
            <Marker
              key={salon.uid}
              position={[salon.lat || 0, salon.lng || 0]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `
                  <div class="relative group">
                    <div class="absolute -inset-4 bg-[${statusColor}] opacity-20 rounded-full animate-ping"></div>
                    <div class="absolute -inset-2 bg-[${statusColor}] opacity-40 rounded-full animate-pulse"></div>
                    <div class="marker-container relative">
                      <div class="marker-pin w-12 h-12 rounded-[1.25rem] bg-card border-2 flex items-center justify-center text-xl transition-all group-hover:scale-120 shadow-2xl overflow-hidden" style="border-color: ${statusColor}">
                         <div class="absolute inset-0 bg-[${statusColor}] opacity-5"></div>
                         ${BUSINESS_CATEGORIES.find(c => c.id === salon.businessType)?.icon || '🏪'}
                      </div>
                      <div class="absolute -bottom-2 -right-2 bg-[${statusColor}] text-white text-xs font-black w-5 h-5 rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                        ${statusIcon}
                      </div>
                      <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        <p class="text-xs font-black text-white uppercase tracking-widest">${waitTime}m Wait</p>
                      </div>
                    </div>
                  </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
              })}
            >
            <Popup className="premium-popup">
              <div 
                onClick={() => nav(`/customer/salon/${salon.uid}`)}
                className="p-3 w-48 cursor-pointer group"
              >
                <img 
                  src={salon.bannerImageURL || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400"} 
                  className="w-full h-24 object-cover rounded-xl mb-3 shadow-lg group-hover:scale-105 transition-transform" 
                  alt="" 
                />
                <h3 className="font-black text-inherit text-base tracking-tight mb-1">{salon.businessName}</h3>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-inherit opacity-60">
                   <span>{salon.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
                   <span>⭐ {salon.rating || 4.9}</span>
                </div>
                <button className="w-full mt-3 py-2 bg-primary text-white text-xs font-black uppercase tracking-[2px] rounded-lg shadow-lg">
                  View Detail →
                </button>
              </div>
            </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute right-6 bottom-32 z-[1100] flex flex-col gap-3">
         <button 
           onClick={locateUser}
           className="w-14 h-14 bg-card/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center text-primary active:scale-95 transition-all text-xl"
         >
           {loadingLoc ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <FaLocationArrow />}
         </button>
         <button 
           onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
           className="w-14 h-14 bg-card/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center text-text active:scale-95 transition-all text-xl"
         >
           <FaLayerGroup />
         </button>
      </div>

      {/* Floating Info Overlay */}
      <div className="absolute left-6 bottom-32 z-[1100]">
         <div className="bg-card/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
                  <FaDotCircle />
               </div>
               <div>
                  <p className="text-xs font-black text-text-dim uppercase tracking-[2px]">Nearby Ops</p>
                  <p className="text-sm font-black text-white">{filteredSalons.length} Businesses Found</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
