'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {children}

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-2 flex items-center gap-1 z-50">
                <button 
                    onClick={() => router.push('/community')}
                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all active:scale-90 ${pathname === '/community' && !searchParams.get('action') ? 'bg-[#0F172A] text-[#00F59B] shadow-lg' : 'text-black'}`}
                >
                    <svg 
                        viewBox="0 0 24 24" 
                        width="24" 
                        height="24" 
                        fill={pathname === '/community' && !searchParams.get('action') ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth={pathname === '/community' && !searchParams.get('action') ? "0" : "2"}
                    >
                        <path d="M12 2.5L2 12h3v9h5v-6h4v6h5v-9h3L12 2.5z" />
                    </svg>
                </button>
                <button 
                    onClick={() => router.push('/community?action=post')}
                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all active:scale-90 ${searchParams.get('action') === 'post' ? 'bg-[#0F172A] text-[#00F59B] shadow-lg' : 'text-black hover:bg-slate-50'}`}
                >
                    <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-colors ${searchParams.get('action') === 'post' ? 'border-[#00F59B]' : 'border-black'}`}>
                        <Plus size={16} strokeWidth={3} />
                    </div>
                </button>
                <button 
                    onClick={() => router.push('/community/profile')}
                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all active:scale-90 ${pathname === '/community/profile' ? 'bg-[#0F172A] text-[#00F59B] shadow-lg' : 'text-black'}`}
                >
                    <User size={24} strokeWidth={pathname === '/community/profile' ? 2.5 : 2} />
                </button>
            </div>
        </div>
    );
}
