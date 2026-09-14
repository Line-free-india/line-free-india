import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, ServiceItem } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import LocationPicker from '../components/LocationPicker';
import { triggerHaptic } from '../utils/haptics';
import { getAddressFromCoords } from '../utils/location';
import { 
  Camera, 
  CheckCircle2, 
  Pencil, 
  Store, 
  MapPin, 
  Eye, 
  User, 
  Phone, 
  CreditCard, 
  Clock, 
  Users, 
  MessageSquare, 
  Scissors, 
  BarChart3, 
  ShoppingBag,
  LocateFixed,
  Loader2,
  Plus, 
  Share2, 
  QrCode, 
  Moon, 
  Sun, 
  FileText, 
  LogOut, 
  Trash2,
  ChevronRight,
  Navigation,
  ExternalLink,
  Check
} from 'lucide-react';

export default function BarberProfile() {
  const { 
    user, 
    businessProfile, 
    saveBusinessProfile, 
    signOutUser, 
    deleteAccount, 
    uploadPhoto, 
    theme, 
    toggleTheme, 
    t 
  } = useApp();
  
  const nav = useNavigate();
  const [name, setName] = useState(businessProfile?.name || '');
  const [salonName, setSalonName] = useState(businessProfile?.businessName || businessProfile?.salonName || '');
  const [location, setLocation] = useState(businessProfile?.location || 'NH333, Sono, Sone, Bihar');
  const [lat, setLat] = useState<number | undefined>(businessProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(businessProfile?.lng);
  const [phone, setPhone] = useState(businessProfile?.phone || '');
  const [upiId, setUpiId] = useState(businessProfile?.upiId || 'yourname@upi');
  const [businessHours, setBusinessHours] = useState(businessProfile?.businessHours || '9 AM - 8 PM');
  const [maxCapacity, setMaxCapacity] = useState<number | ''>(businessProfile?.maxCapacity || 10);
  const [bio, setBio] = useState(businessProfile?.bio || 'Tagline for your salon...');
  const [galleryImages, setGalleryImages] = useState<string[]>(businessProfile?.galleryImages || []);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const infoSectionRef = useRef<HTMLDivElement>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (businessProfile) {
      if (businessProfile.name) setName(businessProfile.name);
      if (businessProfile.businessName || businessProfile.salonName) {
        setSalonName(businessProfile.businessName || businessProfile.salonName);
      }
      if (businessProfile.location) setLocation(businessProfile.location);
      if (businessProfile.lat !== undefined) setLat(businessProfile.lat);
      if (businessProfile.lng !== undefined) setLng(businessProfile.lng);
      if (businessProfile.phone) setPhone(businessProfile.phone);
      if (businessProfile.upiId) setUpiId(businessProfile.upiId);
      if (businessProfile.businessHours) setBusinessHours(businessProfile.businessHours);
      if (businessProfile.maxCapacity !== undefined) setMaxCapacity(businessProfile.maxCapacity);
      if (businessProfile.bio) setBio(businessProfile.bio);
      if (businessProfile.galleryImages) setGalleryImages(businessProfile.galleryImages);
    }
  }, [businessProfile]);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device');
      return;
    }
    setDetectingLocation(true);
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const addr = await getAddressFromCoords(latitude, longitude);
          if (addr) {
            setLocation(addr);
          }
        } catch (err) {
          console.error('Failed to get address from GPS coords', err);
        } finally {
          setDetectingLocation(false);
          triggerHaptic('success');
        }
      },
      (err) => {
        console.error('GPS error', err);
        alert('Could not access your GPS location. Please check device location permissions.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!businessProfile) return;
    triggerHaptic('medium');
    await saveBusinessProfile({ 
      ...businessProfile, 
      name: name || businessProfile.name, 
      businessName: salonName || businessProfile.businessName, 
      salonName: salonName || businessProfile.salonName, 
      location, 
      lat, 
      lng, 
      phone, 
      upiId, 
      businessHours, 
      bio, 
      galleryImages,
      maxCapacity: typeof maxCapacity === 'number' ? maxCapacity : undefined 
    });
    setSaved(true);
    setIsEditingInfo(false);
    triggerHaptic('success');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !businessProfile) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadPhoto(file, `line-free/businesses/${user.uid}/avatar`);
      await saveBusinessProfile({ ...businessProfile, photoURL: url });
      triggerHaptic('success');
    } catch {
      alert('Upload failed');
    }
    setUploadingAvatar(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !businessProfile) return;
    setUploadingBanner(true);
    try {
      const url = await uploadPhoto(file, `line-free/businesses/${user.uid}/banner`);
      await saveBusinessProfile({ ...businessProfile, bannerImageURL: url, salonImageURL: url });
      triggerHaptic('success');
    } catch {
      alert('Upload failed');
    }
    setUploadingBanner(false);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploadingGallery(true);
    const promises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
            canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(promises).then(images => {
      setGalleryImages(prev => [...prev, ...images]);
      setUploadingGallery(false);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleShare = () => {
    triggerHaptic('light');
    const bookingUrl = `${window.location.origin}/customer/salon/${user?.uid}`;
    const text = `Book an instant queue token at ${salonName || 'our business'} on Line Free India! 🚀\n🔗 ${bookingUrl}`;
    if (navigator.share) {
      navigator.share({ title: salonName, text, url: bookingUrl }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleLogout = async () => { 
    triggerHaptic('medium'); 
    await signOutUser(); 
    nav('/', { replace: true }); 
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    triggerHaptic('medium');
    const result = await deleteAccount();
    if (result.success) nav('/', { replace: true });
    else { alert(result.error || 'Failed'); setDeleting(false); }
  };

  const fields = [name, salonName, location, phone, upiId];
  const completion = Math.round(
    ((fields.filter(f => String(f || '').trim().length > 0).length + 1) / (fields.length + 1)) * 100
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-48 flex flex-col overflow-x-hidden relative">
      
      {/* ─── Top Safe-Area Header (Screen 1 & 2) ─── */}
      <header className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Profile</h1>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Partner
        </span>
      </header>

      {/* ─── Hero Cover Banner & Avatar (Screen 1) ─── */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
          {businessProfile?.bannerImageURL || businessProfile?.salonImageURL ? (
            <img 
              src={businessProfile.bannerImageURL || businessProfile.salonImageURL} 
              className="w-full h-full object-cover" 
              alt="Cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 flex items-center justify-center text-white/40">
              <Store className="w-14 h-14" />
            </div>
          )}

          {/* Change Cover Button */}
          <button 
            onClick={() => bannerRef.current?.click()} 
            disabled={uploadingBanner}
            className="absolute bottom-3 right-3 px-3.5 py-2 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-md flex items-center gap-2 hover:bg-black/80 transition border border-white/20 shadow-md cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{uploadingBanner ? 'Uploading...' : 'Change Cover'}</span>
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>

        {/* Circular Avatar overlapping banner */}
        <div className="px-4 -mt-12 flex flex-col items-center text-center relative z-10">
          <div className="relative">
            <div className="w-26 h-26 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-3xl font-black">
              {businessProfile?.photoURL ? (
                <img src={businessProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(salonName || 'B')[0].toUpperCase()}</span>
              )}
            </div>

            {/* Camera badge */}
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              title="Change Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="text-2xl font-black text-gray-900 leading-tight">
              {salonName || 'My Business'}
            </h2>
            <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            {user?.email || 'kumarsatyam9378@gmail.com'}
          </p>
        </div>
      </div>

      {/* ─── Main Body ─── */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* Card 1: Profile Completion (Screen 1) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-gray-900">Profile Completion</span>
            </div>
            <span className="text-xs font-black text-emerald-600">{completion}%</span>
          </div>

          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-700" 
              style={{ width: `${completion}%` }} 
            />
          </div>

          <button
            onClick={() => setIsEditingInfo(true)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 hover:text-emerald-700 pt-0.5"
          >
            <span>Complete profile to attract more customers!</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Card 2: 4 Quick Actions in a row (Screen 1) */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => {
              setIsEditingInfo(true);
              infoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:border-emerald-200 transition cursor-pointer active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
              <Pencil className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-black text-gray-800 text-center leading-tight">Edit Profile</span>
          </button>

          <button
            onClick={() => {
              infoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:border-emerald-200 transition cursor-pointer active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
              <Store className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-black text-gray-800 text-center leading-tight">Details</span>
          </button>

          <button
            onClick={() => {
              locationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:border-emerald-200 transition cursor-pointer active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-black text-gray-800 text-center leading-tight">Location</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              nav(`/customer/salon/${user?.uid}`);
            }}
            className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:border-emerald-200 transition cursor-pointer active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
              <Eye className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-black text-gray-800 text-center leading-tight">Preview</span>
          </button>
        </div>

        {/* Section: Business Information (Screen 2) */}
        <div ref={infoSectionRef} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              Business Information
            </h3>
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer border border-emerald-200 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditingInfo ? 'Cancel' : 'Edit Info'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manager / Provider Name</p>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">{name || 'Satyam Kumar'}</p>
                )}
              </div>
            </div>

            {/* Business Name */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <Store className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business / Salon Name</p>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">{salonName || 'My Business'}</p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Phone Number</p>
                {isEditingInfo ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXXXXX"
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">{phone || '+91 XXXXXXXX'}</p>
                )}
              </div>
            </div>

            {/* UPI ID */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment UPI ID</p>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">{upiId || 'yourname@upi'}</p>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operating Working Hours</p>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    placeholder="9 AM - 8 PM"
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">{businessHours || '9 AM - 8 PM'}</p>
                )}
              </div>
            </div>

            {/* Max Queue Capacity */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Queue Capacity Limit</p>
                {isEditingInfo ? (
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Auto-pause limit (e.g., 10)"
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">Auto-pause limit: {maxCapacity || 10} customers</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio & Salon Tagline</p>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tagline for your salon..."
                    className="w-full mt-1.5 px-3.5 py-2 text-sm font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                ) : (
                  <p className="text-base font-black text-gray-900 mt-0.5">{bio || 'Tagline for your salon...'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Location with Auto-Detect GPS Button */}
        <div ref={locationSectionRef} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Business Location
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoDetectLocation}
                disabled={detectingLocation}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-black flex items-center gap-1.5 transition cursor-pointer border border-emerald-200 shadow-xs"
                title="Detect via GPS"
              >
                {detectingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{detectingLocation ? 'Locating...' : 'Auto Detect'}</span>
              </button>

              <button
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-black flex items-center gap-1.5 transition cursor-pointer border border-gray-200 shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{showMapPicker ? 'Close Map' : 'Map Pin'}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Address</p>
            <p className="text-sm font-black text-gray-900 mt-1 leading-snug">
              {location || 'NH333, Sono, Sone, Bihar - 811314'}
            </p>
          </div>

          {/* Interactive or Mini Map View with Open in Maps */}
          {showMapPicker ? (
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
              <LocationPicker
                lat={lat}
                lng={lng}
                onChange={(l, g) => {
                  setLat(l);
                  setLng(g);
                }}
                onAddressFound={(addr) => setLocation(addr)}
              />
            </div>
          ) : (
            <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-emerald-50 border border-gray-200 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              <div className="flex flex-col items-center gap-1 z-10">
                <MapPin className="w-8 h-8 text-rose-500 fill-rose-500 drop-shadow-md animate-bounce" />
                <span className="text-xs font-black text-gray-800">{salonName || 'My Center'}</span>
              </div>
              <a
                href={lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : `https://maps.google.com/?q=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2.5 right-2.5 px-3.5 py-1.5 rounded-xl bg-white text-gray-800 text-xs font-black shadow-md border border-gray-200 flex items-center gap-1.5 hover:bg-gray-50"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open in Maps</span>
              </a>
            </div>
          )}
        </div>

        {/* Section: Management Links (Including Sell Products) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          <button
            onClick={() => {
              triggerHaptic('light');
              nav('/barber/sell-products');
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-xs">
                <ShoppingBag className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 group-hover:text-amber-700 transition">Sell Products / Retail</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Manage salon retail items, catalog, and inventory sales.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              nav('/barber/menu-editor');
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                <Scissors className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 group-hover:text-rose-700 transition">Service Menu Manager</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Edit prices, durations, and add new services.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              nav('/barber/analytics');
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                <BarChart3 className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition">Business Analytics</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">View earnings, trends, and customer insights.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* Section: Business Gallery (Screen 6) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Business Gallery</h3>
            <label className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer border border-emerald-200 transition">
              + Add Photos
              <input 
                ref={galleryRef}
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleGalleryUpload}
                disabled={uploadingGallery}
              />
            </label>
          </div>

          {uploadingGallery && (
            <p className="text-xs font-bold text-emerald-600 animate-pulse">Uploading photos...</p>
          )}

          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 group">
                <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-rose-600"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* + Add Photos Square */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-500 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 shrink-0 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section: Quick Links (Screen 6) */}
        <div className="space-y-3 pt-1">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider pl-1">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3 text-left hover:border-emerald-200 transition cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-black text-gray-800">Share Salon</span>
            </button>

            <button
              onClick={() => nav(`/salon/${user?.uid}/qr`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3 text-left hover:border-blue-200 transition cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-sm font-black text-gray-800">My QR Code</span>
            </button>

            <button
              onClick={toggleTheme}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3 text-left hover:border-amber-200 transition cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-purple-600" />}
              </div>
              <span className="text-sm font-black text-gray-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => nav('/terms')}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3 text-left hover:border-gray-300 transition cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-sm font-black text-gray-800">Terms of Service</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions: Save Changes, Log Out, Delete Account */}
        <div className="space-y-3 pt-3">
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              saved
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                <span>Changes Saved Successfully!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl border-2 border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-600 font-black text-base flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs active:scale-98"
          >
            <LogOut className="w-5 h-5 stroke-[2.5]" />
            <span>Log Out</span>
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-rose-200 hover:bg-rose-50/50 text-gray-600 hover:text-rose-600 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Trash2 className="w-4.5 h-4.5" />
              <span>Delete Business Account</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <p className="text-base font-black text-rose-700">Delete Business Account?</p>
              <p className="text-xs text-gray-600 font-medium">Type DELETE to confirm complete removal of business data.</p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 rounded-xl bg-white border border-rose-200 text-sm font-bold text-rose-700 text-center uppercase"
              />
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'DELETE' || deleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-black disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}

          {/* Generous bottom clearance spacer so nothing gets hidden behind BottomNav */}
          <div className="h-32" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
