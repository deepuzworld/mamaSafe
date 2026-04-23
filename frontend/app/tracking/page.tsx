'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, 
    Moon, 
    Smile, 
    Apple, 
    Activity, 
    Target, 
    Droplets, 
    Baby, 
    Edit3, 
    HeartHandshake, 
    Info, 
    TrendingUp, 
    AlertTriangle, 
    Mic, 
    MicOff, 
    Plus, 
    X, 
    ChevronLeft,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Urbanist } from 'next/font/google';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500', '700', '900'] });

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const EMOTION_OPTIONS = [
    { value: 1, label: "Awful", emoji: "😢", color: "text-rose-500", bg: "bg-rose-50" },
    { value: 3, label: "Bad", emoji: "😟", color: "text-orange-500", bg: "bg-orange-50" },
    { value: 5, label: "Okay", emoji: "😐", color: "text-amber-500", bg: "bg-amber-50" },
    { value: 8, label: "Good", emoji: "🙂", color: "text-emerald-500", bg: "bg-emerald-50" },
    { value: 10, label: "Great", emoji: "😄", color: "text-teal-500", bg: "bg-teal-50" }
];

const FOOD_OPTIONS = [
    { value: "Snacks", label: "Snacks", emoji: "🥞" },
    { value: "Meals", label: "Meals", emoji: "🥗" },
    { value: "Fruits", label: "Fruits", emoji: "🍎" },
    { value: "Tea", label: "Tea", emoji: "☕" }
];

const ACTIVITY_OPTIONS = [
    { value: 1, label: "Mostly resting", emoji: "🛌" },
    { value: 5, label: "Light activity", emoji: "🚶" },
    { value: 10, label: "Active", emoji: "🏃" }
];

const FOCUS_OPTIONS = [
    { value: 1, label: "Very distracted", emoji: "😵" },
    { value: 5, label: "Normal", emoji: "😐" },
    { value: 10, label: "Focused", emoji: "🎯" }
];

const BABY_CARE_OPTIONS = [
    { value: 1, label: "Awful", emoji: "😫" },
    { value: 5, label: "Manageable", emoji: "😮‍💨" },
    { value: 10, label: "Relaxed", emoji: "😌" }
];

