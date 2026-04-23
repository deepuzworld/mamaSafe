'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2, Moon, Smile, Phone, MapPin, Heart, ClipboardCheck, Info, ChevronRight, Loader2, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SmartPhoneInput from '../../src/components/SmartPhoneInput';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function PartnerDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showConsultantModal, setShowConsultantModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [phone, setPhone] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'partner') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/partner/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                if (result.mustReset) {
                    router.push('/reset-password');
                    return;
                }
                setData(result);
                setPhone(result.partnerPhone || '');
                if (!result.partnerPhone) {
                    setShowSettingsModal(true);
                }
            }
        } catch (error) {
            console.error('Error fetching partner data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/partner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isComplete: !currentStatus })
            });
            const result = await res.json();
            if (result.success) {
                // Update local state
                setData((prev: any) => ({
                    ...prev,
                    tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, isComplete: !currentStatus } : t)
                }));
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-4">No Connection Found</h2>
                    <p className="text-slate-600 font-bold mb-8">We couldn't find a linked caregiver account for you.</p>
                    <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Retry Connection</button>
                </div>
            </div>
        );
    }

    const partnerData = {
        motherName: data.motherName,
        sleepLogs: [{ hoursSlept: 4 }], // Still mock for now as per schema logic
        moodLogs: [{ moodScore: 5 }],
        alerts: data.alerts || [],
        tasks: data.tasks || [],
        resources: data.resources || []
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            Partner Bridge <span className="text-blue-500">🛡️</span>
                        </h2>
                        <p className="text-slate-700 font-bold tracking-tight">Active Sentinel for {partnerData.motherName}'s Safety.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowSettingsModal(true)}
                            className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            title="Profile Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <button onClick={() => setShowConsultantModal(true)} className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-black text-sm flex gap-3 items-center shadow-lg shadow-rose-200 transition-all active:scale-95 group">
                            <AlertTriangle size={18} className="text-white group-hover:scale-110 transition-transform" /> Contact Crisis Line
                        </button>
                    </div>
                </header>

                <div className="space-y-10">
                    {/* Critical Alert Ring */}
                    <AnimatePresence>
                        {partnerData?.alerts?.some((a: any) => a.severity === 'high' || a.severity === 'critical') && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-rose-500 rounded-[3rem] animate-pulse opacity-10 blur-2xl" />
                                <div className="relative bg-white rounded-[3rem] border-4 border-rose-100 shadow-2xl shadow-rose-200/50 p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />

                                    <div className="w-24 h-24 rounded-[2rem] bg-rose-600 text-white flex items-center justify-center shadow-2xl shadow-rose-200 shrink-0 relative z-10">
                                        <ShieldAlert size={44} />
                                    </div>

                                    <div className="flex-1 text-center md:text-left relative z-10">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest mb-4">
                                            Priority Emergency Alert
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">High Risk Detected</h3>
                                        <p className="text-slate-700 font-bold text-lg leading-relaxed max-w-2xl">
                                            {partnerData.alerts.find((a: any) => a.severity === 'high' || a.severity === 'critical')?.message}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => alert("Acknowledgment sent to server.")}
                                        className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-base shadow-2xl shadow-slate-200 hover:bg-rose-600 transition-all active:scale-95 shrink-0 relative z-10"
                                    >
                                        I'm Responding Now
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-10">
                        {/* Recent History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30 font-sans"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                                    <AlertTriangle size={24} />
                                </div>
                                <h4 className="font-black text-slate-900 text-xl tracking-tight">Active Alerts</h4>
                            </div>

                            <div className="space-y-4">
                                {partnerData?.alerts?.map((alert: any) => (
                                    <div key={alert.alertId} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4 hover:border-rose-100 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 animate-pulse shrink-0" />
                                        <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase tracking-tight">{alert.message}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Checklist Section */}
                        <motion.section
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30"
                        >
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                        <ClipboardCheck size={24} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Caregiver Checklist</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Updated Daily</span>
                            </div>

                            <div className="space-y-4">
                                {partnerData?.tasks?.map((item: any) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleToggleTask(item.id, item.isComplete)}
                                        className={cn(
                                            "flex items-center gap-5 p-6 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 transition-all cursor-pointer",
                                            item.isComplete ? "opacity-50 grayscale" : "hover:bg-slate-50 hover:border-blue-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                            item.isComplete ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 bg-white text-white"
                                        )}>
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className={cn(
                                            "flex-1 text-base font-bold tracking-tight",
                                            item.isComplete ? "text-slate-400 line-through" : "text-slate-700"
                                        )}>{item.task}</span>
                                        {item.priority === 'high' && !item.isComplete && <span className="text-[10px] font-black bg-rose-500 text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-rose-200">Critical</span>}
                                    </div>
                                ))}
                                {partnerData?.tasks?.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 font-bold text-sm">No tasks assigned for today.</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* Education Portal */}
                        <motion.section
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-blue-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px] -mr-32 -mt-32" />
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
                                    <Info size={32} className="text-blue-300" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight mb-6 leading-tight">Safety Education</h3>
                                <div className="space-y-6 flex-1 overflow-y-auto max-h-[250px] pr-4 custom-scrollbar">
                                    {partnerData?.resources?.map((res: any) => (
                                        <div key={res.id} className="bg-white/10 p-6 rounded-[2rem] border border-white/5">
                                            <h4 className="font-black text-white text-sm mb-2">{res.title}</h4>
                                            <p className="text-blue-50/70 text-xs font-bold leading-relaxed">{res.content}</p>
                                        </div>
                                    ))}
                                    {partnerData?.resources?.length === 0 && (
                                        <p className="text-blue-50/90 font-bold text-lg leading-relaxed">
                                            Access educational modules and crisis "Red Flag" guides to best support Jane during this time.
                                        </p>
                                    )}
                                </div>
                                <div className="mt-8">
                                    <button
                                        onClick={() => router.push('/education')}
                                        className="flex items-center gap-3 bg-white text-blue-950 px-8 py-5 rounded-[2rem] font-black hover:bg-blue-50 transition-all group active:scale-95"
                                    >
                                        Full Resource Hub <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showConsultantModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
                        onClick={() => setShowConsultantModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative"
                        >
                            <div className="bg-rose-500 p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400 rounded-full blur-2xl -mr-16 -mt-16 opacity-50" />
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl relative z-10">
                                    <Phone className="text-rose-500" size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-white relative z-10">Crisis Line</h3>
                                <p className="text-rose-100 font-medium relative z-10">Immediate Assistance Available</p>
                            </div>
                            <div className="p-8 space-y-6 bg-slate-50">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                                            DR
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-lg">Dr. Anjali Desai</h4>
                                            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Women's Health & Psychiatry</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                            <Phone size={18} className="text-emerald-500" />
                                            <span className="font-bold tracking-wide">+91 98765 43210</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                            <MapPin size={18} className="text-emerald-500" />
                                            <span className="font-medium text-sm">2.5 km away • Apollo Cradle, Mumbai</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                                    >
                                        Call Now
                                    </button>
                                    <button 
                                        onClick={() => setShowConsultantModal(false)}
                                        className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                    <p className="text-[10px] text-slate-500 text-center font-bold mb-3 uppercase tracking-widest">Consultant didn't answer?</p>
                                    <button 
                                        className="w-full py-4 bg-amber-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                                    >
                                        <AlertTriangle size={18} /> Call 112 (Emergency)
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showSettingsModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => { if (data?.partnerPhone) setShowSettingsModal(false); }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-10">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Emergency Contact</h3>
                                <p className="text-slate-500 font-bold text-sm mb-8">Set your mobile number to receive instant Pulse alerts via SMS and Voice calls.</p>
                                
                                <div className="space-y-8">
                                    <SmartPhoneInput 
                                        value={phone}
                                        onChange={setPhone}
                                    />

                                    <div className="flex gap-4 pt-4">
                                        {(data?.partnerPhone) && (
                                            <button 
                                                onClick={() => setShowSettingsModal(false)}
                                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button 
                                            disabled={updating || !phone}
                                            onClick={async () => {
                                                setUpdating(true);
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const res = await fetch('/core-api/partner/profile', {
                                                        method: 'PATCH',
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify({ phoneNumber: phone })
                                                    });
                                                    if (res.ok) {
                                                        alert("Phone number updated successfully!");
                                                        setData((prev: any) => ({ ...prev, partnerPhone: phone }));
                                                        setShowSettingsModal(false);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setUpdating(false);
                                                }
                                            }}
                                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                                        >
                                            {updating ? 'Saving...' : 'Save Settings'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
