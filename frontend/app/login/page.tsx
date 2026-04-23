'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Mail, Lock, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch('/core-api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userName', data.user.fullName);
                localStorage.setItem('resetEmail', formData.email);
                
                if (data.mustReset) {
                    router.push('/reset-password');
                } else if (data.user.role === 'partner') {
                    router.push('/partner');
                } else if (data.user.role === 'professional') {
                    router.push('/expert/dashboard');
                } else if (data.user.role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Soft decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] -mr-64 -mt-64 opacity-50" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-100 rounded-full blur-[120px] -ml-64 -mb-64 opacity-30" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[480px] relative z-10"
            >
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-emerald-600 text-white mb-6 shadow-2xl shadow-emerald-200 perspective-1000 rotate-3"
                    >
                        <Heart size={44} fill="white" className="drop-shadow-lg" />
                    </motion.div>
                    <h1 className="text-5xl font-black text-emerald-950 tracking-tighter mb-2">MamaSafe</h1>
                    <p className="text-emerald-700 font-bold text-lg tracking-tight">Your Postpartum Safety Net</p>
                </div>

                <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {error}
                            </motion.div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-950/70 uppercase tracking-[0.2em] ml-2">Secure Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-emerald-300 group-focus-within:text-emerald-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-emerald-50 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all bg-emerald-50/20 text-emerald-900 font-bold placeholder:text-emerald-400"
                                    placeholder="your-name@secure.com"
                                    required
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-950/70 uppercase tracking-[0.2em] ml-2">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-emerald-300 group-focus-within:text-emerald-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-emerald-50 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all bg-emerald-50/20 text-emerald-900 font-bold placeholder:text-emerald-400"
                                    placeholder="••••••••"
                                    required
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg transition-all active:scale-[0.98] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-3 mt-10 group disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={20} /> Sign In to Portal</>}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-emerald-50 text-center">
                        <a href="/register" className="text-sm text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-800 transition-colors flex items-center justify-center gap-2 group">
                            Create Secure Account <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                <p className="mt-12 text-center text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em] px-12 leading-loose">
                    Security Layer v3.2.1-PEER <br /> HIPAA-Compliant End-to-End Encryption Enabled
                </p>
            </motion.div>
        </div>
    );
}
