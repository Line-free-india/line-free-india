import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, ServiceItem, BusinessCategory, BUSINESS_CATEGORIES, getCategoryInfo } from '../store/AppContext';
import LocationPicker from '../components/LocationPicker';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

const INDUSTRY_GROUPS = [
  { id: 'all', label: 'All Categories', icon: '✨' },
  { id: 'beauty', label: 'Beauty & Grooming', icon: '💈' },
  { id: 'healthcare', label: 'Healthcare & OPD', icon: '🏥' },
  { id: 'govt', label: 'Government & Public', icon: '🏛️' },
  { id: 'banking', label: 'Banking & Finance', icon: '🏦' },
  { id: 'dining', label: 'Food & Dining', icon: '🍽️' },
  { id: 'spiritual', label: 'Religious & Darshan', icon: '🛕' },
  { id: 'fitness', label: 'Gym & Fitness', icon: '💪' },
  { id: 'pets', label: 'Pets & Vet Care', icon: '🐾' },
  { id: 'education', label: 'Education & Professional', icon: '📚' },
  { id: 'repairs', label: 'Retail & Repairs', icon: '🔧' },
];

export default function BarberProfileSetup() {
  const { user, saveBusinessProfile, businessProfile } = useApp();
  const nav = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [businessType, setBusinessType] = useState<BusinessCategory>(
    (businessProfile?.businessType as BusinessCategory) || 'mens_salon'
  );
  const [name, setName] = useState(businessProfile?.name || user?.displayName || '');
  const [businessName, setBusinessName] = useState(businessProfile?.businessName || '');
  const [phone, setPhone] = useState(businessProfile?.phone || '');
  const [location, setLocation] = useState(businessProfile?.location || '');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [capacity, setCapacity] = useState<number>(3);
  const [upiId, setUpiId] = useState(businessProfile?.upiId || '');
  const [services, setServices] = useState<ServiceItem[]>(
    businessProfile?.services || BUSINESS_CATEGORIES[0].defaultServices
  );
  const [lat, setLat] = useState<number | undefined>(businessProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(businessProfile?.lng);
  const [fetchingAddr, setFetchingAddr] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [specialization, setSpecialization] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [tableCount, setTableCount] = useState(10);

  const [newService, setNewService] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showAddService, setShowAddService] = useState(false);

  const currentCategoryInfo = useMemo(() => getCategoryInfo(businessType), [businessType]);

  const filteredCategories = useMemo(() => {
    return BUSINESS_CATEGORIES.filter((cat) => {
      const matchesIndustry = selectedIndustry === 'all' || cat.industryGroup === selectedIndustry;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        cat.label.toLowerCase().includes(q) ||
        cat.labelHi.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q);
      return matchesIndustry && matchesSearch;
    });
  }, [selectedIndustry, searchQuery]);

  const selectCategory = (id: BusinessCategory) => {
    setBusinessType(id);
    const cat = getCategoryInfo(id);
    if (cat) {
      setServices(cat.defaultServices);
      if (cat.defaultWorkingHours) {
        setOpenTime(cat.defaultWorkingHours.open);
        setCloseTime(cat.defaultWorkingHours.close);
      }
    }
    triggerHaptic('light');
    setStep(2);
  };

  const addService = () => {
    if (!newService.trim() || !newPrice) return;
    setServices([
      ...services,
      {
        id: Date.now().toString(),
        name: newService.trim(),
        price: Number(newPrice),
        avgTime: Number(newTime) || 30,
      },
    ]);
    setNewService('');
    setNewPrice('');
    setNewTime('');
    setShowAddService(false);
    triggerHaptic('success');
  };

  const removeService = (id: string) => {
    if (services.length <= 1) {
      setError('Please retain at least one service on your menu.');
      return;
    }
    setServices(services.filter((s) => s.id !== id));
    triggerHaptic('light');
  };

  const handleStep2Next = () => {
    setError('');
    if (!businessName.trim()) { setError('Please enter your Business / Center / Shop name.'); triggerHaptic('error'); return; }
    if (!name.trim()) { setError(`Please enter the ${currentCategoryInfo.terminology.provider} / Manager name.`); triggerHaptic('error'); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid 10-digit mobile number.'); triggerHaptic('error'); return; }
    if (!location.trim()) { setError('Please enter your center address or pin on map.'); triggerHaptic('error'); return; }
    triggerHaptic('success');
    setStep(3);
  };

  const handleCompleteSetup = async () => {
    setError('');
    if (!agreeTerms) { setError('Please accept the Partner Terms of Service and Privacy Policy.'); triggerHaptic('error'); return; }

    setSubmitting(true);
    triggerHaptic('medium');

    try {
      const ok = await saveBusinessProfile({
        uid: user?.uid || '',
        name: name.trim(),
        businessName: businessName.trim(),
        businessType,
        phone: phone.trim(),
        location: location.trim(),
        lat,
        lng,
        openTime,
        closeTime,
        capacity,
        upiId: upiId.trim() || undefined,
        services,
        isOpen: true,
        specialization: specialization.trim() || undefined,
        branchCode: branchCode.trim() || undefined,
        tableCount: currentCategoryInfo.industryGroup === 'dining' ? tableCount : undefined,
      });

      if (ok) {
        triggerHaptic('success');
        nav('/barber/home');
      } else {
        setError('Could not save business details. Please check connection and retry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Setup error. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
    borderRadius: 12, fontSize: 15, color: 'var(--color-text)', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  };
  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--color-primary)';
    e.target.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb), 0.1)';
  };
  const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--color-border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 60%), var(--color-bg)`,
        zIndex: 0,
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)',
          position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={() => { setError(''); step > 1 ? setStep((step - 1) as 1 | 2) : nav('/barber/auth'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: step === i ? 16 : 6, height: 4, borderRadius: 2, background: step >= i ? 'var(--color-primary)' : 'var(--color-border)', transition: 'width 0.3s' }} />
          ))}
        </div>
      </motion.div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1, padding: '24px 20px 40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 600 }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)', fontSize: 28 }}>
                  🏪
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', letterSpacing: -0.5, marginBottom: 4 }}>Select Category</h2>
                <p style={{ fontSize: 14, color: 'var(--color-text-dim)', fontWeight: 500 }}>Choose from 30+ queue categories.</p>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <input type="text" placeholder="Search categories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 40 }} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {INDUSTRY_GROUPS.map(grp => (
                  <button key={grp.id} onClick={() => setSelectedIndustry(grp.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                      background: selectedIndustry === grp.id ? 'var(--color-primary)' : 'var(--color-card)',
                      color: selectedIndustry === grp.id ? '#fff' : 'var(--color-text-dim)',
                      border: `1px solid ${selectedIndustry === grp.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      boxShadow: selectedIndustry === grp.id ? '0 4px 12px rgba(var(--color-primary-rgb), 0.2)' : 'none',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    <span>{grp.icon}</span>
                    <span>{grp.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {filteredCategories.map(cat => (
                  <motion.button key={cat.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => selectCategory(cat.id)}
                    style={{
                      padding: '16px', borderRadius: 20, textAlign: 'left', cursor: 'pointer',
                      background: 'var(--color-card)', border: '1.5px solid var(--color-border)',
                      display: 'flex', flexDirection: 'column', gap: 12,
                      boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.2s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28 }}>{cat.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                        {cat.terminology.provider}
                      </span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{cat.label}</h3>
                      <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontWeight: 500 }}>{cat.labelHi}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {currentCategoryInfo.icon}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: -0.5, marginBottom: 4 }}>Details & Operations</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontWeight: 500 }}>Configuring for: <strong style={{ color: 'var(--color-primary)' }}>{currentCategoryInfo.label}</strong></p>
              </div>

              <div style={{ background: 'var(--color-card)', borderRadius: 24, padding: 20, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Business Name</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. City Health Clinic" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{currentCategoryInfo.terminology.provider} Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Rajesh Sharma" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                </div>
                {currentCategoryInfo.industryGroup === 'healthcare' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Specialization</label>
                    <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="e.g. MBBS, MD" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                )}
                {currentCategoryInfo.id === 'bank_branch' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Branch Code / IFSC</label>
                    <input type="text" value={branchCode} onChange={e => setBranchCode(e.target.value)} placeholder="e.g. SBIN0001234" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                )}
                {currentCategoryInfo.industryGroup === 'dining' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Total Tables</label>
                    <input type="number" value={tableCount} onChange={e => setTableCount(Number(e.target.value))} placeholder="10" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Official Mobile</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Center Address</label>
                  <input type="text" value={fetchingAddr ? 'Detecting...' : location} onChange={e => setLocation(e.target.value)} placeholder="Full address" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} disabled={fetchingAddr} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Pin Exact Location</label>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <LocationPicker lat={lat} lng={lng} onChange={(l, g) => { setLat(l); setLng(g); }} onAddressFound={addr => setLocation(addr)} isFetchingAddress={setFetchingAddr} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Open Time</label>
                    <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Close Time</label>
                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Active Counters</label>
                    <input type="number" min="1" max="50" value={capacity} onChange={e => setCapacity(Number(e.target.value))} style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>UPI ID (Optional)</label>
                    <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="merchant@upi" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  </div>
                </div>
              </div>

              <button onClick={handleStep2Next} className="premium-btn premium-btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 20 }}>
                Continue to Services
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  📋
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: -0.5, marginBottom: 4 }}>Services & Legal</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontWeight: 500 }}>Set up what you offer</p>
              </div>

              <div style={{ background: 'var(--color-card)', borderRadius: 24, padding: 20, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text)' }}>Services ({services.length})</span>
                  <button onClick={() => setShowAddService(!showAddService)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', background: 'none', cursor: 'pointer' }}>
                    {showAddService ? 'Cancel' : '+ Add New'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.map(s => (
                    <div key={s.id} style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{s.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-dim)', fontWeight: 500 }}>{s.price > 0 ? `₹${s.price}` : 'Free'} • {s.avgTime} mins</p>
                      </div>
                      <button onClick={() => removeService(s.id)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showAddService && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ marginTop: 12, padding: 16, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 16, border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input type="text" value={newService} onChange={e => setNewService(e.target.value)} placeholder="Service Name" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price (₹)" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                          <input type="number" value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="Mins" style={inputStyle} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                        </div>
                        <button onClick={addService} className="premium-btn premium-btn-primary" style={{ padding: 10, fontSize: 14, width: '100%' }}>Add Service</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 16, border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <div style={{ position: 'relative', marginTop: 2 }}>
                    <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                      style={{ appearance: 'none', width: 20, height: 20, borderRadius: 6, border: `2px solid ${agreeTerms ? 'var(--color-primary)' : 'var(--color-border)'}`, background: agreeTerms ? 'var(--color-primary)' : 'transparent', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    />
                    {agreeTerms && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', top: 4, left: 4, pointerEvents: 'none' }}>
                        <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-dim)', lineHeight: 1.5, fontWeight: 500 }}>
                    I register as an authorized partner. I agree to the <Link to="/terms" style={{ color: 'var(--color-primary)' }}>Terms</Link>, <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>, and <Link to="/refund-policy" style={{ color: 'var(--color-primary)' }}>Refund Policy</Link>.
                  </p>
                </label>
              </div>

              <button onClick={handleCompleteSetup} disabled={submitting} className="premium-btn premium-btn-primary" style={{ width: '100%', padding: '16px', fontSize: 16, fontWeight: 800 }}>
                {submitting ? 'Setting up Dashboard...' : '🚀 Complete Setup'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
