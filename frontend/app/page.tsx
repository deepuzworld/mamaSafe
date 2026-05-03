'use client';

import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Zap, Users, Brain, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Home() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden">
            {/* Soft Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[120px] -mr-96 -mt-96" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[120px] -ml-64 -mb-64" />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.3em] mb-12 border border-emerald-100 shadow-sm"
                    >
                        <Zap size={14} className="animate-pulse" /> A Secure 24/7 Digital Safety Net
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-10 max-w-5xl"
                    >
                        No mother should <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600">suffer in silence.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-500 font-bold max-w-3xl leading-relaxed mb-16 tracking-tight"
                    >
                        MamaSafe uses advanced AI to detect early signs of PPD & Psychosis, providing secure peer support, professional coaching, and biometric crisis defense.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
                    >
                        <a href="/login" className="px-10 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-emerald-900/10 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3 group">
                            Secure Entry <Sparkles size={20} className="group-hover:rotate-12" />
                        </a>
                        <a href="#features" className="px-10 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-lg border border-slate-100 shadow-xl shadow-slate-200/50 hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                            Explore the Safe Haven
                        </a>
                    </motion.div>
                </section>

                {/* Proof Section */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ProofCard 
                            stat="50%" 
                            label="Hidden Risk" 
                            description="of Psychosis cases have no prior psychiatric history." 
                            color="text-rose-500" 
                            bg="bg-rose-50/50"
                        />
                        <ProofCard 
                            stat="24/7" 
                            label="Active Pulse" 
                            description="NurtureAI monitors for Red Flags in sleep and mood." 
                            color="text-emerald-500" 
                            bg="bg-emerald-50/50"
                        />
                        <ProofCard 
                            stat="100%" 
                            label="Verified Only" 
                            description="Bio-locked spaces ensure women-only pseudonymity." 
                            color="text-blue-500" 
                            bg="bg-blue-50/50"
                        />
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Comprehensive Safety Ecosystem</h2>
                        <p className="text-slate-400 font-bold mt-4">Every component designed for the most delicate recovery period.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <FeatureCard 
                            icon={<ShieldCheck size={32} />}
                            title="Biometric Lockout"
                            description="State-of-the-art face verification ensures our peer community remains a 100% women-only haven, preserving safety without compromising your pseudonymity."
                            accent="text-emerald-600"
                            bg="bg-emerald-50"
                        />
                        <FeatureCard 
                            icon={<Brain size={32} />}
                            title="NurtureAI Screening"
                            description="Beyond simple tracking, our AI analyzes sentiment in your journals to quietly screen for symptoms like command thoughts or heightened distress patterns."
                            accent="text-blue-600"
                            bg="bg-blue-50"
                        />
                        <FeatureCard 
                            icon={<Activity size={32} />}
                            title="The Partner Bridge"
                            description="Connect your spouse or caregiver to a restricted dashboard. It equips them with checklists and education to prioritize your sleep and detect psychosis red flags."
                            accent="text-violet-600"
                            bg="bg-violet-50"
                        />
                    </div>
                </section>

                {/* Footer Light */}
                <footer className="py-12 px-6 border-t border-slate-100 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Heart size={20} fill="#10b981" className="text-emerald-500" />
                        <span className="font-black text-xl tracking-tighter">MamaSafe</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose text-center">
                        Secure Postpartum Intelligence <br /> 
                        Built with Clinical Rigor and Empathy
                    </p>
                </footer>
            </div>
        </div>
    );
}

function ProofCard({ stat, label, description, color, bg }: { stat: string, label: string, description: string, color: string, bg: string }) {
    return (
        <motion.div 
            whileHover={{ y: -8 }}
            className={cn("p-10 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group", bg)}
        >
            <div className="relative z-10">
                <h2 className={cn("text-6xl font-black mb-1 tracking-tighter", color)}>{stat}</h2>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{label}</span>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{description}</p>
                </div>
            </div>
        </motion.div>
    );
}

function FeatureCard({ icon, title, description, accent, bg }: { icon: any, title: string, description: string, accent: string, bg: string }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:shadow-2xl transition-all"
        >
            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform duration-500", bg, accent)}>
                {icon}
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h4>
            <p className="text-slate-500 font-medium leading-relaxed tracking-tight">{description}</p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-emerald-500 transition-colors">
                Learn Security Protocol <ArrowRight size={14} />
            </div>
        </motion.div>
    );
}
