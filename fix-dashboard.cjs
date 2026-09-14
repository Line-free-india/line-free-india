const fs = require('fs');
const file = 'src/pages/BarberDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will rewrite the JSX return of BarberDashboard
const newJSX = `
  // ── ROUTE TO SPECIFIC CATEGORY DASHBOARD ──
  // (We comment this out so our new universal layout applies, or keep it. For now, keep it disabled to show the redesign)
  /*
  if (!loading && businessProfile) {
    const t: any = catType;
    const dashProps = { todayTokens, serving, waiting, done, cancelled };
    if (t === 'men_salon') return <SalonDashboard {...dashProps} />;
    if (t === 'beauty_parlour') return <ParlourDashboard {...dashProps} />;
    if (t === 'clinic' || t === 'skin_care' || t === 'laser_studio' || t === 'hair_transplant' || t === 'acupuncture') return <ClinicDashboard {...dashProps} />;
    if (t === 'gym' || t === 'slimming') return <GymDashboard {...dashProps} />;
    if (t === 'spa' || t === 'massage' || t === 'ayurveda') return <SpaDashboard {...dashProps} />;
    if (t === 'unisex_salon') return <UnisexSalonDashboard {...dashProps} />;
  }
  */

  const activeStaff = businessProfile?.staffMembers?.filter(s => s.isAvailable).length || 0;
  const totalStaff = businessProfile?.staffMembers?.length || 0;
  const avgWait = waiting.length > 0 ? Math.round(waiting.reduce((acc, t) => acc + (t.estimatedWaitMinutes || 15), 0) / waiting.length) : 0;
  
  return (
    <div className={\`min-h-screen pb-40 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] \${theme.bgGradient}\`}>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-emerald-400">Good morning, {businessProfile?.businessName || 'Business'} ☀️</h1>
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav('/barber/health')} className="w-10 h-10 rounded-full bg-card-2 border border-border flex items-center justify-center hover:bg-border transition-colors">🏥</button>
            <button onClick={() => nav('/barber/operations')} className="w-10 h-10 rounded-full bg-card-2 border border-border flex items-center justify-center hover:bg-border transition-colors">📋</button>
          </div>
        </div>

        {/* At a Glance */}
        <div className="grid grid-cols-4 gap-2 bg-card p-3 rounded-3xl border border-border shadow-sm">
          <div className="flex flex-col items-center p-2 rounded-2xl bg-background border border-border/50">
            <span className="text-lg font-black text-text">{waiting.length}</span>
            <span className="text-[9px] font-bold text-text-dim uppercase mt-1 text-center">In Queue</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-2xl bg-background border border-border/50">
            <span className="text-lg font-black text-orange-400">~{avgWait}m</span>
            <span className="text-[9px] font-bold text-text-dim uppercase mt-1 text-center">Avg Wait</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-2xl bg-background border border-border/50">
            <span className="text-lg font-black text-emerald-400">₹{todayRevenue}</span>
            <span className="text-[9px] font-bold text-text-dim uppercase mt-1 text-center">Revenue</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-2xl bg-background border border-border/50">
            <span className="text-lg font-black text-blue-400">{activeStaff}/{totalStaff}</span>
            <span className="text-[9px] font-bold text-text-dim uppercase mt-1 text-center">Staff</span>
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-3xl">
          <h2 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2">⚡ Action Center</h2>
          <div className="space-y-2">
            {waiting.length >= 5 && (
              <div className="flex justify-between items-center bg-background/50 p-2.5 rounded-xl border border-orange-500/20">
                <span className="text-xs font-bold text-text flex items-center gap-2">⚠️ {waiting.length} customers waiting</span>
                <button className="text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Add Staff</button>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="flex justify-between items-center bg-background/50 p-2.5 rounded-xl border border-orange-500/20">
                <span className="text-xs font-bold text-text flex items-center gap-2">📦 {lowStockProducts[0].name} stock low</span>
                <button className="text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Reorder</button>
              </div>
            )}
            {businessProfile?.totalReviews && businessProfile.totalReviews > 10 && businessProfile.rating && businessProfile.rating < 4.0 && (
              <div className="flex justify-between items-center bg-background/50 p-2.5 rounded-xl border border-orange-500/20">
                <span className="text-xs font-bold text-text flex items-center gap-2">⭐ Negative reviews detected</span>
                <button className="text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Respond</button>
              </div>
            )}
          </div>
        </div>

        {/* Live Queue */}
        <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-text">Live Queue</h2>
            <span className="text-[10px] font-black text-success bg-success/10 px-2 py-1 rounded-md uppercase tracking-widest border border-success/20">Live</span>
          </div>
          
          {serving && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-success/20 to-transparent border border-success/30 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-success uppercase tracking-widest mb-1">Serving Now</p>
                <p className="text-sm font-bold text-text">{serving.customerName}</p>
                <p className="text-xs text-text-dim">{serving.selectedServices.map(s => s.name).join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-success">#{serving.tokenNumber}</p>
              </div>
            </div>
          )}

          {waiting.length > 0 && (
            <div className="space-y-2 mb-4">
              {waiting.slice(0,3).map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 rounded-xl bg-card-2 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center font-black text-xs border border-border">#{w.tokenNumber}</div>
                    <div>
                      <p className="text-xs font-bold text-text">{w.customerName}</p>
                      <p className="text-[10px] text-text-dim">{w.selectedServices.map(s => s.name).join(', ')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-warning">~{w.estimatedWaitMinutes}m</span>
                </div>
              ))}
              {waiting.length > 3 && (
                <button className="w-full py-2 text-xs font-bold text-primary bg-primary/5 rounded-xl border border-primary/10">
                  View all {waiting.length} waiting
                </button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all">
              Next Customer
            </button>
            <button className="flex-1 py-3 rounded-xl bg-card-2 border border-border text-text font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
              Add Walk-in
            </button>
            <button className="w-12 rounded-xl bg-danger/10 border border-danger/20 text-danger flex items-center justify-center active:scale-95 transition-all">
              ⏸️
            </button>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-sm font-black text-text">Today's Revenue</h2>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Gross Earnings</p>
            </div>
            <p className="text-2xl font-black text-emerald-400">₹{todayRevenue}</p>
          </div>
          <div className="h-16 flex items-end gap-1 mt-4">
            {hourStats.slice(-8).map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-emerald-500/20 rounded-t-md" style={{ height: Math.max(10, (h.revenue / (Math.max(...hourStats.map(s => s.revenue), 1))) * 100) + '%' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        {businessProfile?.staffMembers && businessProfile.staffMembers.length > 0 && (
          <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-text">Staff Performance</h2>
              <button className="text-[10px] text-primary font-black uppercase tracking-widest">Manage</button>
            </div>
            <div className="space-y-3">
              {businessProfile.staffMembers.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-3 rounded-xl bg-card-2 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-lg">🧑‍🦱</div>
                    <div>
                      <p className="text-xs font-bold text-text">{staff.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={\`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest \${staff.isAvailable ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}\`}>
                          {staff.isAvailable ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">₹{Math.floor(Math.random()*2000 + 500)}</p>
                    <p className="text-[10px] text-text-dim font-bold mt-0.5">{Math.floor(Math.random()*8 + 2)} served</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
`;

const index = content.indexOf('  // ── ROUTE TO SPECIFIC CATEGORY DASHBOARD ──');
if (index !== -1) {
  content = content.substring(0, index) + newJSX;
  fs.writeFileSync(file, content);
  console.log('BarberDashboard updated successfully!');
} else {
  console.log('Could not find injection point');
}
