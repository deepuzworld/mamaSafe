'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, 
    Plus, 
    Bot, 
    Brain, 
    Mic, 
    MicOff, 
    ChevronRight, 
    Activity, 
    X, 
    Send,
    Sparkles,
    Smile,
    Heart,
    MessageCircle,
    Thermometer,
    Zap,
    Loader2,
    Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const RED_FLAGS = {
    low: ['tired', 'exhausted', 'crying', 'sad', 'stressed', 'struggling', 'alone', 'lonely', 'hard'],
    medium: ['overwhelmed', "can't function", 'worthless', 'guilty', 'anxious', 'panic', 'failure', 'bad mother'],
    high: ['kill', 'die', 'hurt', 'harm', 'end it', 'not my baby', 'better off without me', 'want to sleep forever']
};

function FeedVideo({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(video);
        return () => observer.disconnect();
    }, []);

    return (
        <video 
            ref={videoRef}
            loop
            muted
            playsInline
            className="w-full h-32 object-cover"
        >
            <source src={src} />
        </video>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState({ role: 'mother', fullName: 'User', userId: 'user123' });
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const role = localStorage.getItem('userRole') || 'mother';
        const fullName = localStorage.getItem('userName') || 'User';
        
        if (role === 'partner') {
            router.push('/partner');
            return;
        }
        
        setUser(prev => ({ ...prev, role, fullName }));
        setPageLoading(false);
    }, []);

    const [journalText, setJournalText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognitionLang, setRecognitionLang] = useState<'en-US' | 'ml-IN'>('en-US');

    // Audio Recording State
    const [journalMode, setJournalMode] = useState<'text' | 'voice'>('text');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
        { role: 'bot', text: 'Hi Jane, I am NurtureAI. I am here to listen. How are you feeling right now?' }
    ]);
    const [currentMsg, setCurrentMsg] = useState('');
    const [redFlagScore, setRedFlagScore] = useState(0);
    const [showLogModal, setShowLogModal] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [history, setHistory] = useState<any[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isChatOpen]);

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('/core-api/tracking/history', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.History) {
                            const combined = [
                                ...data.History.moods.map((m: any) => ({ ...m, type: 'mood' })),
                                ...data.History.sleeps.map((s: any) => ({ ...s, type: 'sleep' })),
                                ...data.History.journals.map((j: any) => ({ ...j, type: 'journal' }))
                            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            setHistory(combined);
                        }
                    }
                } catch (err) {
                    console.error("Fetch history failed", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        const fetchCommunity = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('/core-api/community/posts', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.posts) {
                            setCommunityPosts(data.posts.slice(0, 3));
                        }
                    }
                } catch (err) {
                    console.error("Fetch community failed", err);
                }
            }
        };

        fetchHistory();
        fetchCommunity();
    }, []);

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = recognitionLang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript) {
                setJournalText(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecordingAudio(true);
        } catch (err) {
            console.error("Error accessing microphone", err);
            alert("Microphone access denied or not available.");
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorderRef.current && isRecordingAudio) {
            mediaRecorderRef.current.stop();
            setIsRecordingAudio(false);
        }
    };

    const clearAudioRecording = () => {
        setAudioBlob(null);
        audioChunksRef.current = [];
    };

    const submitJournal = () => {
        setJournalText('');
        alert("Entry saved and analyzed by NurtureAI.");
    };

    const handleRedButton = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/core-api/emergency/red-button', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ locationData: 'Dashboard Shortcut' })
            });

            if (res.ok) {
                alert("Emergency protocol activated. Your partner has been notified.");
            } else {
                alert("Failed to activate emergency protocol. Please contact help manually.");
            }
        } catch (error) {
            console.error("Emergency activation failed", error);
            alert("Network error. Please contact help manually.");
        }
    };

    const sendChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = currentMsg.trim();
        if (!msg) return;

        // 1. Optimistic UI update
        const updatedMessages = [...chatMessages, { role: 'user', text: msg }];
        setChatMessages(updatedMessages as any);
        setCurrentMsg('');

        // 2. Analyze Red Flags
        let scoreIncrease = 0;
        const lowerText = msg.toLowerCase();

        RED_FLAGS.low.forEach(w => { if (lowerText.includes(w)) scoreIncrease += 1; });
        RED_FLAGS.medium.forEach(w => { if (lowerText.includes(w)) scoreIncrease += 2; });
        RED_FLAGS.high.forEach(w => { if (lowerText.includes(w)) scoreIncrease += 3; });

        const newScore = redFlagScore + scoreIncrease;
        setRedFlagScore(newScore);

        if (newScore > 5) {
            handleRedButton();
            setChatMessages(prev => [...prev, {
                role: 'bot',
                text: '🚨 [System Alert] NurtureAI detected signs that you are experiencing intense distress. I am escalating this to connect you immediately with your registered partner and therapist.'
            }]);
            return;
        }

        // 3. Consult Gemini API
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            });
            const data = await res.json();
            setChatMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
        } catch (error) {
            setChatMessages(prev => [...prev, {
                role: 'bot',
                text: "I'm having trouble responding via AI right now, but please know I'm listening. (Network error)"
            }]);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12">
            <div className="max-w-[1400px] mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            G'day, {user.fullName.split(' ')[0]} <span className="text-emerald-500">✨</span>
                        </h2>
                        <p className="text-slate-700 font-bold tracking-tight">
                            Your safety net is active. How's your heart feeling today?
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Safety Status</span>
                            <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Protected
                            </span>
                        </div>
                        <button
                            onClick={handleRedButton}
                            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:bg-rose-50 hover:border-rose-100 transition-all group active:scale-95"
                            title="Emergency Red Button"
                        >
                            <ShieldAlert size={24} className="text-rose-500 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Hero Focus Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 rounded-[3rem] p-10 lg:col-span-2 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/10 group"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-700" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full -ml-20 -mb-20 blur-[80px] pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-700" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-8">
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border border-emerald-500/20">Active Session</span>
                            </div>
                            
                            <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-[1.1]">Focus on your <br /><span className="text-emerald-400">emotional healing.</span></h3>
                            <p className="text-slate-300 mb-10 font-bold text-lg max-w-lg leading-relaxed">Every log brings us closer to understanding your rhythm. How are you navigating this moment?</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => router.push('/tracking')}
                                    className="bg-white text-slate-900 px-8 py-5 rounded-[2rem] font-black text-base shadow-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 group/btn active:scale-95"
                                >
                                    <Plus size={20} className="group-hover/btn:rotate-90 transition-transform" /> Log Daily Vitals
                                </button>
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-8 py-5 rounded-[2rem] font-black text-base hover:bg-white/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Bot size={20} className="text-emerald-400" /> Consult NurtureAI
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Emergency Assist Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center group hover:bg-rose-50/50 hover:border-rose-100 transition-all cursor-pointer relative overflow-hidden"
                        onClick={handleRedButton}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 text-rose-500 flex items-center justify-center mb-6 shadow-xl shadow-rose-200/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <ShieldAlert size={44} />
                        </div>
                        <h4 className="font-black text-slate-900 mb-3 text-2xl tracking-tight">Emergency Help</h4>
                        <p className="text-slate-700 font-bold mb-8 max-w-[180px] leading-snug">Press immediately if you feel unsafe or overwhelmed.</p>
                        <div className="bg-rose-500 text-white text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest shadow-lg shadow-rose-200/50 group-hover:bg-rose-600 transition-colors">Activate Pulse</div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Premium Quick Journal Widget */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col h-[520px]"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                                    <Brain size={24} />
                                </div>
                                <h3 className="font-black text-slate-900 text-xl tracking-tight">Quick Reflection</h3>
                            </div>
                            <div className="flex bg-slate-100/80 p-1.5 rounded-[1.5rem] w-fit">
                                <button 
                                    onClick={() => setJournalMode('text')}
                                    className={cn("px-5 py-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-wider", journalMode === 'text' ? "bg-white shadow-md text-emerald-600" : "text-slate-600 hover:text-slate-800")}
                                >
                                    Text Mode
                                </button>
                                <button 
                                    onClick={() => setJournalMode('voice')}
                                    className={cn("px-5 py-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-wider", journalMode === 'voice' ? "bg-white shadow-md text-emerald-600" : "text-slate-600 hover:text-slate-800")}
                                >
                                    Voice Note
                                </button>
                            </div>
                        </div>

                        {journalMode === 'text' ? (
                            <div className="flex flex-col flex-1 gap-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Dictation Service</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-black shadow-sm"
                                            value={recognitionLang}
                                            onChange={e => setRecognitionLang(e.target.value as any)}
                                        >
                                            <option value="en-US">ENGLISH</option>
                                            <option value="ml-IN">MALAYALAM</option>
                                        </select>
                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            className={cn(
                                                "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm",
                                                isListening ? "bg-rose-500 text-white animate-pulse" : "bg-white text-emerald-600 border border-slate-200 hover:border-emerald-200"
                                            )}
                                        >
                                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    className="w-full flex-1 p-8 text-lg font-medium text-slate-700 bg-slate-50/50 rounded-[2rem] border border-slate-100 focus:ring-4 focus:ring-emerald-500/5 outline-none resize-none placeholder:text-slate-400 transition-all"
                                    placeholder={isListening ? "Listening... Your words are safe here." : "Briefly capture your thoughts..."}
                                    value={journalText}
                                    onChange={e => setJournalText(e.target.value)}
                                />
                                <button
                                    className="w-full bg-slate-900 hover:bg-emerald-600 text-white disabled:opacity-20 py-5 rounded-[2rem] font-black text-base transition-all disabled:cursor-not-allowed shadow-xl shadow-slate-200 active:scale-[0.98] group"
                                    onClick={submitJournal}
                                    disabled={!journalText.trim()}
                                >
                                    <span className="flex items-center justify-center gap-2">Securely Save Entry <Sparkles size={18} /></span>
                                </button>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center p-12 bg-slate-50/80 rounded-[2.5rem] border border-dashed border-slate-200 transition-all flex-1 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                {!audioBlob ? (
                                    <div className="relative z-10 flex flex-col items-center">
                                        <button
                                            onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                                            className={cn(
                                                "flex items-center justify-center w-28 h-28 rounded-full transition-all duration-500 shadow-2xl active:scale-95",
                                                isRecordingAudio ? "bg-rose-500 animate-pulse shadow-rose-200" : "bg-white text-emerald-600 hover:text-emerald-700 shadow-emerald-200 border border-slate-50"
                                            )}
                                        >
                                            {isRecordingAudio ? <MicOff size={40} /> : <Mic size={40} />}
                                        </button>
                                        <p className="text-sm font-black mt-8 text-slate-700 tracking-tight text-center">
                                            {isRecordingAudio ? "Your voice note is recording..." : "Tap to capture a voice reflection"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center gap-10 w-full animate-in fade-in zoom-in duration-500">
                                        <div className="w-full bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col items-center">
                                             <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-xs mb-4" />
                                             <div className="h-1.5 w-64 bg-emerald-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-1/2" />
                                             </div>
                                        </div>
                                        <div className="flex gap-4 w-full px-4">
                                            <button 
                                                onClick={clearAudioRecording} 
                                                className="flex-1 bg-white text-rose-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest border border-rose-100 shadow-sm hover:bg-rose-50 transition-all"
                                            >
                                                Discard
                                            </button>
                                            <button 
                                                onClick={() => { clearAudioRecording(); alert("Audio saved!"); }} 
                                                className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                                            >
                                                Analyze & Save
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Refined Activity List */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col h-[520px]"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <Activity size={24} />
                                </div>
                                <h3 className="font-black text-slate-900 text-xl tracking-tight">Recent Progress</h3>
                            </div>
                            <button 
                                onClick={() => router.push('/health-logs')}
                                className="text-[10px] font-black text-slate-600 hover:text-emerald-600 uppercase tracking-widest px-4 py-2 hover:bg-emerald-50 rounded-xl transition-all"
                            >
                                View History
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-3 custom-scrollbar custom-pb-8">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gathering your story...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50/80 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-200 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    <div className="w-20 h-20 bg-white rounded-full shadow-xl border border-slate-100 flex items-center justify-center mb-6 text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500">
                                        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                                        <Sparkles size={32} className="text-emerald-500 relative z-10" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-2 relative z-10">Your journey starts here</h4>
                                    <p className="text-slate-500 font-bold text-center relative z-10 text-sm leading-loose">
                                        Each log helps us understand your needs better. <br />Capture your first reflection today.
                                    </p>
                                </div>
                            ) : (
                                history.map((log: any, idx: number) => (
                                    <motion.div 
                                        key={idx} 
                                        whileHover={{ x: 8, backgroundColor: '#F8FAFC' }}
                                        onClick={() => setSelectedActivity(log)} 
                                        className="flex items-center gap-5 p-5 bg-white rounded-[2rem] border border-slate-50 shadow-sm cursor-pointer transition-all duration-300 hover:border-emerald-100 group"
                                    >
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0 relative overflow-hidden",
                                            log.type === 'mood' ? (log.moodScore > 7 ? "bg-emerald-50 text-emerald-600" : log.moodScore > 4 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-500") :
                                                log.type === 'sleep' ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"
                                        )}>
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-current opacity-20" />
                                            {log.type === 'mood' ? (log.moodScore >= 7 ? "😄" : log.moodScore >= 5 ? "😐" : "😢") : log.type === 'sleep' ? `${log.hoursSlept}h` : <Brain size={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-base font-black text-slate-900 capitalize truncate tracking-tight">{log.type} Check-in</p>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-600 truncate uppercase mt-1 tracking-tight">{new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                                            <ChevronRight size={18} />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Community Highlights Widget */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col h-[520px]"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-inner">
                                    <MessageCircle size={24} />
                                </div>
                                <h3 className="font-black text-slate-900 text-xl tracking-tight">Community</h3>
                            </div>
                            <button 
                                onClick={() => router.push('/community')}
                                className="text-[10px] font-black text-slate-600 hover:text-emerald-600 uppercase tracking-widest px-4 py-2 hover:bg-emerald-50 rounded-xl transition-all"
                            >
                                View All
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-3 custom-scrollbar custom-pb-8">
                            {communityPosts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <Users size={32} className="text-slate-200 mb-4" />
                                    <p className="text-slate-600 font-bold text-center">No recent posts.<br/>Be the first to share!</p>
                                </div>
                            ) : (
                                communityPosts.map((post: any) => (
                                    <motion.div 
                                        key={post.postId}
                                        whileHover={{ x: 8, backgroundColor: '#F8FAFC' }}
                                        onClick={() => router.push('/community')}
                                        className="p-5 bg-white rounded-[2rem] border border-slate-50 shadow-sm cursor-pointer transition-all duration-300 hover:border-emerald-100 group flex flex-col gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs overflow-hidden border border-white shadow-sm shrink-0">
                                                {post.avatarUrl ? (
                                                    <img src={post.avatarUrl} alt={post.pseudonym} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Smile size={14} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-900 text-sm">{post.pseudonym}</h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        {post.content && (
                                            <p className="text-sm font-medium text-slate-600 line-clamp-2 leading-snug">{post.content}</p>
                                        )}
                                        {post.attachments && post.attachments.length > 0 && (
                                            <div className="mt-2 rounded-xl overflow-hidden shadow-sm relative border border-slate-100 bg-slate-50">
                                                {post.attachments[0].fileType === 'video' ? (
                                                    <FeedVideo src={`${post.attachments[0].fileUrl}`} />
                                                ) : post.attachments[0].fileType === 'image' ? (
                                                    <img 
                                                        src={`${post.attachments[0].fileUrl}`} 
                                                        className="w-full h-32 object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-1 pt-3 border-t border-slate-50 text-slate-400">
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase"><Heart size={12}/> {post.supportCount}</span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase"><MessageCircle size={12}/> {post.commentCount}</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Activity Modal */}
            <AnimatePresence>
                {selectedActivity && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
                        onClick={() => setSelectedActivity(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)] border border-slate-100"
                        >
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className={cn(
                                    "w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner mb-6",
                                    selectedActivity.type === 'mood' ? "bg-amber-50" : selectedActivity.type === 'sleep' ? "bg-indigo-50" : "bg-teal-50"
                                )}>
                                    {selectedActivity.type === 'mood' ? "😄" : selectedActivity.type === 'sleep' ? "🌙" : "📖"}
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{selectedActivity.type} Details</h3>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-2">{new Date(selectedActivity.createdAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                            </div>

                            <div className="space-y-4">
                                {selectedActivity.type === 'mood' && (
                                    <>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-600 uppercase block mb-2 text-center">Mood Level</span>
                                            <div className="text-4xl font-black text-slate-900 text-center mb-2">{selectedActivity.moodScore}<span className="text-lg text-slate-500 font-bold ml-1">/10</span></div>
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedActivity.moodScore * 10}%` }} />
                                            </div>
                                        </div>
                                        {selectedActivity.notes && <div className="bg-amber-50/30 p-6 rounded-[2rem] border border-amber-50 text-sm font-medium text-amber-900 leading-relaxed italic">"{selectedActivity.notes}"</div>}
                                    </>
                                )}
                                {selectedActivity.type === 'sleep' && (
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] text-center border border-indigo-50">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Duration</p>
                                            <p className="text-3xl font-black text-indigo-900">{selectedActivity.hoursSlept}h</p>
                                        </div>
                                        <div className="bg-emerald-50/50 p-6 rounded-[2rem] text-center border border-emerald-50">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Quality</p>
                                            <p className="text-3xl font-black text-emerald-900">{selectedActivity.sleepQuality}<span className="text-xs text-emerald-300">/10</span></p>
                                        </div>
                                    </div>
                                )}
                                {selectedActivity.type === 'journal' && (
                                    <div className="bg-teal-50/30 p-8 rounded-[2.5rem] border border-teal-50 relative">
                                        <Sparkles className="absolute top-4 right-4 text-teal-300/30" size={24} />
                                        <p className="text-slate-700 text-lg font-medium italic leading-relaxed text-center">"{selectedActivity.content}"</p>
                                    </div>
                                )}
                            </div>
                            
                            <button onClick={() => setSelectedActivity(null)} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200">Dismiss</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium NurtureAI Chat Modal */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl sm:p-10"
                        onClick={() => setIsChatOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 40, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_40px_160px_-40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[740px] max-h-[90vh] border border-white/20"
                        >
                            {/* Modern Chat Header */}
                            <div className="bg-slate-900 p-10 text-white flex justify-between items-center shrink-0 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-emerald-500/30 transition-colors duration-1000"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center border-2 border-emerald-500/30 shadow-2xl relative z-10">
                                            <Bot size={34} className="text-emerald-50" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-4 border-slate-900 rounded-full z-20" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl tracking-tighter">NurtureAI</h3>
                                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mt-1.5 px-1">
                                            Encrypted | Secure
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md relative z-10 active:scale-95">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Refined Messages Area */}
                            <div className="flex-1 overflow-y-auto p-10 bg-[#FBFDFF] space-y-8 custom-scrollbar">
                                {chatMessages.map((msg, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={idx} 
                                        className={cn("flex flex-col max-w-[82%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
                                    >
                                        <div className={cn(
                                            "p-6 rounded-[2rem] leading-relaxed text-base font-medium shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-200"
                                                : "bg-white border border-slate-100 text-slate-700 rounded-tl-none border-b-2"
                                        )}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] items-end font-black text-slate-500 mt-3 px-3 uppercase tracking-widest">
                                            {msg.role === 'user' ? 'Me' : 'NurtureAI'}
                                        </span>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Clean Message Input */}
                            <form onSubmit={sendChatMessage} className="p-10 bg-white border-t border-slate-50 shrink-0">
                                <div className="flex items-center gap-3 bg-slate-50 rounded-[2rem] p-3 border border-slate-100 focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:bg-white transition-all duration-300">
                                    <input
                                        type="text"
                                        placeholder="Speak your heart..."
                                        className="flex-1 bg-transparent border-none focus:outline-none px-6 py-3 text-base font-bold text-slate-800 placeholder:text-slate-400"
                                        value={currentMsg}
                                        onChange={e => setCurrentMsg(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!currentMsg.trim()}
                                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-900 text-white disabled:opacity-5 disabled:grayscale transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 shrink-0"
                                    >
                                        <Send size={24} className="ml-1" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </main>
    );
}
