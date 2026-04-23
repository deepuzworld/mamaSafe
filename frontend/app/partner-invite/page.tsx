'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Send, Heart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function PartnerInvitePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ partnerEmail: '', shareCode: '' });
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSent(true);
        setTimeout(() => router.push('/dashboard'), 2000);
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] -mr-64 -mt-64 opacity-50" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[480px] relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)]">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-6 group">
                            <ShieldCheck size={32} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Invite Your Partner</h2>
                        <p className="text-slate-500 font-bold text-sm tracking-tight mt-2 px-4 leading-relaxed">Partners get high-level vitals and actionable checklists, keeping your private peer-support posts strictly confidential.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Partner's Secure Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full pl-14 pr-6 py-4 rounded-[2rem] border border-slate-100 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all bg-slate-50/20 text-slate-900 font-bold placeholder:text-slate-200"
                                    placeholder="caregiver@secure.com"
                                    required
                                    onChange={e => setFormData({ ...formData, partnerEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Heart size={16} className="text-blue-600" fill="currentColor" />
                                <h4 className="font-black text-blue-900 text-xs uppercase tracking-widest">Safety Privacy Policy</h4>
                            </div>
                            <p className="text-[11px] font-bold text-blue-800/60 leading-relaxed italic">
                                Your partner will see your Risk Status and Emergency protocols, but NOT your journal reflections or public community posts.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSent}
                            className={cn(
                                "w-full py-5 rounded-[2rem] font-black text-lg transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3 mt-4",
                                isSent ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                            )}
                        >
                            {isSent ? <><ShieldCheck size={20} /> Invite Dispatched</> : <><Send size={18} /> Send Secure Invite</>}
                        </button>

                        <button type="button" onClick={() => router.push('/dashboard')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">
                            Skip for now
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
