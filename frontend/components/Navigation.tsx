'use client';

import { useState, useEffect } from 'react';
import {
    Heart,
    Users,
    LogOut,
    Brain,
    Stethoscope,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Navigation() {
    const pathname = usePathname();
    const [user, setUser] = useState({ role: 'mother', fullName: 'User' });

    useEffect(() => {
        const role = localStorage.getItem('userRole') || 'mother';
        const fullName = localStorage.getItem('userName') || 'User';
        setUser({ role, fullName });
    }, []);

    const navItems = [
        { id: user.role === 'partner' ? '/partner' : '/dashboard', label: 'Dashboard', icon: Activity },
        { id: '/health-logs', label: 'Health Insights', icon: Brain, hideFor: ['partner'] },
        { id: '/education', label: 'Education', icon: Heart, hideFor: ['mother'] },
        { id: '/community', label: 'Community', icon: Users, hideFor: ['partner'] },
        { id: '/professionals', label: 'Professional', icon: Stethoscope },
    ].filter(item => !item.hideFor?.includes(user.role));

    // Hide navigation on auth pages and specialized portals
    if (
        pathname === '/login' || 
        pathname === '/register' || 
        pathname === '/face-verification' || 
        pathname === '/' || 
        pathname === '/partner-join' || 
        pathname === '/partner-invite' ||
        pathname === '/reset-password' ||
        pathname?.startsWith('/expert') ||
        pathname?.startsWith('/admin')
    ) {
        return null;
    }

    return (
        <>
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col fixed left-4 top-4 bottom-4 w-72 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 z-40 shadow-2xl shadow-slate-200/50">
                <Link href="/dashboard" className="flex items-center gap-4 mb-12 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200 group transition-transform hover:scale-110">
                        <Heart size={24} fill="currentColor" className="group-hover:animate-pulse" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter block leading-none">MamaSafe</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Premium Care</span>
                    </div>
                </Link>

                <nav className="flex-1 space-y-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.id || pathname?.startsWith(item.id + '/');
                        return (
                            <Link
                                href={item.id}
                                key={item.id}
                                className={cn(
                                    "w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 font-bold group relative overflow-hidden",
                                    isActive
                                        ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                                        : "text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-700"
                                )}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="nav-active"
                                        className="absolute inset-0 bg-slate-900 z-0"
                                    />
                                )}
                                <div className={cn(
                                    "relative z-10 p-2 rounded-xl transition-colors",
                                    isActive ? "bg-white/10" : "group-hover:bg-emerald-100/50"
                                )}>
                                    <item.icon size={20} className={isActive ? "text-emerald-400" : "group-hover:scale-110 transition-transform"} />
                                </div>
                                <span className="relative z-10 tracking-tight">{item.label}</span>
                                {isActive && (
                                    <motion.div 
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="absolute right-4 w-1.5 h-1.5 rounded-full bg-emerald-400 z-10"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100/50">
                    <div className="flex items-center gap-4 mb-8 px-2 group cursor-pointer">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-700 font-black text-lg border border-emerald-100 shadow-sm transition-transform group-hover:scale-105">
                                {user?.fullName[0]}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user?.fullName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.role}</p>
                        </div>
                    </div>
                    <Link href="/login" className="w-full flex items-center gap-3 px-6 py-4 bg-slate-50 hover:bg-rose-50 rounded-2xl justify-center text-slate-500 hover:text-rose-600 font-black text-xs transition-all uppercase tracking-widest shadow-sm hover:shadow-md border border-slate-100">
                        <LogOut size={16} />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-white/40 px-8 py-4 flex justify-between items-center z-50 rounded-[2rem] shadow-2xl shadow-slate-200/50">
                {navItems.map((item) => {
                    const isActive = pathname === item.id || pathname?.startsWith(item.id + '/');
                    return (
                        <Link
                            href={item.id}
                            key={item.id}
                            className={cn(
                                "p-3 rounded-2xl transition-all relative",
                                isActive ? "bg-slate-900 text-emerald-400 shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <item.icon size={24} />
                            {isActive && (
                                <motion.div 
                                    layoutId="mobile-nav-active"
                                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}

