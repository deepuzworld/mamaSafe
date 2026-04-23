'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    ChevronRight, 
    Activity, 
    Moon, 
    BookOpen, 
    Search, 
    Plus, 
    Sparkles, 
    Smile, 
    PenTool, 
    AlertTriangle,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar as CalendarIcon,
    Filter,
    Flame
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function HealthLogsPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch('/core-api/tracking/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                console.error('Fetch history failed:', await res.text());
                return;
            }

            const data = await res.json();
            if (data.success && data.History) {
                const combined = [
                    ...data.History.moods.map((m: any) => ({ ...m, type: 'mood' })),
                    ...data.History.sleeps.map((s: any) => ({ ...s, type: 'sleep' })),
                    ...data.History.journals.map((j: any) => ({ ...j, type: 'journal' }))
                ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                setHistory(combined);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'daily') newDate.setDate(newDate.getDate() + 1);
        else if (viewMode === 'weekly') newDate.setDate(newDate.getDate() + 7);
        else if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'daily') newDate.setDate(newDate.getDate() - 1);
        else if (viewMode === 'weekly') newDate.setDate(newDate.getDate() - 7);
        else if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const getDateLabel = () => {
        if (viewMode === 'daily') {
            return currentDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
        } else if (viewMode === 'weekly') {
            const start = getStartOfWeek(currentDate);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        }
    };

    const filteredHistory = history.filter(log => {
        const logDate = new Date(log.createdAt);
        
        // Filter by Date
        let insideTimeRange = true;
        if (viewMode === 'daily') {
            insideTimeRange = logDate.toDateString() === currentDate.toDateString();
        } else if (viewMode === 'weekly') {
            const start = getStartOfWeek(currentDate);
            start.setHours(0,0,0,0);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23,59,59,999);
            insideTimeRange = logDate >= start && logDate <= end;
        } else if (viewMode === 'monthly') {
            insideTimeRange = logDate.getMonth() === currentDate.getMonth() && logDate.getFullYear() === currentDate.getFullYear();
        }

        if (!insideTimeRange) return false;

        // Filter by Search Query
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (log.type === 'mood') return log.notes?.toLowerCase().includes(q) || log.moodScore?.toString().includes(q);
        if (log.type === 'sleep') return log.hoursSlept?.toString().includes(q);
        if (log.type === 'journal') return log.content?.toLowerCase().includes(q) || log.entryType?.toLowerCase().includes(q);
        return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getMoodEmoji = (score: number) => {
        if (score >= 9) return "😄";
        if (score >= 7) return "🙂";
        if (score >= 5) return "😐";
        if (score >= 3) return "😞";
        return "😢";
    };

    const getLogColor = (log: any) => {
        if (log.type === 'mood') {
            if (log.moodScore >= 9) return 'bg-emerald-50 text-emerald-700 border-emerald-100'; 
            if (log.moodScore >= 7) return 'bg-lime-50 text-lime-700 border-lime-100'; 
            if (log.moodScore >= 5) return 'bg-amber-50 text-amber-700 border-amber-100'; 
            if (log.moodScore >= 3) return 'bg-orange-50 text-orange-700 border-orange-100'; 
            return 'bg-rose-50 text-rose-700 border-rose-100'; 
        }
        if (log.type === 'sleep') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        return 'bg-violet-50 text-violet-700 border-violet-100';
    };

    const getLogIcon = (type: string, score?: number) => {
        if(type === 'sleep') return <Moon size={16} className="opacity-70" />;
        if(type === 'journal') return <BookOpen size={16} className="opacity-70" />;
        return <span className="text-lg">{getMoodEmoji(score || 5)}</span>;
    };

    const getLogTitle = (log: any) => {
        if(log.type === 'sleep') return `${log.hoursSlept}h Sleep`;
        if(log.type === 'journal') return `${log.entryType} Entry`;
        return `Mood ${log.moodScore}/10`;
    };

    const moodLogs = filteredHistory.filter(l => l.type === 'mood');
    const avgMood = moodLogs.length ? parseFloat((moodLogs.reduce((acc, curr) => acc + curr.moodScore, 0) / moodLogs.length).toFixed(1)) : 0;
    
    // Simulate trend calculation (e.g. comparing to previous week mock data)
    const prevWeekAvg = 4.1; // Simulated previous week avg
    const moodTrend = avgMood > 0 ? (avgMood - prevWeekAvg).toFixed(1) : '0.0';
    const isMoodTrendUp = parseFloat(moodTrend) >= 0;

    const sleepLogs = filteredHistory.filter(l => l.type === 'sleep');
    const avgSleep = sleepLogs.length ? parseFloat((sleepLogs.reduce((acc, curr) => acc + curr.hoursSlept, 0) / sleepLogs.length).toFixed(1)) : 0;

    const totalJournals = filteredHistory.filter(l => l.type === 'journal').length;
    
    // Updated chart data
    const chartData = [...moodLogs].reverse().slice(-7).map((log, index) => ({
        day: new Date(log.createdAt).toLocaleDateString([], { weekday: 'short' }),
        score: log.moodScore
    }));

    const getInsightText = () => {
        if (avgSleep > 0 && avgSleep < 7) return "Rest is vital, mama. Your sleep is below the 7h baseline. Even a 20-min nap today could boost your mood and focus.";
        if (avgMood > 0 && avgMood < 6) return "You've been navigating some heavy waves lately. Remember that it's okay not to be okay. Try one grounding exercise today.";
        return "You're finding a beautiful rhythm. Consistent tracking is helping us understand your needs. Keep up the amazing work!";
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-2">
                    <div>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-3 transition-colors hover:translate-x-1 group"
                        >
                            <span className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm group-hover:border-emerald-200 group-hover:shadow text-slate-400 group-hover:text-emerald-600 transition-all">
                                <ArrowLeft size={14} strokeWidth={3} /> 
                            </span>
                            Dashboard
                        </button>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 drop-shadow-sm pb-1">
                            Health Insights
                        </h1>
                    </div>
                </header>

                {/* Top Navigation - Search, Tabs, CTA */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-3 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4 relative z-20 mb-6">
                    <div className="flex items-center bg-slate-50/80 border border-slate-200/60 px-5 py-3 rounded-2xl w-full md:w-96 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white transition-all duration-300">
                        <Search size={18} className="text-slate-400 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Find a specific memory or log..." 
                            className="bg-transparent outline-none w-full text-sm font-semibold placeholder:text-slate-400 text-slate-800"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto backdrop-blur-sm">
                            {['daily', 'weekly', 'monthly'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setViewMode(tab as any)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-300 flex-1 sm:flex-none",
                                        viewMode === tab 
                                        ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60" 
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => router.push('/tracking')}
                            className="bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto border border-emerald-400/30"
                        >
                            <Plus size={18} strokeWidth={2.5} /> New Entry
                        </button>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pb-6">
                    {/* Mood Card */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] transition-all duration-500 hover:-translate-y-1 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>
                        <p className="text-sm font-black text-slate-500 flex items-center gap-3 mb-5 relative z-10 uppercase tracking-wider">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <Smile size={18} strokeWidth={2.5} />
                            </span>
                            Mood
                        </p>
                        <div className="flex items-baseline gap-2 mb-2 relative z-10">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{avgMood > 0 ? avgMood : '-'}</span>
                            <span className="text-sm font-bold text-slate-400">/ 10</span>
                            <span className="text-3xl ml-auto drop-shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 origin-bottom-right">{avgMood > 0 ? getMoodEmoji(avgMood) : '😶'}</span>
                        </div>
                        <p className={cn("text-xs font-bold mb-6 relative z-10 flex items-center gap-1", avgMood > 0 ? (isMoodTrendUp ? "text-emerald-500" : "text-amber-500") : "text-slate-400")}>
                            {avgMood > 0 ? (
                                <>
                                    {isMoodTrendUp ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                                    {isMoodTrendUp ? '+' : '-'}{Math.abs(parseFloat(moodTrend))} from last week
                                </>
                            ) : "Awaiting first logs"}
                        </p>
                        <div className="mt-auto h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden relative z-10 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${(avgMood || 0) * 10}%` }} />
                        </div>
                    </div>

                    {/* Sleep Card */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] transition-all duration-500 hover:-translate-y-1 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>
                        <p className="text-sm font-black text-slate-500 flex items-center gap-3 mb-5 relative z-10 uppercase tracking-wider">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-blue-500 shadow-sm border border-blue-100/50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                <Moon size={18} strokeWidth={2.5} />
                            </span>
                            Sleep
                        </p>
                        <div className="flex items-baseline gap-2 mb-2 relative z-10">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{avgSleep > 0 ? avgSleep : '-'}</span>
                            <span className="text-sm font-bold text-slate-400">{avgSleep > 0 ? 'hrs avg' : 'hrs'}</span>
                        </div>
                        <p className={cn("text-xs font-bold flex items-center gap-1.5 mb-6 relative z-10", avgSleep === 0 ? "text-slate-400" : avgSleep >= 7 ? "text-blue-500" : "text-amber-500")}>
                            {avgSleep === 0 ? (
                                "No sleep data yet"
                            ) : (
                                <>
                                    {avgSleep >= 7 ? <Sparkles size={12} strokeWidth={3} /> : <AlertTriangle size={12} strokeWidth={3} />}
                                    {avgSleep >= 7 ? 'Well rested' : 'Needs improvement'}
                                </>
                            )}
                        </p>
                        <div className="mt-auto h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden relative z-10 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]" style={{ width: `${Math.min(((avgSleep || 0) / 8) * 100, 100)}%` }} />
                        </div>
                    </div>

                    {/* Reflections Card */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.12)] transition-all duration-500 hover:-translate-y-1 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/30 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>
                        <p className="text-sm font-black text-slate-500 flex items-center gap-3 mb-5 relative z-10 uppercase tracking-wider">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 flex items-center justify-center text-purple-500 shadow-sm border border-purple-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <BookOpen size={18} strokeWidth={2.5} />
                            </span>
                            Journal
                        </p>
                        <div className="flex items-baseline gap-2 mb-2 relative z-10">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{totalJournals}</span>
                            <span className="text-sm font-bold text-slate-400">entries</span>
                        </div>
                        <p className="text-xs font-bold text-purple-500 mb-6 flex items-center gap-1.5 relative z-10">
                            <PenTool size={12} strokeWidth={3} /> Keep journaling!
                        </p>
                        <div className="mt-auto h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden relative z-10 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]" style={{ width: `${Math.min((totalJournals / 10) * 100, 100)}%` }} />
                        </div>
                    </div>

                    {/* Streak Card */}
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl border border-orange-400/50 shadow-[0_8px_30px_rgb(249,115,22,0.25)] hover:shadow-[0_12px_40px_rgb(249,115,22,0.35)] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group flex flex-col text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:text-white/20 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 drop-shadow-lg">
                            <Flame size={120} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <p className="text-sm font-black text-orange-100 flex items-center gap-3 mb-5 uppercase tracking-wider">
                                <span className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm border border-white/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <Flame size={18} strokeWidth={2.5} />
                                </span>
                                Streak 🔥
                            </p>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">4</span>
                                <span className="text-sm font-bold text-orange-200 uppercase tracking-widest">Days</span>
                            </div>
                            <p className="text-xs font-bold text-orange-100 mb-6 drop-shadow-sm flex items-center gap-1.5">
                                Log today to keep it up!
                            </p>
                            <div className="mt-auto h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                                <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: '60%' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evolution & Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[400px]">
                         <div className="flex items-center justify-between mb-8">
                             <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                 <div className="p-2 bg-emerald-50 rounded-xl">
                                     <TrendingUp size={20} className="text-emerald-500" strokeWidth={2.5} />
                                 </div>
                                 Emotional Pattern
                             </h3>
                             <div className="text-sm font-bold text-slate-600 bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm">
                                 {getDateLabel()}
                             </div>
                         </div>
                         <div className="flex-1 w-full relative min-h-[250px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="day" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#64748b', fontSize: 13, fontWeight: 700}}
                                            dy={10}
                                        />
                                        <YAxis hide domain={[0, 10]} />
                                        <Tooltip 
                                            cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                            contentStyle={{ borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', fontWeight: 800, padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="score" 
                                            stroke="#10b981" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorScore)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8 backdrop-blur-sm">
                                    <div className="w-20 h-20 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-6 relative group hover:scale-110 transition-transform duration-300">
                                        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <Activity size={32} className="text-emerald-400 relative z-10" />
                                    </div>
                                    <h4 className="font-black text-slate-900 mb-2 text-2xl tracking-tight">No emotional data yet</h4>
                                    <p className="text-sm font-medium text-slate-500 text-center mb-8 max-w-xs">Start logging your feelings to see your unique emotional patterns emerge here.</p>
                                    <button 
                                        onClick={() => router.push('/tracking')}
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center gap-2"
                                    >
                                        <Plus size={18} strokeWidth={2.5}/> Add First Entry
                                    </button>
                                </div>
                            )}
                         </div>
                     </div>

                     <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-emerald-900/40 h-full">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-colors duration-700" />
                         <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-colors duration-700" />
                         <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl relative overflow-hidden border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-500">
                                <Sparkles size={24} className="relative z-10" />
                            </div>
                            <h4 className="font-black text-2xl text-white tracking-tight">AI Insights</h4>
                         </div>
                         
                         <div className="space-y-4 mb-8 relative z-10 flex-1">
                             <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                    {getInsightText()}
                                </p>
                             </div>
                             <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                    Your mood tends to drop slightly on weekends based on previous logs.
                                </p>
                             </div>
                         </div>

                         <div className="flex flex-col gap-3 relative z-10 mt-auto">
                            <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-2xl text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                                Try Recommended Activity
                            </button>
                            <button className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl text-sm border border-white/10 transition-all backdrop-blur-sm hover:scale-[1.02] active:scale-95">
                                View Suggestions
                            </button>
                         </div>
                     </div>
                </div>

                {/* Daily Timeline */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-20 relative z-10">
                     <div className="p-6 md:p-8 border-b border-slate-100/50 flex items-center justify-between bg-white/50">
                         <h3 className="text-xl font-black text-slate-900 capitalize flex items-center gap-3">
                             <div className="p-2 bg-emerald-50 rounded-xl">
                                <CalendarIcon size={20} className="text-emerald-500" strokeWidth={2.5}/>
                             </div>
                             {viewMode} Activity Feed
                         </h3>
                         <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
                             <button onClick={handlePrev} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-emerald-600 transition-all"><ChevronLeft size={18}/></button>
                             <button onClick={handleNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-emerald-600 transition-all"><ChevronRight size={18}/></button>
                         </div>
                     </div>

                     <div className="p-6 md:p-8">
                          {loading ? (
                             <div className="py-20 flex flex-col items-center justify-center gap-4">
                                 <Loader2 className="animate-spin text-emerald-500" size={40} />
                                 <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Syncing activity...</p>
                             </div>
                          ) : filteredHistory.length === 0 ? (
                             <div className="py-24 text-center flex flex-col items-center relative">
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl"></div>
                                 <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center mb-6 text-5xl relative z-10 group hover:rotate-6 hover:scale-110 transition-all duration-300">
                                     <span className="drop-shadow-md">📅</span>
                                 </div>
                                 <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight relative z-10">No entries today</h4>
                                 <p className="text-slate-500 font-medium mb-8 max-w-sm relative z-10">Start tracking your day to unlock personalized insights, mood patterns, and better care.</p>
                                 <button
                                     onClick={() => router.push('/tracking')}
                                     className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 relative z-10"
                                 >
                                     <Plus size={18} strokeWidth={2.5}/> Log Now
                                 </button>
                             </div>
                          ) : (
                             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
                                 {filteredHistory.map((log) => (
                                     <motion.div 
                                         key={log.id || `${log.type}-${log.createdAt}`}
                                         initial={{ opacity: 0, x: -10 }}
                                         whileInView={{ opacity: 1, x: 0 }}
                                         viewport={{ once: true }}
                                         onClick={() => setSelectedLog(log)}
                                         className="relative flex items-center justify-between md:justify-normal md:grid md:grid-cols-12 md:gap-6 group cursor-pointer"
                                     >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-slate-50 shadow-sm md:order-1 md:col-start-6 md:col-end-7 relative z-10 group-hover:border-emerald-200 group-hover:scale-110 transition-all duration-300">
                                            {getLogIcon(log.type, log.moodScore)}
                                        </div>

                                        <div className="flex-1 w-[calc(100%-4rem)] md:w-auto p-5 rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-emerald-50 transition-all duration-300 md:col-span-5 md:col-start-7">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-black text-slate-900">{getLogTitle(log)}</h4>
                                                <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-2 py-1 rounded-md uppercase tracking-wider">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 font-medium text-sm line-clamp-2">
                                                {log.type === 'mood' ? log.notes : log.type === 'sleep' ? `Quality: ${log.sleepQuality}/10 — Rested` : log.content}
                                            </p>
                                        </div>

                                        <div className="hidden md:flex flex-col items-end justify-center md:col-span-5 md:text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                     </motion.div>
                                 ))}
                             </div>
                          )}
                     </div>
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4"
                        onClick={() => setSelectedLog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative border border-slate-100"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner",
                                    getLogColor(selectedLog)
                                )}>
                                   {getLogIcon(selectedLog.type, selectedLog.moodScore)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-slate-900 capitalize leading-tight">{selectedLog.type} Entry</h3>
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">{new Date(selectedLog.createdAt).toLocaleString([], { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {selectedLog.type === 'mood' && (
                                    <>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center">
                                            <span className="text-xs font-black text-slate-600 uppercase mb-2">Score Assessment</span>
                                            <div className="text-5xl font-black text-slate-900 mb-2">{selectedLog.moodScore}</div>
                                            <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${selectedLog.moodScore * 10}%` }} />
                                            </div>
                                        </div>
                                        {selectedLog.notes && (
                                            <div className="bg-[#F8FAFC] p-6 rounded-[2rem] text-sm font-medium text-slate-600 leading-relaxed italic border border-slate-50">
                                                "{selectedLog.notes}"
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedLog.type === 'journal' && (
                                    <div className="bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-50 relative">
                                        <Sparkles className="absolute top-4 right-4 text-emerald-400 opacity-30" size={24} />
                                        <p className="text-slate-700 text-lg font-medium italic leading-relaxed">
                                            "{selectedLog.content}"
                                        </p>
                                    </div>
                                )}

                                {selectedLog.type === 'sleep' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] text-center border border-indigo-50">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Duration</p>
                                            <p className="text-2xl font-black text-indigo-900">{selectedLog.hoursSlept}h</p>
                                        </div>
                                        <div className="bg-emerald-50/50 p-6 rounded-[2rem] text-center border border-emerald-50">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Quality</p>
                                            <p className="text-2xl font-black text-emerald-900">{selectedLog.sleepQuality}/10</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setSelectedLog(null)} 
                                className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                            >
                                Close Entry
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={cn("animate-spin", className)}
    >
        <path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" />
    </svg>
);

const ShieldCheck = ({ size, className }: { size?: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1l7-3 7 3a1 1 0 0 1 1 1v7z" /><path d="m9 12 2 2 4-4" />
    </svg>
);
