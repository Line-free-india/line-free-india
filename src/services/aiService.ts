import { TokenEntry } from '../store/AppContext';

export interface PeakPeriod {
  hour: string;
  count: number;
  load: number;
  suggestedStaff: number;
}

export interface DemandPrediction {
  expectedCustomers: number;
  peakHours: string[];
  peakHourlyDistribution: PeakPeriod[];
  recommendation: string;
  confidence: number;
}

export interface StaffingRecommendation {
  recommendedStaff: number;
  peakPeriods: PeakPeriod[];
  suggestion: string;
}

export interface ChurnCustomer {
  id: string;
  name: string;
  daysSinceLastVisit: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RevenueInsight {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  insight: string;
  forecast: number;
  avgTicketSize: number;
}

export interface BusinessInsightItem {
  id: string;
  type: 'success' | 'warning' | 'tip';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface MarketingCampaignResult {
  whatsappCopy: string;
  smsCopy: string;
  instagramCaption: string;
  suggestedAudience: string;
}

// ═══════════════════════════════════════════════════════════
// 1. DYNAMIC HISTORICAL DATA & DURATION ANALYSIS
// ═══════════════════════════════════════════════════════════

/**
 * Computes actual average service duration from completed tokens.
 * Filters out unreasonable outliers (< 5m or > 180m).
 */
export function calculateHistoricalAvgDuration(tokens: TokenEntry[]): number {
  const completed = tokens.filter(t => t.status === 'done' && t.totalTime && t.totalTime >= 5 && t.totalTime <= 180);
  if (completed.length < 3) {
    return 20; // Default baseline in minutes
  }
  const total = completed.reduce((sum, t) => sum + (t.totalTime || 20), 0);
  return Math.round(total / completed.length);
}

/**
 * Analyzes tokens by hour of day (0-23) based on creation timestamp.
 */
export function calculatePeakHoursFromHistory(tokens: TokenEntry[]): PeakPeriod[] {
  const hourCounts: { [hour: number]: number } = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;

  for (const token of tokens) {
    if (token.createdAt) {
      const hour = new Date(token.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  }

  const maxCount = Math.max(1, ...Object.values(hourCounts));
  const periods: PeakPeriod[] = [];

  // Working business hours: 8 AM to 10 PM (8 to 22)
  for (let h = 8; h <= 22; h++) {
    const count = hourCounts[h] || 0;
    const load = Math.round((count / maxCount) * 100);
    const formattedHour = `${h.toString().padStart(2, '0')}:00`;
    // Suggest 1 staff per 2-3 customers per hour (assuming 25-30 min services)
    const suggestedStaff = Math.max(1, Math.ceil(count / 2));
    
    periods.push({
      hour: formattedHour,
      count,
      load,
      suggestedStaff
    });
  }

  return periods;
}

// ═══════════════════════════════════════════════════════════
// 2. DYNAMIC QUEUE WAIT & DEMAND PREDICTION
// ═══════════════════════════════════════════════════════════

/**
 * Calculates smart queue wait time factoring in active staff,
 * queue length, and historical service duration.
 */
export function predictQueueWait(params: {
  currentQueue: TokenEntry[];
  historicalTokens?: TokenEntry[];
  activeStaff: number;
  queueDelay?: number;
  requestedServiceDuration?: number;
}): { predictedMinutes: number; confidence: number; explanation: string } {
  const staff = Math.max(1, params.activeStaff || 1);
  const avgDuration = params.historicalTokens && params.historicalTokens.length >= 3
    ? calculateHistoricalAvgDuration(params.historicalTokens)
    : 20;

  let totalQueueTime = 0;
  for (const token of params.currentQueue) {
    if (token.status === 'waiting') {
      totalQueueTime += token.totalTime || avgDuration;
    } else if (token.status === 'serving') {
      // In-progress customer: assume ~50% remaining
      totalQueueTime += Math.round((token.totalTime || avgDuration) * 0.5);
    }
  }

  let waitMinutes = Math.round(totalQueueTime / staff);
  if (params.queueDelay) {
    waitMinutes += params.queueDelay;
  }

  const confidence = params.historicalTokens && params.historicalTokens.length >= 10 ? 92 : 75;
  const explanation = `${params.currentQueue.filter(t => t.status === 'waiting').length} in line across ${staff} staff chair${staff > 1 ? 's' : ''}`;

  return {
    predictedMinutes: Math.max(0, waitMinutes),
    confidence,
    explanation
  };
}

/**
 * Predicts customer demand and peak hours from historical tokens.
 */
export function predictDemand(params: {
  historicalTokens: TokenEntry[];
  targetDate?: Date;
}): DemandPrediction {
  const tokens = params.historicalTokens || [];
  if (tokens.length === 0) {
    return {
      expectedCustomers: 15,
      peakHours: ['11:00', '18:00'],
      peakHourlyDistribution: [],
      recommendation: 'Not enough historical data yet. Peak hours typically occur around 11:00 AM and 6:00 PM.',
      confidence: 50
    };
  }

  // Count unique dates in tokens
  const uniqueDates = new Set(tokens.map(t => t.date || new Date(t.createdAt).toISOString().split('T')[0]));
  const dayCount = Math.max(1, uniqueDates.size);
  const avgCustomersPerDay = Math.round(tokens.length / dayCount);

  // Target day analysis (e.g. weekend vs weekday multiplier)
  const targetDate = params.targetDate || new Date();
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 1.35 : 1.0;
  const expectedCustomers = Math.round(avgCustomersPerDay * weekendMultiplier);

  // Peak hourly distribution
  const peakHourlyDistribution = calculatePeakHoursFromHistory(tokens);
  // Sort descending by load to identify top rush hours
  const sorted = [...peakHourlyDistribution].sort((a, b) => b.count - a.count);
  const topHours = sorted.slice(0, 3).filter(p => p.count > 0).map(p => p.hour);
  const peakHours = topHours.length > 0 ? topHours : ['11:00', '18:00'];

  let recommendation = '';
  if (isWeekend) {
    recommendation = `Weekend rush expected (~${expectedCustomers} customers). Maintain maximum staff coverage during ${peakHours.join(', ')}.`;
  } else {
    recommendation = `Moderate weekday volume expected (~${expectedCustomers} customers). Primary rushes typically form at ${peakHours.join(' and ')}.`;
  }

  return {
    expectedCustomers,
    peakHours,
    peakHourlyDistribution,
    recommendation,
    confidence: Math.min(95, 60 + dayCount * 3)
  };
}

/**
 * Recommends staffing levels based on peak load periods.
 */
export function recommendStaffing(params: {
  historicalTokens: TokenEntry[];
  currentStaff: number;
  targetDate?: Date;
}): StaffingRecommendation {
  const demand = predictDemand({ historicalTokens: params.historicalTokens, targetDate: params.targetDate });
  const maxStaffRequired = Math.max(1, ...demand.peakHourlyDistribution.map(p => p.suggestedStaff));
  const current = Math.max(1, params.currentStaff);

  let suggestion = '';
  if (maxStaffRequired > current) {
    suggestion = `Peak periods require at least ${maxStaffRequired} staff members. Consider adding ${maxStaffRequired - current} more staff during ${demand.peakHours.join(', ')} to prevent customer drop-offs.`;
  } else if (maxStaffRequired < current) {
    suggestion = `Current staffing of ${current} easily covers peak loads. Consider rotating staff shifts during off-peak hours (1:00 PM - 4:00 PM).`;
  } else {
    suggestion = `Your current staffing level of ${current} aligns well with historical peak customer arrival rates.`;
  }

  return {
    recommendedStaff: maxStaffRequired,
    peakPeriods: demand.peakHourlyDistribution,
    suggestion
  };
}

// ═══════════════════════════════════════════════════════════
// 3. CHURN DETECTION & REVENUE INTELLIGENCE
// ═══════════════════════════════════════════════════════════

export function detectChurn(params: {
  customers: { id: string; name?: string; lastVisit: string; totalVisits: number; avgDaysBetweenVisits: number }[];
}): { atRisk: ChurnCustomer[]; suggestion: string } {
  const now = Date.now();
  const atRisk: ChurnCustomer[] = [];

  for (const c of params.customers) {
    const lastVisitMs = new Date(c.lastVisit).getTime();
    const daysSince = Math.max(0, Math.floor((now - lastVisitMs) / (1000 * 3600 * 24)));
    const baseline = Math.max(14, c.avgDaysBetweenVisits || 21);

    let riskScore = 0;
    if (daysSince > baseline * 2) riskScore = 85;
    else if (daysSince > baseline * 1.5) riskScore = 60;
    else if (daysSince > baseline * 1.2) riskScore = 35;

    if (riskScore >= 35) {
      atRisk.push({
        id: c.id,
        name: c.name || 'Customer',
        daysSinceLastVisit: daysSince,
        riskScore,
        riskLevel: riskScore >= 75 ? 'high' : riskScore >= 50 ? 'medium' : 'low'
      });
    }
  }

  // Sort highest risk first
  atRisk.sort((a, b) => b.riskScore - a.riskScore);

  let suggestion = 'All customer visit cadences are healthy.';
  if (atRisk.length > 0) {
    suggestion = `${atRisk.length} customer${atRisk.length > 1 ? 's are' : ' is'} at risk of churn. Send a 15-20% comeback discount on WhatsApp to retain them.`;
  }

  return { atRisk, suggestion };
}

export function analyzeRevenue(params: {
  dailyRevenue: { date: string; amount: number; customerCount?: number }[];
}): RevenueInsight {
  const rev = params.dailyRevenue;
  if (!rev || rev.length < 2) {
    return {
      trend: 'stable',
      percentage: 0,
      insight: 'Add more daily transactions to generate revenue trend insights.',
      forecast: rev && rev.length === 1 ? rev[0].amount : 0,
      avgTicketSize: 0
    };
  }

  const recent = rev[rev.length - 1].amount || 0;
  const previous = rev[rev.length - 2].amount || 0;
  const diff = recent - previous;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (diff > 50) trend = 'up';
  else if (diff < -50) trend = 'down';

  const percentage = previous > 0 ? Math.round((Math.abs(diff) / previous) * 100) : (recent > 0 ? 100 : 0);

  // Calculate average ticket size
  const totalRev = rev.reduce((s, r) => s + (r.amount || 0), 0);
  const totalCust = rev.reduce((s, r) => s + (r.customerCount || 1), 0);
  const avgTicketSize = totalCust > 0 ? Math.round(totalRev / totalCust) : 0;

  // 7-day weighted forecast
  const recentSlice = rev.slice(-7);
  const sliceAvg = recentSlice.reduce((s, r) => s + r.amount, 0) / recentSlice.length;
  const growthMultiplier = trend === 'up' ? 1.05 : trend === 'down' ? 0.95 : 1.0;
  const forecast = Math.round(sliceAvg * growthMultiplier);

  let insight = '';
  if (trend === 'up') {
    insight = `Revenue is up +${percentage}% compared to the previous period! Ticket size averages ₹${avgTicketSize}.`;
  } else if (trend === 'down') {
    insight = `Revenue dipped by ${percentage}% from the previous day. Promote off-peak deals to boost walk-ins.`;
  } else {
    insight = `Revenue is holding steady around ₹${recent}. Average spend per customer is ₹${avgTicketSize}.`;
  }

  return {
    trend,
    percentage,
    insight,
    forecast,
    avgTicketSize
  };
}

// ═══════════════════════════════════════════════════════════
// 4. AI SALON CO-PILOT: REAL-TIME BUSINESS INSIGHTS
// ═══════════════════════════════════════════════════════════

export function generateBusinessInsights(params: {
  stats: { totalCustomersServed: number; totalRevenue: number; avgWaitMinutes?: number; cancellationRate?: number };
  businessName: string;
  businessCategory?: string;
  activeStaffCount: number;
}): { insights: BusinessInsightItem[] } {
  const insights: BusinessInsightItem[] = [];
  const { stats, businessName, activeStaffCount } = params;

  // 1. Wait Time Efficiency Check
  if (stats.avgWaitMinutes && stats.avgWaitMinutes > 35) {
    insights.push({
      id: 'wait_bottleneck',
      type: 'warning',
      title: 'Queue Bottleneck Detected',
      message: `Average wait time is ${stats.avgWaitMinutes} minutes. Consider enabling Tatkal priority booking or adding temporary chairs to avoid walk-outs.`,
      actionLabel: 'Manage Queue',
      actionRoute: '/barber/customers'
    });
  } else {
    insights.push({
      id: 'wait_healthy',
      type: 'success',
      title: 'Fast Queue Turnaround',
      message: `Customers are being served quickly (${stats.avgWaitMinutes || 15}m average wait). High turnaround drives repeat bookings!`,
    });
  }

  // 2. Staff Utilization
  const revPerStaff = activeStaffCount > 0 ? Math.round(stats.totalRevenue / activeStaffCount) : 0;
  if (revPerStaff > 0) {
    insights.push({
      id: 'staff_efficiency',
      type: 'tip',
      title: 'Staff Revenue Contribution',
      message: `Each active staff member generates approximately ₹${revPerStaff} in service revenue today.`,
      actionLabel: 'Staff Analytics',
      actionRoute: '/barber/analytics'
    });
  }

  // 3. Promotional Advice
  insights.push({
    id: 'promo_opportunity',
    type: 'tip',
    title: 'Off-Peak Marketing Opportunity',
    message: `Send an instant 15% discount link to past customers on WhatsApp to fill midday slots between 1:00 PM and 4:00 PM.`,
    actionLabel: 'Send WhatsApp Deal',
    actionRoute: '/barber/whatsapp-crm'
  });

  return { insights };
}

// ═══════════════════════════════════════════════════════════
// 5. 1-CLICK AI REVIEW REPLY GENERATOR (GEMINI + FALLBACK)
// ═══════════════════════════════════════════════════════════

export async function generateReviewReply(params: {
  rating: number;
  customerName?: string;
  comment?: string;
  businessName?: string;
  service?: string;
}): Promise<{ replyText: string; sentiment: 'positive' | 'neutral' | 'negative'; tone: string }> {
  const customer = params.customerName?.trim() || 'Valued Customer';
  const business = params.businessName?.trim() || 'Our Team';
  const comment = params.comment?.trim() || '';
  const rating = params.rating;

  // Check if Gemini API key is configured
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are the owner of "${business}". Write a polite, authentic, and professional reply (under 50 words) to a customer review.
Customer: ${customer}
Rating: ${rating}/5 stars
Review: "${comment || 'No written comment, just star rating'}"
Service: ${params.service || 'general service'}

Rules:
- For 5 stars: Be grateful, warm, and invite them back.
- For 3-4 stars: Thank them, address any implied or expressed delay or issue, and assure continuous improvement.
- For 1-2 stars: Apologize sincerely, take ownership without being defensive, and invite them to reach out directly to make it right.
Output ONLY the reply text.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return {
            replyText: text,
            sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
            tone: rating >= 4 ? 'Delighted & Welcoming' : rating === 3 ? 'Professional & Courteous' : 'Empathetic & Solution-Oriented'
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call skipped or failed, using smart contextual engine:', err);
    }
  }

  // ── High-Quality Smart Engine Fallback ──
  let replyText = '';
  if (rating === 5) {
    const fiveStarReplies = [
      `Hi ${customer}, thank you so much for the 5-star review! ⭐ We're delighted you had a wonderful experience at ${business}. We can't wait to welcome you back again soon!`,
      `Thank you, ${customer}! Your positive words mean the world to our team at ${business}. Looking forward to serving you again on your next visit! 🙏`,
      `Hi ${customer}! We truly appreciate your feedback and 5-star rating. Providing exceptional service is our passion at ${business}. See you soon!`
    ];
    replyText = fiveStarReplies[Math.floor(Math.random() * fiveStarReplies.length)];
  } else if (rating === 4) {
    replyText = `Thank you ${customer} for visiting ${business} and giving us 4 stars! We're glad you had a good experience, and we're committed to making your next visit a solid 5-star one! 😊`;
  } else if (rating === 3) {
    replyText = `Dear ${customer}, thank you for taking the time to share your feedback. We appreciate your patronage at ${business}. We're actively refining our queue flow and service speed to deliver a 5-star experience for you next time!`;
  } else {
    // 1 or 2 stars
    replyText = `Hello ${customer}, we sincerely apologize that your experience did not meet your expectations. At ${business}, customer satisfaction is our highest priority. Please contact our manager directly on WhatsApp or visit us so we can make this right for you.`;
  }

  return {
    replyText,
    sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
    tone: rating >= 4 ? 'Delighted & Welcoming' : rating === 3 ? 'Professional & Courteous' : 'Empathetic & Solution-Oriented'
  };
}

// ═══════════════════════════════════════════════════════════
// 6. AI MARKETING CAMPAIGN & WHATSAPP COPY GENERATOR
// ═══════════════════════════════════════════════════════════

export function generateMarketingCampaign(params: {
  occasion: string;
  discountPercent: number;
  businessName: string;
  serviceName?: string;
  bookingUrl?: string;
}): MarketingCampaignResult {
  const { occasion, discountPercent, businessName, serviceName, bookingUrl } = params;
  const link = bookingUrl || 'https://linefree.in';
  const service = serviceName ? ` on ${serviceName}` : '';

  let occasionHeader = 'Exclusive Celebration Offer! 🎉';
  if (occasion.toLowerCase().includes('diwali')) occasionHeader = 'Shubh Deepavali Special! 🪔✨';
  else if (occasion.toLowerCase().includes('eid')) occasionHeader = 'Eid Mubarak Special! 🌙✨';
  else if (occasion.toLowerCase().includes('holi')) occasionHeader = 'Rangon Ka Tyohar - Holi Deal! 🎨';
  else if (occasion.toLowerCase().includes('weekend')) occasionHeader = 'Weekend Self-Care Special! 💇‍♂️💆‍♀️';
  else if (occasion.toLowerCase().includes('weekday') || occasion.toLowerCase().includes('monsoon')) occasionHeader = 'Happy Hours Refresh! ☕✨';

  const whatsappCopy = `*${occasionHeader}*

Hello from *${businessName}*! 👋

Skip the lines and treat yourself today. We're offering an exclusive *${discountPercent}% OFF*${service}! 🔥

✨ Instant Digital Token
⏳ Zero Waiting Time in Queue
💎 Premium Hygienic Service

📍 Reserve your priority slot now:
👉 ${link}

_Valid for a limited time. Show this message at check-in._`;

  const smsCopy = `${occasionHeader} Get ${discountPercent}% OFF${service} at ${businessName}! Skip the rush & book your live token now: ${link}`;

  const instagramCaption = `Ready to glow? ✨ Take ${discountPercent}% OFF${service} at ${businessName}! 🌟 Tap the link in bio to book your line-free appointment today. #LineFree #SalonCare #${businessName.replace(/\s+/g, '')} #SelfCare`;

  return {
    whatsappCopy,
    smsCopy,
    instagramCaption,
    suggestedAudience: discountPercent >= 20 ? 'All past customers & inactive churn risks' : 'Frequent VIP customers'
  };
}
