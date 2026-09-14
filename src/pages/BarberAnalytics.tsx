import { useState, useEffect } from 'react';
import { useApp, DayStat, getCategoryInfo } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import { generateMonthlyReport } from '../utils/generateReport';
import { generateBusinessInsights, analyzeRevenue } from '../services/aiService';
import { useNavigate } from 'react-router-dom';

export default function BarberAnalytics() {
  const { getBusinessFullStats, businessProfile } = useApp();
  const nav = useNavigate();
  const [range, setRange] = useState<7 | 14 | 30>(30);
  const [stats, setStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    getBusinessFullStats(range).then(d => { setStats(d); setLoading(false); });
  }, [range]);

  const totalRevenue   = stats.reduce((s, d) => s + d.revenue, 0);
  const totalCustomers = stats.reduce((s, d) => s + d.count, 0);
  const totalCancelled = stats.reduce((s, d) => s + d.cancelled, 0);
  const activeDays     = stats.filter(d => d.count > 0).length;
  const avgPerDay      = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
  const bestDay        = stats.reduce((b, d) => d.revenue > (b?.revenue || 0) ? d : b, stats[0]);
  const maxRevenue     = Math.max(...stats.map(d => d.revenue), 1);
  const cancelRate     = totalCustomers > 0 ? Math.round((totalCancelled / totalCustomers) * 100) : 0;

  // Simple insights
  const recentRevenue = stats.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prevRevenue   = stats.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
  const growth        = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  // Real-time AI Co-Pilot Analytics
  const revenueInsight = analyzeRevenue({
    dailyRevenue: stats.map(s => ({ date: s.date, amount: s.revenue, customerCount: s.count }))
  });

  const businessInsights = generateBusinessInsights({
    stats: {
      totalCustomersServed: totalCustomers,
      totalRevenue,
      avgWaitMinutes: 20,
      cancellationRate: cancelRate
    },
    businessName: businessProfile?.businessName || 'Business',
    businessCategory: businessProfile?.businessType,
    activeStaffCount: Math.max(1, businessProfile?.staffList?.filter(s => s.active !== false).length || 1)
  });

  const [reportError, setReportError] = useState('');

  const handleDownloadPDF = async () => {
    if (!businessProfile || stats.length === 0) return;
    setGenerating(true);
    setReportError('');
    try {
      const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      await generateMonthlyReport(stats, businessProfile, month);
    } catch {
      setReportError('Could not generate report.');
      setTimeout(() => setReportError(''), 3000);
    }
    setGenerating(false);
  };

  const kpi = (label: string, value: string | number, sub?: string, color?: string) => (
    <div style={{ flex: 1, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '14px 12px' }}>
      <p style={{ fontSize: 14, color: 'var(--color-text-dim)', marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--color-text)', letterSpacing: -0.5 }}>{value}</p>
      {sub && <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 160, overflowY: 'auto' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Analytics</h1>

        {/* Range selector */}
        <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 10, padding: 2, border: '1px solid var(--color-border)', width: 'fit-content' }}>
          {([{ val: 7, label: '7 days' }, { val: 14, label: '14 days' }, { val: 30, label: '30 days' }] as const).map(r => (
            <button key={r.val} onClick={() => setRange(r.val)} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: range === r.val ? 'var(--color-card)' : 'transparent',
              color: range === r.val ? 'var(--color-text)' : 'var(--color-text-dim)',
              boxShadow: range === r.val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {kpi('Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, `last ${range} days`, 'var(--color-primary)')}
            {kpi('Customers', totalCustomers, `avg ${avgPerDay > 0 ? `₹${avgPerDay}/day` : '—'}`)}
            {kpi('Cancelled', `${cancelRate}%`, `${totalCancelled} total`, cancelRate > 20 ? 'var(--color-warning)' : 'var(--color-text)')}
            {kpi('Best day', bestDay?.date ? `₹${bestDay.revenue.toLocaleString('en-IN')}` : '—', bestDay?.dayName?.split(',')[0])}
          </div>

          {/* Trend insight */}
          {Math.abs(growth) > 5 && (
            <div style={{ margin: '16px 16px 0', padding: '12px 16px', background: growth > 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,149,0,0.1)', border: `1px solid ${growth > 0 ? 'rgba(52,199,89,0.25)' : 'rgba(255,149,0,0.25)'}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{growth > 0 ? '📈' : '📉'}</span>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
                Revenue {growth > 0 ? 'up' : 'down'} <strong>{Math.abs(growth).toFixed(0)}%</strong> vs last week
              </p>
            </div>
          )}

          {/* AI Salon Co-Pilot Card */}
          <div style={{ margin: '16px 16px 0', padding: '16px', background: 'var(--color-card)', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-primary)' }}>AI Business Co-Pilot</span>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(0,240,255,0.12)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Smart Advice</span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 12, lineHeight: 1.5 }}>
              {revenueInsight.insight}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {businessInsights.insights.map(item => (
                <div key={item.id} style={{
                  padding: '10px 12px', borderRadius: 12, fontSize: 12,
                  background: item.type === 'warning' ? 'rgba(255,149,0,0.08)' : item.type === 'success' ? 'rgba(52,199,89,0.08)' : 'var(--color-bg)',
                  border: `1px solid ${item.type === 'warning' ? 'rgba(255,149,0,0.25)' : item.type === 'success' ? 'rgba(52,199,89,0.25)' : 'var(--color-border)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ flex: 1, paddingRight: 8 }}>
                    <strong style={{ color: item.type === 'warning' ? '#ff9500' : item.type === 'success' ? '#34c759' : 'var(--color-text)' }}>{item.title}: </strong>
                    <span style={{ color: 'var(--color-text-dim)' }}>{item.message}</span>
                  </div>
                  {item.actionRoute && (
                    <button 
                      onClick={() => nav(item.actionRoute!)}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      {item.actionLabel || 'View'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ margin: '16px 16px 0', padding: '16px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Revenue</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {stats.map((d, i) => {
                const h = Math.max(2, (d.revenue / maxRevenue) * 100);
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                return (
                  <div key={i} title={`${d.dayName}: ₹${d.revenue}`} style={{
                    flex: 1, height: `${h}%`, borderRadius: 4,
                    background: isToday ? 'var(--color-primary)' : d.revenue > 0 ? 'rgba(0,122,255,0.35)' : 'var(--color-bg)',
                    transition: 'height 0.3s',
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stats[0]?.date?.slice(5)}</span>
              <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>Today</span>
            </div>
          </div>

          {/* Customer count chart */}
          <div style={{ margin: '12px 16px 0', padding: '16px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Customers per day</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {stats.map((d, i) => {
                const maxC = Math.max(...stats.map(s => s.count), 1);
                const h = Math.max(2, (d.count / maxC) * 100);
                return (
                  <div key={i} title={`${d.dayName}: ${d.count}`} style={{
                    flex: 1, height: `${h}%`, borderRadius: 4,
                    background: d.count > 0 ? 'rgba(52,199,89,0.5)' : 'var(--color-bg)',
                  }} />
                );
              })}
            </div>
          </div>

          {/* Export */}
          <div style={{ padding: '16px' }}>
            <button onClick={handleDownloadPDF} disabled={generating || stats.length === 0} style={{
              width: '100%', padding: '14px', background: 'var(--color-card)',
              border: '1px solid var(--color-border)', borderRadius: 14,
              fontSize: 15, fontWeight: 500, color: 'var(--color-text)',
              cursor: stats.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: stats.length === 0 ? 0.5 : 1,
            }}>
              <span>📄</span>
              {generating ? 'Generating...' : 'Download Monthly Report PDF'}
            </button>

            <button onClick={() => {
              const msg = `Business report for ${businessProfile?.businessName}: Revenue ₹${totalRevenue.toLocaleString('en-IN')} | Customers: ${totalCustomers} | Powered by Line Free India`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }} style={{
              width: '100%', marginTop: 10, padding: '14px',
              background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)',
              borderRadius: 14, fontSize: 15, fontWeight: 500, color: '#25D366',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span>💬</span> Share Summary on WhatsApp
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
