'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Calendar, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Star, ShieldCheck, X, Bookmark, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Professional {
    expertId: string;
    name: string;
    specialization: string;
    credentials?: string;
    bio?: string;
    isVerified: boolean;
    isFullyBooked?: boolean;
}

export default function ProfessionalsPage() {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [bookingModalExpert, setBookingModalExpert] = useState<Professional | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('10:00');
    const [patientComment, setPatientComment] = useState<string>('');
    const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [takenSlots, setTakenSlots] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchProfessionals = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/core-api/professionals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setProfessionals(data.professionals);
                }
            } catch (error) {
                console.error('Error fetching professionals:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfessionals();
    }, []);

    const availableDates = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
            fullDate: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            monthName: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
    });

    const openBookingModal = (pro: Professional) => {
        setBookingModalExpert(pro);
        setSelectedDate(availableDates[0].fullDate);
        setSelectedTime('09:30');
    };

    useEffect(() => {
        const fetchTakenSlots = async () => {
            if (!bookingModalExpert || !selectedDate) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/core-api/professionals/${bookingModalExpert.expertId}/slots?date=${selectedDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setTakenSlots(data.takenTimes);
                }
            } catch (err) {
                console.error('Error fetching slots:', err);
            }
        };

        fetchTakenSlots();
    }, [bookingModalExpert, selectedDate]);

    const confirmBooking = async () => {
        if (!bookingModalExpert) return;
        setBookingId(bookingModalExpert.expertId);
        try {
            const token = localStorage.getItem('token');
            const appointmentDate = new Date(`${selectedDate}T${selectedTime}:00`);

            const res = await fetch('/core-api/professionals/appointments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    expertId: bookingModalExpert.expertId,
                    appointmentDate: appointmentDate.toISOString(),
                    patientComment: patientComment
                })
            });

            const data = await res.json();
            if (data.success) {
                setStatus({ type: 'success', message: 'Session booked successfully! A specialist will contact you shortly.' });
                setTimeout(() => setStatus(null), 5000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to book session. Please try again.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Connection error. Please check your network.' });
        } finally {
            setBookingId(null);
            setBookingModalExpert(null);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Stethoscope className="text-emerald-600" size={32} />
                        Certified Specialists
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Book private sessions with vetted postpartum mental health professionals.</p>
                </header>

                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${
                                status.type === 'success' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                : 'bg-rose-50 border-rose-100 text-rose-700'
                            }`}
                        >
                            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <p className="font-bold text-sm">{status.message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[2.5rem] p-8 animate-pulse border border-slate-100">
                                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6" />
                                <div className="h-4 bg-slate-100 rounded w-2/3 mx-auto mb-3" />
                                <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto mb-8" />
                                <div className="h-12 bg-slate-100 rounded-2xl w-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {professionals.map((pro) => (
                            <motion.div 
                                key={pro.expertId} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-8 flex flex-col items-center text-center transition-all hover:border-emerald-100 group relative overflow-hidden"
                            >
                                {pro.isFullyBooked && (
                                    <div className="absolute top-6 left-6 bg-rose-100 text-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-white shadow-sm z-20">
                                        Fully Booked
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 flex items-center justify-center mb-6 shadow-inner relative z-10 group-hover:scale-110 transition-transform">
                                    <Stethoscope size={40} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        <h3 className="font-black text-xl text-slate-900 leading-tight">
                                            {pro.name.startsWith('Dr.') ? pro.name : `Dr. ${pro.name}`}
                                        </h3>
                                        {pro.isVerified && <ShieldCheck size={18} className="text-emerald-500" />}
                                    </div>
                                    <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl mt-1 mb-4 inline-block border border-emerald-100 uppercase tracking-wider">
                                        {pro.specialization}
                                    </p>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 min-h-[4rem]">
                                        {pro.bio || 'Dedicated specialist committed to supporting your mental wellbeing during motherhood.'}
                                    </p>

                                    <button 
                                        onClick={() => openBookingModal(pro)}
                                        disabled={bookingId === pro.expertId || (pro as any).isFullyBooked}
                                        className={`w-full py-4 text-white rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 ${
                                            (pro as any).isFullyBooked ? 'bg-slate-300 cursor-not-allowed opacity-70 border-none shadow-none text-slate-500 hover:bg-slate-300' : 'bg-slate-900 hover:bg-emerald-600 hover:shadow-emerald-200'
                                        }`}
                                    >
                                        {bookingId === pro.expertId ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (pro as any).isFullyBooked ? (
                                            'No Slots Available'
                                        ) : (
                                            <>
                                                <Calendar size={18} />
                                                Book Private Session
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div className="mt-16 bg-emerald-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-black mb-4 tracking-tight">Your health is our priority.</h2>
                            <p className="text-emerald-100 font-medium text-lg leading-relaxed">
                                All our professionals represent at least 10+ years of dedicated clinical experience in maternal mental health. Every session is encrypted, direct, and completely confidential.
                            </p>
                        </div>
                        <div className="flex gap-4 shrink-0">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                    <Star size={20} className="text-emerald-400 fill-current" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Booking Modal */}
                <AnimatePresence>
                    {bookingModalExpert && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-sm"
                            onClick={() => setBookingModalExpert(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-[2.5rem] w-full max-w-[28rem] p-8 shadow-2xl relative"
                            >
                                <button onClick={() => setBookingModalExpert(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                                    <X size={20} />
                                </button>
                                
                                <div className="mb-6 mt-2">
                                    <div className="flex justify-between items-center mb-4 pr-10">
                                        <h4 className="font-extrabold text-slate-900 text-lg">Select Date</h4>
                                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1 cursor-pointer hover:text-emerald-500 transition-colors">
                                            <ChevronLeft size={16}/> {availableDates[0].monthName} <ChevronRight size={16}/>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none w-full">
                                        {availableDates.map(date => (
                                            <button 
                                                key={date.fullDate}
                                                onClick={() => setSelectedDate(date.fullDate)}
                                                className={`flex flex-col items-center justify-center min-w-[3.5rem] py-3 rounded-[1.5rem] border transition-all ${
                                                    selectedDate === date.fullDate 
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200 transform scale-105' 
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'
                                                }`}
                                            >
                                                <span className={`text-xs font-medium mb-1 ${selectedDate === date.fullDate ? 'text-emerald-100' : 'text-slate-400'}`}>{date.dayName}</span>
                                                <span className="text-lg font-bold">{date.dayNum}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8 bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-50/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-extrabold text-slate-900 text-lg">Select Time</h4>
                                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1 cursor-pointer hover:text-emerald-500 transition-colors">
                                            <ChevronLeft size={16}/> 9 Slots <ChevronRight size={16}/>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["08:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00"].map(time => {
                                            const [h, m] = time.split(':');
                                            const hour = parseInt(h);
                                            const label = `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                                            const isTaken = takenSlots.includes(time);
                                            return (
                                                <button
                                                    key={time}
                                                    disabled={isTaken}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`py-3 rounded-full text-[13px] font-bold border transition-all ${
                                                        isTaken 
                                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                        : selectedTime === time
                                                        ? 'bg-white border-emerald-500 text-emerald-500 shadow-sm transform scale-105'
                                                        : 'bg-white border-white text-slate-500 hover:border-emerald-200'
                                                    }`}
                                                >
                                                    {isTaken ? 'BOOKED' : label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {showCommentInput && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                                        <textarea 
                                            placeholder="Add an optional comment or note for your expert..."
                                            value={patientComment}
                                            onChange={(e) => setPatientComment(e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-emerald-50/20 font-medium text-slate-700 min-h-[100px] resize-none focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm"
                                        />
                                    </motion.div>
                                )}

                                <div className="flex gap-4 items-center">
                                    <button 
                                        onClick={() => setShowCommentInput(!showCommentInput)}
                                        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${showCommentInput ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-500'}`}>
                                        <MessageSquare size={22} className="mt-0.5" />
                                    </button>
                                    <button 
                                        onClick={confirmBooking}
                                        disabled={bookingId === bookingModalExpert?.expertId}
                                        className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-[15px] transition-all flex items-center justify-center shadow-xl shadow-emerald-200 disabled:opacity-50"
                                    >
                                        {bookingId === bookingModalExpert?.expertId ? <Loader2 size={18} className="animate-spin" /> : 'Book an Appointment'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
