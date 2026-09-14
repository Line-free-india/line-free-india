import { jsPDF } from 'jspdf';
import type { DayStat, BusinessProfile, BarberProfile } from '../store/AppContext';

// ── Color tuples ──
const PRIMARY:   [number,number,number] = [99, 102, 241];
const SUCCESS:   [number,number,number] = [34, 197, 94];
const DANGER:    [number,number,number] = [239, 68, 68];
const GOLD:      [number,number,number] = [234, 179, 8];
const BG_LIGHT:  [number,number,number] = [248, 250, 252];
const TEXT_DARK: [number,number,number] = [15, 23, 42];
const TEXT_MID:  [number,number,number] = [100, 116, 139];

// Helper — pick one of two color tuples based on condition
function pick(cond: boolean, a: [number,number,number], b: [number,number,number]): [number,number,number] {
  return cond ? a : b;
}

export async function generateMonthlyReport(
  stats: DayStat[],
  barber: BusinessProfile,
  month: string
): Promise<void> {
  if (!stats || stats.length === 0) {
    console.warn('No data available for this range.');
    return;
  }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 16;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > 277) { doc.addPage(); y = margin; }
  };

  const setFill   = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
  const setStroke = (c: [number,number,number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const setTxt    = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);

  // ── Header banner ──
  setFill(PRIMARY);
  doc.rect(0, 0, W, 48, 'F');
  setTxt([255, 255, 255]);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Line Free', margin, 20);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Monthly Revenue Report', margin, 30);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, 40);

  y = 56;

  // ── Salon Info Box ──
  setFill(BG_LIGHT);
  doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3, 'F');
  setTxt(TEXT_DARK);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(barber.salonName || 'My Salon', margin + 8, y + 11);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  setTxt(TEXT_MID);
  if (barber.name)     doc.text(`Owner: ${barber.name}`, margin + 8, y + 19);
  if (barber.location) doc.text(`${barber.location}`, margin + 8, y + 26);
  if (barber.phone)    doc.text(`${barber.phone}`, margin + 90, y + 19);
  if (barber.upiId)    doc.text(`UPI: ${barber.upiId}`, margin + 90, y + 26);

  // Month pill
  setFill(PRIMARY);
  doc.roundedRect(W - margin - 44, y + 6, 44, 14, 2, 2, 'F');
  setTxt([255, 255, 255]);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text(month, W - margin - 22, y + 15, { align: 'center' });

  y += 42;

  // ── KPI Summary ──
  const totalRevenue   = stats.reduce((s, d) => s + d.revenue, 0);
  const totalCustomers = stats.reduce((s, d) => s + d.count, 0);
  const totalCancelled = stats.reduce((s, d) => s + d.cancelled, 0);
  const activeDays     = stats.filter(d => d.count > 0).length;
  const avgDaily       = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
  const bestDay        = stats.reduce((b, d) => d.revenue > (b?.revenue ?? 0) ? d : b, stats[0]);

  const cards: { label: string; value: string; color: [number,number,number] }[] = [
    { label: 'Total Revenue',    value: `Rs.${totalRevenue.toLocaleString('en-IN')}`, color: SUCCESS },
    { label: 'Customers Served', value: `${totalCustomers}`,                          color: PRIMARY },
    { label: 'Avg / Active Day', value: `Rs.${avgDaily.toLocaleString('en-IN')}`,     color: GOLD   },
    { label: 'Cancelled Tokens', value: `${totalCancelled}`,                           color: DANGER },
  ];

  const cardW = (W - margin * 2 - 9) / 2;
  cards.forEach((c, i) => {
    const cx = margin + (i % 2) * (cardW + 9);
    const cy = y + Math.floor(i / 2) * 24;
    setFill(c.color);
    const gs = (doc as any).GState ? new (doc as any).GState({ opacity: 0.12 }) : { opacity: 0.12 };
    if ((doc as any).setGState && (doc as any).GState) {
       doc.setGState(gs as any);
    }
    doc.roundedRect(cx, cy, cardW, 20, 2, 2, 'F');
    if ((doc as any).setGState && (doc as any).GState) {
       doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }
    setStroke(c.color);
    doc.setLineWidth(0.4);
    doc.roundedRect(cx, cy, cardW, 20, 2, 2, 'S');
    setTxt(c.color);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(c.value, cx + cardW / 2, cy + 12, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    setTxt(TEXT_MID);
    doc.text(c.label, cx + cardW / 2, cy + 18, { align: 'center' });
  });

  y += 56;

  // Best Day
  if (bestDay && bestDay.revenue > 0) {
    setFill(GOLD);
    if ((doc as any).setGState && (doc as any).GState) {
       doc.setGState(new (doc as any).GState({ opacity: 0.10 }));
    }
    doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F');
    if ((doc as any).setGState && (doc as any).GState) {
       doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }
    setTxt(TEXT_DARK);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(`Best Day: ${bestDay.dayName}  —  Rs.${bestDay.revenue.toLocaleString('en-IN')} (${bestDay.count} customers)`, margin + 6, y + 9);
    y += 20;
  }

  // ── Bar Chart — Revenue ──
  checkPage(70);
  setTxt(TEXT_DARK);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Daily Revenue', margin, y);
  y += 6;

  const chartH = 36;
  const chartW = W - margin * 2;
  const maxRev = Math.max(...stats.map(d => d.revenue), 1);

  setFill(BG_LIGHT);
  doc.rect(margin, y, chartW, chartH, 'F');

  stats.forEach((d, i) => {
    const barH = Math.max(1, (d.revenue / maxRev) * (chartH - 4));
    const x = margin + i * (chartW / stats.length);
    const bw = Math.max(2, (chartW / stats.length) - 1);
    const isToday = d.date === new Date().toISOString().slice(0, 10);
    if (d.revenue > 0) {
      setFill(isToday ? PRIMARY : SUCCESS);
      doc.rect(x + 0.5, y + chartH - barH - 2, bw, barH, 'F');
    }
  });

  // Axis labels
  doc.setFontSize(5);
  setTxt(TEXT_MID);
  [0, Math.floor(stats.length / 2), stats.length - 1].forEach(idx => {
    const d = stats[idx];
    if (!d) return;
    const x = margin + idx * (chartW / stats.length);
    doc.text(d.dayName.split(',')[0] || d.dayName, x, y + chartH + 4);
  });

  y += chartH + 10;

  // ── Daily Table ──
  checkPage(20);
  setTxt(TEXT_DARK);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Daily Breakdown', margin, y);
  y += 5;

  // Table header
  setFill(PRIMARY);
  doc.rect(margin, y, W - margin * 2, 8, 'F');
  setTxt([255, 255, 255]);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('Date',          margin + 3,   y + 5.5);
  doc.text('Customers',     margin + 70,  y + 5.5);
  doc.text('Cancelled',     margin + 100, y + 5.5);
  doc.text('Revenue',       margin + 130, y + 5.5);
  doc.text('Avg/Customer',  margin + 155, y + 5.5);
  y += 8;

  // Table rows
  let rowAlt = false;
  ;[...stats].reverse().forEach(d => {
    checkPage(7);
    if (rowAlt) {
      setFill(BG_LIGHT);
      doc.rect(margin, y, W - margin * 2, 7, 'F');
    }
    rowAlt = !rowAlt;

    setTxt(TEXT_DARK);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(d.dayName, margin + 3, y + 5);

    // Customers
    setTxt(pick(d.count > 0, SUCCESS, TEXT_MID));
    doc.setFont('helvetica', d.count > 0 ? 'bold' : 'normal');
    doc.text(`${d.count}`, margin + 79, y + 5);

    // Cancelled
    setTxt(pick(d.cancelled > 0, DANGER, TEXT_MID));
    doc.setFont('helvetica', 'normal');
    doc.text(`${d.cancelled}`, margin + 109, y + 5);

    // Revenue
    setTxt(pick(d.revenue > 0, TEXT_DARK, TEXT_MID));
    doc.setFont('helvetica', d.revenue > 0 ? 'bold' : 'normal');
    doc.text(d.revenue > 0 ? `Rs.${d.revenue.toLocaleString('en-IN')}` : '—', margin + 130, y + 5);

    // Avg
    const avg = d.count > 0 ? Math.round(d.revenue / d.count) : 0;
    setTxt(TEXT_MID);
    doc.setFont('helvetica', 'normal');
    doc.text(avg > 0 ? `Rs.${avg}` : '—', margin + 162, y + 5);

    // Row divider
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, y + 7, W - margin, y + 7);
    y += 7;
  });

  // Totals row
  checkPage(10);
  setFill(PRIMARY);
  doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.rect(margin, y, W - margin * 2, 9, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  setTxt(PRIMARY);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 3, y + 6);
  setTxt(SUCCESS);
  doc.text(`${totalCustomers}`, margin + 79, y + 6);
  setTxt(DANGER);
  doc.text(`${totalCancelled}`, margin + 109, y + 6);
  setTxt(TEXT_DARK);
  doc.text(`Rs.${totalRevenue.toLocaleString('en-IN')}`, margin + 130, y + 6);
  y += 12;

  // ── Footer on every page ──
  const pages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    setFill(PRIMARY);
    doc.rect(0, 284, W, 13, 'F');
    setTxt([255, 255, 255]);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`${barber.salonName} — Line Free Report — ${month}`, margin, 292);
    doc.text(`Page ${p} of ${pages}`, W - margin, 292, { align: 'right' });
  }

  doc.save(`LineFree_Report_${month.replace(' ', '_')}.pdf`);
}

