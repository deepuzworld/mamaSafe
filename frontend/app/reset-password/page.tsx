'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Loader2, CheckCircle2, ChevronRight, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem('resetEmail');
        if (storedEmail) setEmail(storedEmail);
        else router.push('/login');
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            return setError('New passwords do not match');
        }

        setIsLoading(true);
        try {
            const res = await fetch('/core-api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Security credentials updated. Redirecting...');
                localStorage.removeItem('resetEmail');
                const role = localStorage.getItem('userRole');
                setTimeout(() => {
                    if (role === 'admin') router.push('/admin/dashboard');
                    else if (role === 'professional') router.push('/expert/dashboard');
                    else if (role === 'partner') router.push('/partner');
                    else router.push('/dashboard');
                }, 1500);
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('System error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] -mr-64 -mt-64 opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[480px] relative z-10"
            >
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-emerald-600 text-white mb-6 shadow-2xl shadow-emerald-200 rotate-3"
                    >
                        <Shield size={36} fill="white" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-emerald-950 tracking-tighter">Security Check</h1>
                    <p className="text-emerald-700 font-bold tracking-tight mt-1">Please set a new secure password.</p>
                </div>

                <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <CheckCircle2 size={16} /> {success}
                            </motion.div>
                        )}
                        
                        <AuthInput 
                            label="Current / Temp Password" 
                            icon={<Lock size={18} />} 
                            value={formData.oldPassword} 
                            onChange={v => setFormData({ ...formData, oldPassword: v })} 
                        />
                        <AuthInput 
                            label="New Secure Password" 
                            icon={<KeyRound size={18} />} 
                            value={formData.newPassword} 
                            onChange={v => setFormData({ ...formData, newPassword: v })} 
                        />
                        <AuthInput 
                            label="Confirm Password" 
                            icon={<Shield size={18} />} 
                            value={formData.confirmPassword} 
                            onChange={v => setFormData({ ...formData, confirmPassword: v })} 
                        />

                        <button 
                            type="submit" 
                            disabled={isLoading || !!success}
                            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg transition-all active:scale-[0.98] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-3 mt-10 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Shield size={20} /> Update Credentials</>}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function AuthInput({ label, icon, value, onChange }: { label: string, icon: any, value: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-950/70 uppercase tracking-[0.2em] ml-2">{label}</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-emerald-300 group-focus-within:text-emerald-500 transition-colors">
                    {icon}
                </div>
                <input
                    type="password"
                    className="w-full pl-14 pr-6 py-4 rounded-[2rem] border border-emerald-50 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all bg-emerald-50/20 text-emerald-900 font-bold placeholder:text-emerald-400"
                    placeholder="••••••••"
                    required
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
