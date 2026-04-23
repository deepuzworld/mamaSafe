'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import React from 'react';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalonePage = [
        '/login',
        '/register',
        '/face-verification',
        '/',
        '/partner-join',
        '/partner-invite'
    ].includes(pathname || '') || pathname?.startsWith('/expert') || pathname?.startsWith('/admin');

    if (isStandalonePage) {
        return <div className="flex flex-col min-h-screen">{children}</div>;
    }

    return (
        <>
            <Navigation />
            <div className="lg:pl-72 flex flex-col min-h-screen">
                {children}
            </div>
        </>
    );
}