export async function generateWeeklyReport(
  stats: DayStat[],
  barber: BarberProfile,
  weekRange: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 16;
  let y = margin;

  const setFill   = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
  const setTxt    = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);

  // Header
  setFill(PRIMARY);
  doc.rect(0, 0, W, 40, 'F');
  setTxt([255, 255, 255]);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Growth Pulse', margin, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Weekly Performance Extract', margin, 26);
  doc.text(`Window: ${weekRange}`, margin, 32);

  y = 50;

  // KPI Block
  const totalRev = stats.reduce((s,d) => s + d.revenue, 0);
  const totalCust = stats.reduce((s,d) => s + d.count, 0);
  
  setFill(BG_LIGHT);
  doc.roundedRect(margin, y, W - margin*2, 25, 3, 3, 'F');
  setTxt(TEXT_DARK);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(`Revenue: Rs.${totalRev.toLocaleString('en-IN')}`, margin + 8, y + 10);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Volume: ${totalCust} Customers Served`, margin + 8, y + 18);

  y += 35;

  // Day Breakdown
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  setTxt(TEXT_DARK);
  doc.text('Daily Performance Matrix', margin, y);
  y += 8;

  setFill(PRIMARY);
  doc.rect(margin, y, W-margin*2, 8, 'F');
  setTxt([255,255,255]);
  doc.setFontSize(8);
  doc.text('Day/Date', margin + 5, y + 5);
  doc.text('Customers', margin + 80, y + 5);
  doc.text('Earnings', margin + 140, y + 5);

  y += 8;
  stats.forEach((d, i) => {
    if (i % 2 === 0) { setFill(BG_LIGHT); doc.rect(margin, y, W-margin*2, 7, 'F'); }
    setTxt(TEXT_DARK);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(d.dayName, margin + 5, y + 5);
    doc.text(`${d.count}`, margin + 85, y + 5);
    doc.text(`Rs.${d.revenue}`, margin + 140, y + 5);
    y += 7;
  });

  doc.save(`GrowthPulse_Weekly_${weekRange.replace(/ /g, '_')}.pdf`);
}

export async function generateDailyReport(
  data: {
    date: string,
    revenue: number,
    expenses: number,
    profit: number,
    customers: number,
    businessName: string,
    locality: string,
    efficiency: number
  }
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;

  const setFill   = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
  const setTxt    = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);

  // Header Banner
  setFill(PRIMARY);
  doc.rect(0, 0, W, 50, 'F');
  setTxt([255, 255, 255]);
  doc.setFontSize(24); doc.setFont('helvetica', 'bold');
  doc.text('COMMAND OS', margin, 20);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Daily Operational Intelligence Report', margin, 30);
  doc.text(`Business: ${data.businessName}`, margin, 38);
  doc.text(`Locality: ${data.locality}`, margin, 44);

  // Date Tag
  setFill([255, 255, 255]);
  doc.roundedRect(W - margin - 40, 15, 40, 12, 2, 2, 'F');
  setTxt(PRIMARY);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text(data.date, W - margin - 20, 23, { align: 'center' });

  let y = 65;

  // KPI Grid
  const kpis = [
    { l: 'TOTAL REVENUE', v: `Rs.${data.revenue.toLocaleString()}`, c: SUCCESS },
    { l: 'TOTAL EXPENSES', v: `Rs.${data.expenses.toLocaleString()}`, c: DANGER },
    { l: 'NET PROFIT', v: `Rs.${data.profit.toLocaleString()}`, c: data.profit >= 0 ? SUCCESS : DANGER },
    { l: 'CUSTOMERS', v: `${data.customers}`, c: PRIMARY },
  ];

  const kw = (W - margin * 2 - 10) / 2;
  kpis.forEach((k, i) => {
    const kx = margin + (i % 2) * (kw + 10);
    const ky = y + Math.floor(i / 2) * 25;
    setFill(k.c);
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.roundedRect(kx, ky, kw, 20, 2, 2, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
    setTxt(k.c);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(k.v, kx + 5, ky + 12);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    setTxt(TEXT_MID);
    doc.text(k.l, kx + 5, ky + 17);
  });

  y += 60;

  // Efficiency Chart (Manual Rect)
  setTxt(TEXT_DARK);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Operational Efficiency', margin, y);
  y += 8;
  
  const barW = W - margin * 2;
  setFill(BG_LIGHT);
  doc.rect(margin, y, barW, 6, 'F');
  setFill(PRIMARY);
  doc.rect(margin, y, barW * (data.efficiency / 100), 6, 'F');
  
  y += 12;
  setTxt(TEXT_MID);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Efficiency Score: ${data.efficiency}%`, margin, y);
  doc.text('Based on revenue per customer and resource utilization metrics.', margin, y + 5);

  y += 25;

  // Disclaimer
  doc.setDrawColor(230, 230, 240);
  doc.line(margin, y, W - margin, y);
  y += 10;
  setTxt(TEXT_MID);
  doc.setFontSize(7);
  doc.text('This report is automatically generated by Line Free India Command OS. For internal business use only.', margin, y);
  doc.text('Any discrepancies should be reported to system administration.', margin, y + 4);

  // Footer
  setFill(PRIMARY);
  doc.rect(0, 287, W, 10, 'F');
  setTxt([255, 255, 255]);
  doc.text(`© ${new Date().getFullYear()} Line Free India - Enterprise Intelligence`, W / 2, 293, { align: 'center' });

  doc.save(`Daily_Report_${data.date.replace(/ /g, '_')}.pdf`);
}
