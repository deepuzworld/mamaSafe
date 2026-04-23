import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayoutWrapper } from '../components/ClientLayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MamaSafe | A Digital Safety Net for Mothers',
    description: 'AI-driven integrated support ecosystem for postpartum mental health.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body 
                className={`${inter.className} min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 lg:pb-0`}
                suppressHydrationWarning
            >
                <ClientLayoutWrapper>
                    {children}
                </ClientLayoutWrapper>
            </body>
        </html>
    );
}