export default function TrackingPage() {
    const router = useRouter();
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

    const [sleep, setSleep] = useState(6);
    const [water, setWater] = useState(4);
    const [babyStress, setBabyStress] = useState(5);
    const [needHelp, setNeedHelp] = useState(false);

    const [emotion, setEmotion] = useState(5);
    const [foodIntake, setFoodIntake] = useState<{ name: string, time: string }[]>([]);
    const [physicalActivity, setPhysicalActivity] = useState(5);
    const [distractions, setDistractions] = useState(5);
    const [notes, setNotes] = useState('');

    // Voice to Text State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Audio Recording State
    const [journalMode, setJournalMode] = useState<'text' | 'voice'>('text');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;

                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                    }
                    if (finalTranscript) setNotes((prev) => (prev ? prev + ' ' : '') + finalTranscript);
                };
                recognitionRef.current.onerror = () => setIsListening(false);
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Your browser does not support speech recognition. Try Google Chrome.');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) { console.error(e); }
        }
    };

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecordingAudio(true);
        } catch (err) { alert("Microphone access denied."); }
    };

    const stopAudioRecording = () => {
        if (mediaRecorderRef.current && isRecordingAudio) {
            mediaRecorderRef.current.stop();
            setIsRecordingAudio(false);
        }
    };

    const clearAudioRecording = () => { setAudioBlob(null); audioChunksRef.current = []; };

    const calculateMoodScore = () => {
        const dietScore = foodIntake.length === 0 ? 1 : foodIntake.length <= 1 ? 5 : 10;
        const score = Math.round((emotion * 2 + dietScore + physicalActivity + distractions) / 5);
        return Math.min(Math.max(score, 1), 10);
    };

    const currentScore = calculateMoodScore();

    const getScoreColor = (score: number) => {
        if (score <= 3) return { text: 'text-rose-500', bg: 'bg-rose-100', dot: '🔴', border: 'border-rose-200' };
        if (score <= 6) return { text: 'text-amber-500', bg: 'bg-amber-100', dot: '🟡', border: 'border-amber-200' };
        return { text: 'text-emerald-500', bg: 'bg-emerald-100', dot: '🟢', border: 'border-emerald-200' };
    };

    const submitLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { alert('Please log in.'); return; }

            const sleepRes = await fetch('/core-api/tracking/sleep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ hoursSlept: sleep, sleepQuality: 5 }),
            });

            const exactLogTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const fullNotes = `Date: ${logDate} @ ${exactLogTime}\nNeed Support: ${needHelp ? 'YES' : 'No'}\nWater Intake: ${water}/8 glasses\nBaby Care Stress: ${babyStress}/10\nNotes: ${notes}\nFactors -> Emotion: ${emotion}/10, Food: ${foodIntake.length}, Activity: ${physicalActivity}, Focus: ${distractions}`;

            const moodRes = await fetch('/core-api/tracking/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ moodScore: currentScore, notes: fullNotes }),
            });

            if (sleepRes.ok && moodRes.ok) {
                alert("Health logs saved successfully!");
                router.push('/dashboard');
            } else { alert("Failed to save logs."); }
        } catch (error) { console.error(error); }
    };

    const colorTheme = getScoreColor(currentScore);

    return (
        <main className={cn("p-4 lg:p-8 max-w-7xl mx-auto w-full bg-[#F8FAFC] min-h-screen text-[#23323D]", urbanist.className)}>
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button 
                            onClick={() => router.back()}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 mb-6 transition-all active:scale-95 group"
                        >
                            <ChevronLeft size={20} className="text-slate-400 group-hover:text-slate-600" />
                        </button>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            Log Daily Vitals <span className="text-emerald-500">📈</span>
                        </h2>
                        <p className="text-slate-700 font-bold tracking-tight">Record your pulse for today, {new Date(logDate).toLocaleDateString([], { month: 'long', day: 'numeric' })}.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-emerald-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/40 transition-colors duration-700" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <TrendingUp size={24} className="text-emerald-400" />
                            </div>
                            <h4 className="font-black text-lg mb-2">Daily Momentum</h4>
                            <p className="text-emerald-50/90 font-medium text-sm leading-relaxed">Your consistency in logging helps NurtureAI understand your unique baseline for safety.</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-center">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                <Info size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-lg mb-1">Quick Insight</h4>
                                <p className="text-slate-700 font-bold text-sm leading-relaxed">
                                    {sleep < 6 ? "Less sleep detected. Prioritize hydration and resting between feedings today." : "Sleep is stable today. Try to maintain consistent meal times."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-8">
                    {/* Core Vitals Section */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30">
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Physical Foundation</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <label className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]"><Moon size={14} className="text-indigo-500" /> Sleep Hours</label>
                                    <span className="text-3xl font-black text-indigo-600">{sleep}<span className="text-sm ml-1 text-slate-400">h</span></span>
                                </div>
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <input
                                        type="range" min="0" max="15" step="0.5"
                                        value={sleep} onChange={e => setSleep(parseFloat(e.target.value))}
                                        className="w-full h-2.5 bg-indigo-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                                        <span>Crisis Level</span>
                                        <span>Restored</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <label className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]"><Droplets size={14} className="text-cyan-500" /> Hydration</label>
                                    <span className="text-3xl font-black text-cyan-600">{water}<span className="text-sm ml-1 text-slate-400">gl</span></span>
                                </div>
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <input
                                        type="range" min="0" max="12" step="1"
                                        value={water} onChange={e => setWater(parseInt(e.target.value))}
                                        className="w-full h-2.5 bg-cyan-100 rounded-full appearance-none cursor-pointer accent-cyan-600"
                                    />
                                    <div className="flex justify-between mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                                        <span>Critical</span>
                                        <span>Optimal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Mood & Factors Section */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30">
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                                <Smile size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Emotional Pulse</h3>
                        </div>

                        <div className="space-y-12">
                            <div>
                                <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 px-1">How are you feeling right now?</h5>
                                <div className="grid grid-cols-5 gap-3 sm:gap-6">
                                    {EMOTION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setEmotion(opt.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all border-2 active:scale-95 group",
                                                emotion === opt.value 
                                                    ? cn(opt.bg, "border-current shadow-xl scale-105", opt.color) 
                                                    : "bg-white border-transparent text-slate-400 hover:border-slate-100 hover:bg-slate-50"
                                            )}
                                        >
                                            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{opt.emoji}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <label className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px] mb-6"><Apple size={14} className="text-rose-500" /> Diet Track</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {FOOD_OPTIONS.map(opt => {
                                            const selected = foodIntake.find(f => f.name === opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setFoodIntake(prev => prev.find(f => f.name === opt.value) ? prev.filter(v => v.name !== opt.value) : [...prev, { name: opt.value, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])}
                                                    className={cn(
                                                        "flex flex-col items-center p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                                                        selected ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-100 text-slate-600 shadow-sm hover:border-slate-200"
                                                    )}
                                                >
                                                    <span className="text-xl mb-1">{opt.emoji}</span> {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 lg:col-span-2">
                                    <label className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px] mb-6"><Activity size={14} className="text-indigo-500" /> Postpartum Care Stress</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {BABY_CARE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setBabyStress(opt.value)}
                                                className={cn(
                                                    "flex flex-col items-center p-6 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95",
                                                    babyStress === opt.value ? "bg-white border-emerald-500 text-emerald-600 shadow-lg scale-105" : "bg-white border-slate-50 text-slate-600 shadow-sm opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <span className="text-3xl mb-3">{opt.emoji}</span> {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Journal Section */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-500 shadow-inner">
                                    <Edit3 size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Private Reflection</h3>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">
                                <button onClick={() => setJournalMode('text')} className={cn("px-5 py-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-wider", journalMode === 'text' ? "bg-white shadow-md text-emerald-600" : "text-slate-600")}>Text Mode</button>
                                <button onClick={() => setJournalMode('voice')} className={cn("px-5 py-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-wider", journalMode === 'voice' ? "bg-white shadow-md text-emerald-600" : "text-slate-600")}>Audio Note</button>
                            </div>
                        </div>

                        {journalMode === 'text' ? (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <button 
                                        onClick={toggleListening} 
                                        className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border shadow-sm active:scale-95", isListening ? "bg-rose-500 text-white border-rose-500" : "bg-white text-emerald-600 border-slate-100 hover:border-emerald-200")}
                                    >
                                        {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />} 
                                        {isListening ? "Stop Listening" : "Start Voice Dictation"}
                                    </button>
                                </div>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={isListening ? "I'm listening... Speak your heart." : "How was your day? Focus on your emotions, physical sensations, or baby milestones. NurtureAI reviews this for your safety."}
                                    className="w-full h-48 p-10 text-lg font-medium text-slate-700 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 focus:ring-4 focus:ring-emerald-500/5 outline-none resize-none placeholder:text-slate-400 transition-all font-serif"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-64 flex flex-col items-center justify-center p-12 bg-slate-50/80 rounded-[3rem] border border-dashed border-slate-200 transition-all group overflow-hidden relative">
                                {!audioBlob ? (
                                    <div className="flex flex-col items-center">
                                        <button onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording} className={cn("flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 shadow-2xl active:scale-95", isRecordingAudio ? "bg-rose-500 animate-pulse shadow-rose-200" : "bg-emerald-500 shadow-emerald-200 text-white hover:bg-emerald-600")}>
                                            {isRecordingAudio ? <MicOff size={32} /> : <Mic size={32} />}
                                        </button>
                                        <p className="text-xs font-black mt-8 text-slate-600 tracking-widest uppercase">{isRecordingAudio ? "Recording your voice note..." : "Tap to capture a voice reflection"}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center w-full max-w-sm space-y-10 animate-in fade-in zoom-in duration-500">
                                        <audio src={URL.createObjectURL(audioBlob)} controls className="w-full shadow-lg rounded-full" />
                                        <button onClick={clearAudioRecording} className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-50 px-6 py-2 rounded-full border border-rose-100">Discard and Re-record</button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div 
                            onClick={() => setNeedHelp(!needHelp)}
                            className={cn(
                                "mt-12 p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center gap-6 group",
                                needHelp ? "bg-rose-50 border-rose-200 shadow-xl shadow-rose-100" : "bg-white border-slate-50 hover:border-slate-100"
                            )}
                        >
                            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-colors shadow-inner", needHelp ? "bg-rose-500 text-white shadow-rose-200" : "bg-slate-50 text-slate-300 group-hover:text-slate-400")}>
                                {needHelp ? <AlertTriangle size={32} /> : <HeartHandshake size={32} />}
                            </div>
                            <div className="flex-1">
                                <h4 className={cn("font-black text-xl tracking-tight mb-1", needHelp ? "text-rose-900" : "text-slate-900")}>Emotional Support Requested</h4>
                                <p className={cn("text-sm font-bold", needHelp ? "text-rose-600" : "text-slate-600")}>Checking this notifies your partner or therapist of your distress status.</p>
                            </div>
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0", needHelp ? "bg-rose-500 border-rose-500 text-white" : "border-slate-100")}>
                                {needHelp && <CheckCircle2 size={18} />}
                            </div>
                        </div>
                    </motion.section>

                    {/* Submit Bar */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner", colorTheme.bg)}>
                                    {Math.round(currentScore)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Calculated Pulse</span>
                                        <div className={cn("w-2 h-2 rounded-full", currentScore > 6 ? "bg-emerald-500" : currentScore > 3 ? "bg-amber-500" : "bg-rose-500")} />
                                    </div>
                                    <p className={cn("font-black text-lg tracking-tight", colorTheme.text)}>{currentScore > 6 ? "Looking Stable ✨" : currentScore > 3 ? "Navigation Required ⚠️" : "Alert Protocol Zone 🚨"}</p>
                                </div>
                            </div>

                            <button
                                onClick={submitLogs}
                                className={cn(
                                    "w-full sm:w-auto px-12 py-5 rounded-[2rem] font-black text-base transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 group text-white",
                                    currentScore > 6 ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : currentScore > 3 ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-slate-900 hover:bg-slate-800"
                                )}
                            >
                                Securely Save Health Vitals <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
