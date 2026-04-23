'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SmartPhoneInput from '../../src/components/SmartPhoneInput';

export default function PartnerJoinPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        router.push('/partner');
    };

    return (
        <div className="flex justify-center items-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4 inline-block">Partner Invite</span>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join as Caregiver</h2>
                    <p className="text-gray-500 mt-2 text-sm">You have been securely invited to join MamaSafe. You are currently acting as the first line of defense.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl mb-6">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Invited Email</p>
                        <p className="font-bold text-gray-900">partner@example.com <span className="text-green-600 text-sm ml-2">✓ Verified</span></p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Your Full Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="John Doe"
                            required
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Create Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <SmartPhoneInput 
                            value={(formData as any).phoneNumber || ''}
                            onChange={(val) => setFormData({ ...formData, phoneNumber: val } as any)}
                        />
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-transform hover:-translate-y-0.5 shadow-md mt-6">
                        Access The Partner Bridge
                    </button>
                </form>
            </div>
        </div>
    );
}
