'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, User, Mail, Lock, Calendar, Baby, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'mother',
        firstPregnancy: false,
        historyOfBipolar: false,
        babyBirthDate: '',
        partnerName: '',
        partnerEmail: ''
    });

    const [mounted, setMounted] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Registering intent and moving to Biometric Lock...');
        
        // Save to session storage for the biometric gate
        sessionStorage.setItem('registrationData', JSON.stringify(formData));
        
        setIsRedirecting(true);
        
        // Use direct location redirect to ensure absolute navigation success
        setTimeout(() => {
            window.location.href = '/face-verification';
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Soft Ambient Background */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[140px] -ml-80 -mt-80 opacity-50" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-100 rounded-full blur-[140px] -mr-80 -mb-80 opacity-30" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[560px] relative z-10 my-12"
            >
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-emerald-600 text-white mb-6 shadow-2xl shadow-emerald-200 rotate-3"
                    >
                        <Heart size={36} fill="white" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-emerald-950 tracking-tighter">Start Your Journey</h1>
                    <p className="text-emerald-700 font-bold tracking-tight mt-1">Join the safest space for mothers.</p>
                </div>

                <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white p-10 md:p-14 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.06)]">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section: Basic Identity */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-1 border-b border-emerald-50 pb-4">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><User size={18} /></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/80">Core Identity</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <FormInput 
                                    label="Full Name" 
                                    icon={<User size={18} />} 
                                    placeholder="Jane Doe" 
                                    value={formData.fullName}
                                    onChange={v => setFormData({ ...formData, fullName: v })} 
                                />
                                <FormInput 
                                    label="Secure Email" 
                                    icon={<Mail size={18} />} 
                                    placeholder="mama@secure.com" 
                                    type="email"
                                    value={formData.email}
                                    onChange={v => setFormData({ ...formData, email: v })} 
                                />
                                <FormInput 
                                    label="Create Password" 
                                    icon={<Lock size={18} />} 
                                    placeholder="••••••••" 
                                    type="password"
                                    value={formData.password}
                                    onChange={v => setFormData({ ...formData, password: v })} 
                                />
                            </div>
                        </div>

                        {/* Section: Clinical Context */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-1 border-b border-emerald-50 pb-4">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Baby size={18} /></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/80">Clinical Context</h3>
                            </div>

                            <div className="space-y-4 px-2">
                                <FormCheckbox 
                                    label="This is my first pregnancy" 
                                    checked={formData.firstPregnancy} 
                                    onChange={v => setFormData({ ...formData, firstPregnancy: v })} 
                                />
                                <FormCheckbox 
                                    label="Prior history of bipolar disorder" 
                                    checked={formData.historyOfBipolar} 
                                    onChange={v => setFormData({ ...formData, historyOfBipolar: v })} 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-emerald-950/70 uppercase tracking-[0.2em] ml-2">Baby's Birth Date (Expected/Actual)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-emerald-300 group-focus-within:text-emerald-500 transition-colors">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full pl-14 pr-6 py-4 rounded-[2rem] border border-emerald-50 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all bg-emerald-50/20 text-emerald-900 font-bold"
                                        required
                                        value={formData.babyBirthDate}
                                        onChange={e => setFormData({ ...formData, babyBirthDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Partner Bridge */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-1 border-b border-emerald-50 pb-4">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ShieldCheck size={18} /></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/80">Partner Access (Encrypted)</h3>
                            </div>
                            <p className="text-[11px] font-bold text-emerald-700/80 italic leading-relaxed px-2">Invited partners see your safety status and checklists, but not your private reflections or peer community posts.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput 
                                    label="Partner Name" 
                                    icon={<User size={16} />} 
                                    placeholder="Optional" 
                                    value={formData.partnerName}
                                    onChange={v => setFormData({ ...formData, partnerName: v })} 
                                />
                                <FormInput 
                                    label="Partner Email" 
                                    icon={<Mail size={16} />} 
                                    placeholder="Optional" 
                                    type="email"
                                    value={formData.partnerEmail}
                                    onChange={v => setFormData({ ...formData, partnerEmail: v })} 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isRedirecting}
                            className={cn(
                                "w-full py-5 text-white rounded-[2rem] font-black text-lg transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3 mt-10 group",
                                isRedirecting ? "bg-emerald-800 opacity-80 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                            )}
                        >
                            {isRedirecting ? (
                                <>Connecting to Biometric Engine...</>
                            ) : (
                                <><Sparkles size={20} /> Continue to Biometric Lock <ChevronRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <a href="/login" className="text-sm text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-800 transition-colors">
                            Already have an account? Sign in
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function FormInput({ label, icon, placeholder, value, type = 'text', onChange }: { label: string, icon: any, placeholder: string, value: string, type?: string, onChange: (v: string) => void }) {
    const isOptional = label === 'Partner Name' || label === 'Partner Email';

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-950/70 uppercase tracking-[0.2em] ml-2">{label}</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-emerald-300 group-focus-within:text-emerald-500 transition-colors">
                    {icon}
                </div>
                <input
                    type={type}
                    value={value}
                    className="w-full pl-14 pr-6 py-4 rounded-[2rem] border border-emerald-50 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all bg-emerald-50/20 text-emerald-900 font-bold placeholder:text-emerald-400"
                    placeholder={placeholder}
                    required={!isOptional}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

function FormCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-4 cursor-pointer group">
            <div className={cn(
                "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm",
                checked ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-emerald-100 group-hover:border-emerald-200"
            )}>
                <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
                {checked && <ShieldCheck size={16} />}
            </div>
            <span className={cn("text-sm font-bold tracking-tight transition-colors", checked ? "text-emerald-900" : "text-emerald-900/60 group-hover:text-emerald-900/80")}>{label}</span>
        </label>
    );
}
