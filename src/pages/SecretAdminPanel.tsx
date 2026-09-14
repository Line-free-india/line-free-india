import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, BUSINESS_CATEGORIES } from '../store/AppContext';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, limit, startAfter, getDoc } from 'firebase/firestore';
import { db } from '../firebase';


export default function SecretAdminPanel() {
  const { allSalons, signOutUser, user } = useApp();
  const nav = useNavigate();
  
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todayTokens, setTodayTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'tokens' | 'customers' | 'products' | 'reviews'>('overview');
  const [allTokens, setAllTokens] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [lastDocs, setLastDocs] = useState<Record<string, any>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});


  // 🔐 Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        nav('/', { replace: true });
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || !userDoc.data().admin) {
          alert('⛔ Unauthorized Access! This page is restricted.');
          nav('/', { replace: true });
        }
      } catch (e) {
        nav('/', { replace: true });
      }
    };
    checkAdmin();
  }, [user, nav]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Customers
        const custSnap = await getDocs(query(collection(db, 'customers'), limit(50)));
        setTotalCustomers(custSnap.size);
        const customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllCustomers(customers);
        let newLastDocs: any = { customers: custSnap.docs[custSnap.docs.length - 1] };

        // Users (for email data)
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllUsers(users);
        newLastDocs.users = usersSnap.docs[usersSnap.docs.length - 1];

        // Tokens
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const todayTokensSnap = await getDocs(query(collection(db, 'tokens'), where('date', '==', todayStr), limit(50)));
        setTodayTokens(todayTokensSnap.size);

        const allTokensSnap = await getDocs(query(collection(db, 'tokens'), limit(50)));
        setTotalTokens(allTokensSnap.size);
        const tokens = allTokensSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllTokens(tokens);
        newLastDocs.tokens = allTokensSnap.docs[allTokensSnap.docs.length - 1];

        // Revenue
        let rev = 0;
        tokens.forEach((t: any) => {
          if (t.totalPrice) rev += Number(t.totalPrice);
        });
        setTotalRevenue(rev);

        // Products
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(50)));
        setAllProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        newLastDocs.products = productsSnap.docs[productsSnap.docs.length - 1];

        // Reviews
        const reviewsSnap = await getDocs(query(collection(db, 'reviews'), limit(50)));
        setAllReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        newLastDocs.reviews = reviewsSnap.docs[reviewsSnap.docs.length - 1];

        setLastDocs(newLastDocs);
      } catch (e) {
        console.warn("Failed to fetch admin stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const loadMore = async (collectionName: string) => {
    if (!lastDocs[collectionName] || loadingMore[collectionName]) return;
    setLoadingMore(prev => ({ ...prev, [collectionName]: true }));
    try {
      const q = query(collection(db, collectionName), startAfter(lastDocs[collectionName]), limit(50));
      const snap = await getDocs(q);
      const newDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const newLastDoc = snap.docs[snap.docs.length - 1];

      if (collectionName === 'customers') {
        setAllCustomers(prev => [...prev, ...newDocs]);
        setTotalCustomers(prev => prev + newDocs.length);
      } else if (collectionName === 'users') {
        setAllUsers(prev => [...prev, ...newDocs]);
      } else if (collectionName === 'tokens') {
        setAllTokens(prev => [...prev, ...newDocs]);
        setTotalTokens(prev => prev + newDocs.length);
      } else if (collectionName === 'products') {
        setAllProducts(prev => [...prev, ...newDocs]);
      } else if (collectionName === 'reviews') {
        setAllReviews(prev => [...prev, ...newDocs]);
      }

      setLastDocs(prev => ({ ...prev, [collectionName]: newLastDoc }));
    } catch (e) {
      console.warn("Failed to load more", e);
    } finally {
      setLoadingMore(prev => ({ ...prev, [collectionName]: false }));
    }
  };

  const suspendSalon = async (salonId: string, isSuspended: boolean) => {
    if (!confirm(`Are you sure you want to ${isSuspended ? 'UNSUSPEND' : 'SUSPEND'} this business?`)) return;
    try {
      await updateDoc(doc(db, 'barbers', salonId), { isStopped: !isSuspended });
      alert('✅ Business status updated!');
      window.location.reload();
    } catch (e) { 
      alert('❌ Failed to update business status.'); 
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!confirm('⚠️ Are you sure you want to DELETE this token? This cannot be undone!')) return;
    try {
      await deleteDoc(doc(db, 'tokens', tokenId));
      setAllTokens(prev => prev.filter(t => t.id !== tokenId));
      alert('✅ Token deleted!');
    } catch (e) {
      alert('❌ Failed to delete token.');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('⚠️ Are you sure you want to DELETE this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setAllReviews(prev => prev.filter(r => r.id !== reviewId));
      alert('✅ Review deleted!');
    } catch (e) {
      alert('❌ Failed to delete review.');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('⚠️ Delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setAllProducts(prev => prev.filter(p => p.id !== productId));
      alert('✅ Product deleted!');
    } catch (e) {
      alert('❌ Failed to delete product.');
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    nav('/', { replace: true });
  };

  // Category breakdown
  const categoryBreakdown = BUSINESS_CATEGORIES.map(cat => ({
    ...cat,
    count: allSalons.filter(s => s.businessType === cat.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const activeSalons = allSalons.filter(s => s.isOpen && !s.isStopped);
  const maxCatCount = Math.max(1, ...categoryBreakdown.map(c => c.count));

  // Filter data based on search
  const filteredSalons = allSalons.filter(s => 
    s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTokens = allTokens.filter((t: any) =>
    t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.salonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = allCustomers.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Merge customer and user data for complete info
  const enrichedCustomers = filteredCustomers.map((c: any) => {
    const user = allUsers.find((u: any) => u.id === c.id);
    return {
      ...c,
      email: c.email || user?.email || 'N/A',
      phone: c.phone || user?.phone || 'N/A',
    };
  });

  const filteredProducts = allProducts.filter((p: any) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = allReviews.filter((r: any) =>
    r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg text-text pb-12 animate-fadeIn font-sans">
      {/* Header */}
      <div className="p-6 bg-card border-b border-border shadow-sm flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black gradient-text">🔐 Secret Admin Panel</h1>
          <p className="text-xs text-text-dim font-medium uppercase tracking-widest mt-0.5">Full Platform Control</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 bg-danger/10 text-danger text-sm font-bold rounded-xl active:scale-95 transition-transform border border-danger/20">
          Logout
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: '🏪', label: 'Businesses', value: allSalons.length },
            { icon: '🟢', label: 'Active Now', value: activeSalons.length },
            { icon: '👥', label: 'Users', value: loading ? '…' : totalCustomers },
            { icon: '🎫', label: 'Tokens Today', value: loading ? '…' : todayTokens, sub: `/ ${totalTokens} total` },
            { icon: '🛍️', label: 'Products', value: loading ? '…' : allProducts.length },
          ].map(kpi => (
            <div key={kpi.label} className="p-5 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-3xl mb-2 relative z-10">{kpi.icon}</span>
              <p className="text-3xl font-black relative z-10">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-text-dim relative z-10">{kpi.sub}</p>}
              <p className="text-xs text-text-dim font-bold uppercase tracking-wider relative z-10 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">Total Platform Revenue</p>
            <p className="text-4xl font-black gradient-text mt-1">₹{loading ? '…' : totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-dim mt-1">From {totalTokens} processed bookings</p>
          </div>
          <span className="text-6xl opacity-30">💰</span>
        </div>

        {/* Search Bar */}
        <div className="elite-glass rounded-2xl p-4 spatial-card">
          <input
            type="text"
            placeholder="🔍 Search anything... (businesses, customers, tokens, products)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card-2 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'businesses', label: '🏪 Businesses', count: filteredSalons.length },
            { id: 'tokens', label: '🎫 Tokens', count: filteredTokens.length },
            { id: 'customers', label: '👥 Customers', count: enrichedCustomers.length },
            { id: 'products', label: '🛍️ Products', count: filteredProducts.length },
            { id: 'reviews', label: '⭐ Reviews', count: filteredReviews.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-black shadow-lg shadow-primary/30'
                  : 'bg-card border border-border text-text-dim hover:text-text'
              }`}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="elite-glass rounded-2xl overflow-hidden p-5 spatial-card">
              <h2 className="text-lg font-bold mb-4">📊 Business Category Breakdown</h2>
              {categoryBreakdown.length === 0 ? (
                <p className="text-text-dim text-sm py-4 text-center">No businesses registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <span className="text-xl w-7 flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{cat.label}</span>
                          <span className="text-primary">{cat.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-card-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                            style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Heatmap */}
            <div className="elite-glass rounded-2xl overflow-hidden p-5 spatial-card">
              <h2 className="text-lg font-bold mb-4">📍 Geographic Density Map</h2>
              <div className="w-full h-48 bg-card-2 rounded-xl relative overflow-hidden border border-border/50">
                {allSalons.map(s => {
                  if (!s.lat || !s.lng) return null;
                  const x = Math.max(0, Math.min(100, ((s.lng - 68) / (97 - 68)) * 100));
                  const y = Math.max(0, Math.min(100, 100 - ((s.lat - 8) / (37 - 8)) * 100));
                  const cat = BUSINESS_CATEGORIES.find(c => c.id === s.businessType);
                  return (
                    <div key={s.uid} title={s.businessName} className="absolute w-5 h-5 -ml-2.5 -mt-2.5 flex items-center justify-center text-base cursor-pointer hover:scale-150 transition-transform" style={{ left: `${x}%`, top: `${y}%` }}>
                      {cat?.icon || '📍'}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-text-dim mt-2">Each emoji represents a registered business with GPS data.</p>
            </div>
          </div>
        )}

        {/* Businesses Tab */}
        {activeTab === 'businesses' && (
          <div className="elite-glass rounded-2xl overflow-hidden spatial-card">
            <div className="p-5 border-b border-border bg-card-2/50 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Businesses</h2>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{filteredSalons.length}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-dim">
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Type</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Info</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">State</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Services</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSalons.map(s => {
                    const isSuspended = s.isStopped;
                    const cat = BUSINESS_CATEGORIES.find(c => c.id === s.businessType);
                    return (
                      <tr key={s.uid} className="hover:bg-card-2/50 transition-colors">
                        <td className="p-4 text-2xl">{cat?.icon || '🏪'}</td>
                        <td className="p-4">
                          <p className="font-bold">{s.businessName || s.salonName}</p>
                          <p className="text-text-dim text-xs">{s.name} • {cat?.label || 'Business'}</p>
                          <p className="text-text-dim text-xs">📍 {s.location || 'No location'}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded inline-flex text-xs font-bold ${
                            isSuspended ? 'bg-danger/10 text-danger' :
                            s.isOpen ? 'bg-success/10 text-success' : 'bg-border text-text'
                          }`}>
                            {isSuspended ? 'SUSPENDED' : s.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </td>
                        <td className="p-4 text-text-dim font-medium">{s.services?.length || 0}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => suspendSalon(s.uid, isSuspended)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSuspended ? 'bg-success text-white hover:bg-success/90' : 'bg-danger/10 text-danger hover:bg-danger/20'
                            }`}
                          >
                            {isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="elite-glass rounded-2xl overflow-hidden spatial-card">
            <div className="p-5 border-b border-border bg-card-2/50 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Tokens</h2>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{filteredTokens.length}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-dim">
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Token #</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Customer</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Business</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Date</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Status</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Price</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTokens.map((t: any) => (
                    <tr key={t.id} className="hover:bg-card-2/50 transition-colors">
                      <td className="p-4 font-bold text-primary">#{t.tokenNumber}</td>
                      <td className="p-4">
                        <p className="font-medium">{t.customerName}</p>
                        <p className="text-text-dim text-xs">{t.customerPhone}</p>
                      </td>
                      <td className="p-4 text-text-dim">{t.salonName}</td>
                      <td className="p-4 text-text-dim text-xs">{t.date}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          t.status === 'completed' ? 'bg-success/10 text-success' :
                          t.status === 'serving' ? 'bg-accent/10 text-accent' :
                          t.status === 'cancelled' ? 'bg-danger/10 text-danger' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {t.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-bold">₹{t.totalPrice || 0}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => deleteToken(t.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastDocs.tokens && (
              <div className="p-4 text-center border-t border-border bg-card-2/20">
                <button onClick={() => loadMore('tokens')} disabled={loadingMore.tokens} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                  {loadingMore.tokens ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="elite-glass rounded-2xl overflow-hidden spatial-card">
            <div className="p-5 border-b border-border bg-card-2/50 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Customers</h2>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{enrichedCustomers.length}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-dim">
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Name</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Phone</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Email</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrichedCustomers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-card-2/50 transition-colors">
                      <td className="p-4 font-bold">{c.name || 'N/A'}</td>
                      <td className="p-4 text-text-dim">{c.phone || 'N/A'}</td>
                      <td className="p-4 text-text-dim">{c.email || 'N/A'}</td>
                      <td className="p-4 text-text-dim text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastDocs.customers && (
              <div className="p-4 text-center border-t border-border bg-card-2/20">
                <button onClick={() => { loadMore('customers'); loadMore('users'); }} disabled={loadingMore.customers} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                  {loadingMore.customers ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="elite-glass rounded-2xl overflow-hidden spatial-card">
            <div className="p-5 border-b border-border bg-card-2/50 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Products</h2>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{filteredProducts.length}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {filteredProducts.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{p.name}</h3>
                    <button 
                      onClick={() => deleteProduct(p.id)}
                      className="text-danger text-xs hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-text-dim text-xs mb-2">{p.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">₹{p.price}</span>
                    <span className="text-xs text-text-dim">Stock: {p.stock || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            {lastDocs.products && (
              <div className="p-4 text-center border-t border-border bg-card-2/20">
                <button onClick={() => loadMore('products')} disabled={loadingMore.products} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                  {loadingMore.products ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="elite-glass rounded-2xl overflow-hidden spatial-card">
            <div className="p-5 border-b border-border bg-card-2/50 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Reviews</h2>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{filteredReviews.length}</div>
            </div>
            <div className="divide-y divide-border">
              {filteredReviews.map((r: any) => (
                <div key={r.id} className="p-5 hover:bg-card-2/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{r.customerName}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-xs ${s <= r.rating ? 'text-gold' : 'text-border'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteReview(r.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-danger/10 text-danger hover:bg-danger/20"
                    >
                      Delete
                    </button>
                  </div>
                  {r.comment && <p className="text-text-dim text-sm">{r.comment}</p>}
                  <p className="text-text-dim text-xs mt-2">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
