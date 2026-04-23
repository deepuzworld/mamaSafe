'use client';

import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

const COUNTRY_DATA: Record<string, { name: string; flag: string }> = {
    '1': { name: 'USA', flag: '🇺🇸' },
    '91': { name: 'India', flag: '🇮🇳' },
    '44': { name: 'UK', flag: '🇬🇧' },
    '971': { name: 'UAE', flag: '🇦🇪' },
    '61': { name: 'Australia', flag: '🇦🇺' },
    '966': { name: 'Saudi Arabia', flag: '🇸🇦' },
    '974': { name: 'Qatar', flag: '🇶🇦' },
    '965': { name: 'Kuwait', flag: '🇰🇼' },
    '968': { name: 'Oman', flag: '🇴🇲' },
};

interface SmartPhoneInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}

export default function SmartPhoneInput({ value, onChange, placeholder }: SmartPhoneInputProps) {
    const [country, setCountry] = useState<{ name: string; flag: string } | null>(null);

    useEffect(() => {
        detectCountry(value);
    }, [value]);

    const detectCountry = (val: string) => {
        if (!val || !val.startsWith('+')) {
            setCountry(null);
            return;
        }

        const digits = val.slice(1); // remove +
        
        let found = false;
        for (let len = 3; len >= 1; len--) {
            const prefix = digits.slice(0, len);
            if (COUNTRY_DATA[prefix]) {
                setCountry(COUNTRY_DATA[prefix]);
                found = true;
                break;
            }
        }
        if (!found) setCountry(null);
    };

    return (
        <div className="group relative">
            <div className="absolute -top-2.5 left-4 px-2 bg-white z-10">
                <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 transition-colors">
                    Phone number
                </span>
            </div>

            <div className="relative flex items-center">
                <div className="absolute left-5 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                    {country ? (
                        <span className="text-xl" title={country.name}>{country.flag}</span>
                    ) : (
                        <Phone size={18} />
                    )}
                </div>
                
                <input
                    type="tel"
                    value={value}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (val && !val.startsWith('+')) val = '+' + val.replace(/\D/g, '');
                        onChange(val);
                    }}
                    placeholder={placeholder || "+91 98765 43210"}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[1.5rem] outline-none font-bold text-slate-700 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-300"
                />

                {country && (
                    <div className="absolute right-5 pointer-events-none">
                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest animate-in fade-in slide-in-from-right-2 duration-300">
                            {country.name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
