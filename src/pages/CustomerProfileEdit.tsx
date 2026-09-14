import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { getAddressFromCoords } from '../utils/location';
import LocationPicker from '../components/LocationPicker';
import { triggerHaptic } from '../utils/haptics';
import { 
  Settings, 
  Pencil, 
  Eye, 
  Flame, 
  MapPin, 
  ChevronRight, 
  ClipboardList, 
  Ticket, 
  Award, 
  Bell, 
  Shield, 
  FileText, 
  LogOut,
  Trash2,
  Check,
  Navigation
} from 'lucide-react';

export default function CustomerProfileEdit() {
  const { user, customerProfile, saveCustomerProfile, signOutUser, uploadPhoto, getCustomerFullHistory } = useApp();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(customerProfile?.name || '');
  const [phone, setPhone] = useState(customerProfile?.phone || '');
  const [location, setLocation] = useState(customerProfile?.location || '');
  const [lat, setLat] = useState<number | undefined>(customerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(customerProfile?.lng);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);

  // Synchronize state when customerProfile loads from Firestore
  useEffect(() => {
    if (customerProfile) {
      if (customerProfile.name) setName(customerProfile.name);
      if (customerProfile.phone) setPhone(customerProfile.phone);
      if (customerProfile.location) setLocation(customerProfile.location);
      if (customerProfile.lat != null) setLat(customerProfile.lat);
      if (customerProfile.lng != null) setLng(customerProfile.lng);
    }
  }, [customerProfile]);

  useEffect(() => {
    if (!user) return;
    getCustomerFullHistory(user.uid).then(tokens => {
      const done = tokens.filter(t => t.status === 'done').sort((a, b) => b.createdAt - a.createdAt);
      setTotalVisits(done.length);
      if (done.length === 0) return;
      let s = 1;
      for (let i = 0; i < done.length - 1; i++) {
        const diff = (done[i].createdAt - done[i+1].createdAt) / 86400000;
        if (diff <= 40) s++; else break;
      }
      setStreak(s);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const baseProfile = customerProfile || {
      uid: user.uid,
      name: name || user.displayName || 'Customer',
      phone: phone || user.phoneNumber || '',
      location: location || '',
      lat,
      lng,
      createdAt: Date.now()
    };
    await saveCustomerProfile({ ...baseProfile, name, phone, location, lat, lng });
    setSaved(true);
    triggerHaptic('success');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAutoDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationSuccessMsg('');
    triggerHaptic('medium');

    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser or device.');
        setDetectingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLat(latitude);
          setLng(longitude);

          let resolved = '';
          try {
            const resolvedAddress = await getAddressFromCoords(latitude, longitude);
            if (resolvedAddress) {
              resolved = resolvedAddress;
            } else {
              resolved = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
          } catch (err) {
            resolved = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          setLocation(resolved);
          setLocationSuccessMsg('📍 Location updated & saved!');

          // Immediately persist to Firestore & localStorage
          if (user) {
            const baseProfile = customerProfile || {
              uid: user.uid,
              name: name || user.displayName || 'Customer',
              phone: phone || user.phoneNumber || '',
              location: resolved,
              lat: latitude,
              lng: longitude,
              createdAt: Date.now()
            };
            await saveCustomerProfile({ ...baseProfile, location: resolved, lat: latitude, lng: longitude });
          }

          triggerHaptic('success');
          setDetectingLocation(false);
          setTimeout(() => setLocationSuccessMsg(''), 4000);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setDetectingLocation(false);
          triggerHaptic('error');
          alert('Could not access device GPS. Please enable location permissions in settings.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } catch (e) {
      console.error('GPS error:', e);
      setDetectingLocation(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try { 
      await uploadPhoto(file, `customers/${user.uid}/avatar`); 
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const initialLetter = (name || customerProfile?.name || 'U')[0].toUpperCase();

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 flex flex-col select-none overflow-y-auto relative">
        
        {/* Top Safe-area Header with Settings Gear (Screen 5) */}
        <header className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs sticky top-0 z-30 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Profile</h1>
          <button 
            onClick={() => triggerHaptic('light')}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 space-y-5 flex-1">
          
          {/* Avatar & User Details (Screen 5) */}
          <div className="flex flex-col items-center pt-2">
            <div className="relative">
              <div className="w-26 h-26 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-3xl font-black">
                {customerProfile?.photoURL ? (
                  <img src={customerProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              {/* Green Edit Badge */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  fileRef.current?.click();
                }}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                title="Change Photo"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            <h2 className="text-2xl font-black text-gray-900 mt-3">
              {name || customerProfile?.name || 'Satyam Kumar'}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              {user?.email || phone || '+91 98765 43210'}
            </p>
          </div>

          {/* Stats Row (Screen 5: Visits & Streak) */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none">{totalVisits}</p>
                <p className="text-sm text-gray-500 font-bold mt-1">Visits</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 fill-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none">{streak}</p>
                <p className="text-sm text-gray-500 font-bold mt-1">Streak</p>
              </div>
            </div>
          </div>

          {/* Personal Info Card (Screen 5) */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Personal Info</h3>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={detectingLocation}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                <span>{detectingLocation ? 'Locating...' : 'Auto-detect GPS'}</span>
              </button>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Phone input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Location input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. MG Road, Civil Lines, City"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {locationSuccessMsg && (
                <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> {locationSuccessMsg}
                </p>
              )}

              {/* Adjust Pin on Map Link */}
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <span>{showMap ? 'Hide Map Picker ▲' : 'Adjust Pin on Map >'}</span>
                </button>
              </div>

              {showMap && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                  <LocationPicker
                    lat={lat}
                    lng={lng}
                    onChange={(l, g) => {
                      setLat(l);
                      setLng(g);
                    }}
                    onAddressFound={(addr) => {
                      setLocation(addr);
                      setLocationSuccessMsg('Address updated from pin');
                      setTimeout(() => setLocationSuccessMsg(''), 3000);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Solid Green Save Button (Screen 5) */}
            <button
              onClick={handleSave}
              className={`w-full py-4 px-4 rounded-2xl font-black text-base shadow-sm transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] ${
                saved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Saved Successfully</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>

          {/* More Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden divide-y divide-gray-100">
            {[
              { label: 'My History', path: '/customer/history', icon: ClipboardList },
              { label: 'My Tokens', path: '/customer/tokens', icon: Ticket },
              { label: 'Loyalty & Rewards', path: '/customer/loyalty', icon: Award },
              { label: 'Notifications', path: '/customer/notifications', icon: Bell },
              { label: 'Terms of Service', path: '/terms', icon: FileText },
              { label: 'Privacy Policy', path: '/privacy', icon: Shield },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    triggerHaptic('light');
                    nav(item.path);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              );
            })}
          </div>

          {/* Account Logout / Actions */}
          <div className="space-y-3 pt-2 pb-6">
            <button
              onClick={async () => {
                triggerHaptic('medium');
                await signOutUser();
                nav('/', { replace: true });
              }}
              className="w-full py-4 rounded-2xl border-2 border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 font-black text-base flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <LogOut className="w-5 h-5 stroke-[2.5]" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={() => nav('/delete-account')}
              className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    </ResponsiveContainer>
  );
}
