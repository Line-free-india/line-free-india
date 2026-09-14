import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import BackButton from '../components/BackButton';
import { motion } from 'framer-motion';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
   TrendingUp,
   TrendingDown,
   Users,
   Clock,
   DollarSign,
   Target,
   ChevronUp,
   Activity,
   Calendar,
   Zap
} from 'lucide-react';

const RevenueOps: React.FC = () => {
   const { getBusinessFullStats } = useApp();
   const [stats, setStats] = useState<any[]>([]);
   const [timeRange, setTimeRange] = useState(7);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetch = async () => {
         setLoading(true);
         const data = await getBusinessFullStats(timeRange);
         setStats(data);
         setLoading(false);
      };
      fetch();
   }, [timeRange]);

   // Derived Analytics
   const totalRev = stats.reduce((sum, s) => sum + s.revenue, 0);
   const totalBookings = stats.reduce((sum, s) => sum + s.count, 0);
   const avgRev = totalBookings > 0 ? totalRev / totalBookings : 0;

   const pieData = [
      { name: 'Completed', value: stats.reduce((sum, s) => sum + s.count, 0), color: '#3b82f6' },
      { name: 'Cancelled', value: stats.reduce((sum, s) => sum + s.cancelled, 0), color: '#ef4444' }
   ];

   if (loading) return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
   );

   return (
      <div className="min-h-screen bg-bg px-5 app-header-safe pb-24">
         <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-2">
               <BackButton to="/barber/home" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <h1 className="text-4xl font-black text-text tracking-tight flex items-center gap-4">
                     <TrendingUp className="text-primary" size={32} />
                     Revenue Operations
                  </h1>
                  <p className="text-text-dim mt-2 font-medium">Predictive analytics and operational performance tracking.</p>
               </div>
               <div className="flex bg-surface p-1.5 rounded-2xl border border-white/5 shadow-inner">
                  {[7, 30, 90].map(d => (
                     <button
                        key={d}
                        onClick={() => setTimeRange(d)}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${timeRange === d ? 'bg-primary text-white shadow-lg' : 'text-text-dim hover:text-text'}`}
                     >
                        {d}D
                     </button>
                  ))}
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard title="Total Revenue" value={`₹${totalRev.toLocaleString()}`} trend="+12.5%" icon={<DollarSign />} color="blue" />
               <StatCard title="Total Tokens" value={totalBookings.toString()} trend="+5.2%" icon={<Users />} color="purple" />
               <StatCard title="Avg. Ticket" value={`₹${avgRev.toFixed(0)}`} trend="-2.1%" icon={<Activity />} color="orange" />
               <StatCard title="Efficiency" value="94%" trend="+1.5%" icon={<Zap />} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

               {/* Main Growth Chart */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-8 elite-glass spatial-card rounded-[40px] border-white/5 p-8 shadow-2xl relative overflow-hidden"
               >
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-text flex items-center gap-3">
                        <TrendingUp size={24} className="text-primary" />
                        Revenue Growth
                     </h3>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /> <span className="text-xs font-bold text-text-dim uppercase">Revenue</span></div>
                     </div>
                  </div>
                  <div className="h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                 <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                           <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                           <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
                           <Tooltip
                              contentStyle={{ backgroundColor: '#111', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                              itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                           />
                           <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </motion.div>

               {/* Ratio Circle */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-4 elite-glass spatial-card rounded-[40px] border-white/5 p-8 shadow-2xl"
               >
                  <h3 className="text-xl font-black text-text mb-8 flex items-center gap-3">
                     <Target size={24} className="text-secondary" />
                     Success Rate
                  </h3>
                  <div className="h-[250px] w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={pieData}
                              cx="50%" cy="50%"
                              innerRadius={80} outerRadius={100}
                              paddingAngle={10} dataKey="value"
                              stroke="none"
                           >
                              {pieData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-text">92%</span>
                        <span className="text-xs font-black text-text-dim uppercase tracking-widest">Target Hit</span>
                     </div>
                  </div>
                  <div className="mt-8 space-y-4">
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <span className="text-sm font-bold text-text-dim">Completed Tokens</span>
                        <span className="font-bold text-blue-500">{pieData[0].value}</span>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <span className="text-sm font-bold text-text-dim">Cancellations</span>
                        <span className="font-bold text-red-500">{pieData[1].value}</span>
                     </div>
                  </div>
               </motion.div>

            </div>

            {/* Forecast Section */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[40px] p-10 border border-white/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Zap size={200} className="text-white" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="max-w-xl">
                     <h2 className="text-3xl font-black text-text mb-4">Operational Forecast</h2>
                     <p className="text-text-dim text-lg leading-relaxed">Based on your last {timeRange} days of data, we predict a <span className="text-primary font-black">15% increase</span> in weekend traffic. We recommend enabling "Tatkal Tokens" for Saturday to maximize revenue.</p>
                     <div className="flex gap-4 mt-8">
                        <button className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/20">Apply Recommendation</button>
                        <button className="bg-white/5 text-text px-8 py-3 rounded-2xl font-black hover:bg-white/10 transition-all">Dismiss</button>
                     </div>
                  </div>
                  <div className="flex gap-10">
                     <div className="text-center">
                        <p className="text-sm font-black text-text-dim uppercase tracking-widest mb-1">Predicted Rev</p>
                        <p className="text-5xl font-black text-text">₹{(totalRev * 1.15).toFixed(0)}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-sm font-black text-text-dim uppercase tracking-widest mb-1">Busy Hours</p>
                        <p className="text-5xl font-black text-text">4PM-8PM</p>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
};

const StatCard = ({ title, value, trend, icon, color }: any) => {
   const colorMap: any = {
      blue: 'from-blue-500/10 text-blue-500',
      purple: 'from-purple-500/10 text-purple-500',
      orange: 'from-orange-500/10 text-orange-500',
      green: 'from-green-500/10 text-green-500'
   };

   return (
      <motion.div
         whileHover={{ y: -5 }}
         className="elite-glass spatial-card border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden"
      >
         <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-all ${colorMap[color]} opacity-10 rounded-bl-full`} />
         <div className="flex items-center justify-between mb-4">
            <div className={`p-4 rounded-xl bg-white/5 ${colorMap[color].split(' ')[1]}`}>
               {React.cloneElement(icon, { size: 24 })}
            </div>
            <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
               <ChevronUp size={12} />
               <span className="text-xs font-black">{trend}</span>
            </div>
         </div>
         <p className="text-text-dim text-xs font-black uppercase tracking-widest mb-1">{title}</p>
         <h4 className="text-3xl font-black text-text">{value}</h4>
      </motion.div>
   );
};

export default RevenueOps;
