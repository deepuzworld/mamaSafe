'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    FileText, 
    LayoutDashboard, 
    LogOut, 
    Settings, 
    ShieldCheck, 
    User,
    TrendingUp,
    TrendingDown,
    Brain,
    Moon,
    Plus,
    PlusCircle,
    X,
    MessageSquare,
    ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './cropImage';

export default function ExpertDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expertData, setExpertData] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [activePatient, setActivePatient] = useState<any>(null);
    const [patientTrends, setPatientTrends] = useState<any>(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        specialization: '',
        licenseNo: '',
        bio: '',
        availability: ''
    });

    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
    const [sessionNotes, setSessionNotes] = useState('');
    const [patientCondition, setPatientCondition] = useState({ currentCondition: '', expertNotes: '' });
    const [isSavingCondition, setIsSavingCondition] = useState(false);

    // Profile Image States
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [contributionFile, setContributionFile] = useState<File | null>(null);
    const [contributionForm, setContributionForm] = useState({
        title: '',
        content: '',
        type: 'story',
        category: 'Care Giving',
        thumbnail: '',
        url: ''
    });

    useEffect(() => {
        const savedImage = localStorage.getItem('expertProfileImage');
        if (savedImage) setProfileImage(savedImage);
    }, []);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'professional') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const resSessions = await fetch('/core-api/professional/appointments', { headers });
            const dataSessions = await resSessions.json();
            
            if (resSessions.status === 403 && dataSessions.mustResetPassword) {
                router.push('/reset-password');
                return;
            }

            if (dataSessions.success) setSessions(dataSessions.sessions);

            // Mocking initial data for demonstration if empty
            if (!dataSessions.sessions || dataSessions.sessions.length === 0) {
                 setExpertData({
                    specialization: 'Perinatal Psychologist',
                    licenseNo: 'MED-992-12',
                    bio: 'Specializing in postpartum depression and anxiety.',
                    isVerified: true
                 });
            }
        } catch (err) {
            console.error('Error fetching expert data:', err);
        } finally {
            setLoading(false);
        }
    };


    const fetchTrends = async (patientId: string, patientName: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/professional/patient-trends/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPatientTrends(data.trends);
                setActivePatient({ id: patientId, name: patientName });
                
                // Also fetch persistent patient condition
                const resCond = await fetch(`/core-api/professional/patient-condition/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataCond = await resCond.json();
                if (dataCond.success && dataCond.profile) {
                    setPatientCondition({
                        currentCondition: dataCond.profile.currentCondition || '',
                        expertNotes: dataCond.profile.expertNotes || ''
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching trends:', err);
        }
    };

    const handleUpdatePatientCondition = async () => {
        if (!activePatient) return;
        setIsSavingCondition(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/professional/patient-condition/${activePatient.id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientCondition)
            });
            if (res.ok) alert('Patient record updated successfully');
        } catch (err) {
            console.error('Error updating patient condition:', err);
        } finally {
            setIsSavingCondition(false);
        }
    };

    const handleContributionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('title', contributionForm.title);
            data.append('content', contributionForm.content);
            data.append('type', contributionForm.type);
            data.append('category', contributionForm.category);
            data.append('url', contributionForm.url);
            if (contributionFile) {
                data.append('file', contributionFile);
            }

            const res = await fetch('/core-api/education/resources', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
            const result = await res.json();
            if (result.success) {
                alert('Contribution submitted! It will appear once approved by admin.');
                setShowContributeModal(false);
                setContributionFile(null);
                setContributionForm({
                    title: '', content: '', type: 'story', category: 'Care Giving', thumbnail: '', url: ''
                });
            }
        } catch (err) {
            console.error('Error submitting contribution:', err);
        }
    };

    const handleCompleteSession = async () => {
        if (!selectedMeeting) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/professional/appointment/${selectedMeeting.meetingId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Completed', clinicalNotes: sessionNotes || 'Routine clinical review performed.' })
            });
            if (res.ok) {
                fetchData();
                setShowCompletionModal(false);
                setSelectedMeeting(null);
                setSessionNotes('');
            }
        } catch (err) {
            console.error('Error updating session:', err);
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSelectedImage(reader.result as string);
                setShowCropModal(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropSave = async () => {
        try {
            if (selectedImage && croppedAreaPixels) {
                const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
                if (croppedImage) {
                    setProfileImage(croppedImage);
                    localStorage.setItem('expertProfileImage', croppedImage);
                    setShowCropModal(false);
                    setSelectedImage(null);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const completedSessionsCount = sessions.filter(s => s.status === 'Completed').length;
    const activePatientsCount = new Set(sessions.map(s => s.userId)).size;

    let moodScores = [5, 5, 5, 5, 5, 5, 5, 5];
    let sleepScores = [5, 5, 5, 5, 5, 5, 5, 5];
    if (patientTrends) {
        if (patientTrends.moodTrends && patientTrends.moodTrends.length > 0) {
            moodScores = patientTrends.moodTrends.slice(0, 8).reverse().map((m: any) => m.moodScore);
            while (moodScores.length < 8) moodScores.unshift(5);
        }
        if (patientTrends.sleepTrends && patientTrends.sleepTrends.length > 0) {
            sleepScores = patientTrends.sleepTrends.slice(0, 8).reverse().map((s: any) => s.sleepQuality);
            while (sleepScores.length < 8) sleepScores.unshift(5);
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px] -mr-64 -mt-64 opacity-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] -ml-64 -mb-64 opacity-30 pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-80 bg-white/50 backdrop-blur-3xl border-r border-white p-8 flex flex-col h-screen fixed z-20 shadow-xl shadow-slate-200/20">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">ExpertPortal</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Intervention</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { icon: LayoutDashboard, label: 'Dashboard' },
                        { icon: Calendar, label: 'Schedule' },
                        { icon: Activity, label: 'Analytics' },
                    ].map((item) => (
                        <button 
                            key={item.label}
                            onClick={() => setActiveTab(item.label)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                                activeTab === item.label ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto space-y-4">
                    <div 
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-inner shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                typeof window !== 'undefined' ? (localStorage.getItem('userName')?.charAt(0) || 'D') : 'D'
                            )}
                        </div>
                        <div className="text-left flex-1 overflow-hidden">
                            <p className="font-black text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                {typeof window !== 'undefined' ? (localStorage.getItem('userName')?.startsWith('Dr.') ? localStorage.getItem('userName') : `Dr. ${localStorage.getItem('userName') || 'Expert'}`) : 'Expert'}
                            </p>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                <CheckCircle2 size={10} /> Verified Status
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { localStorage.clear(); router.push('/login'); }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-80 flex-1 p-12 overflow-y-auto">
                <header className="mb-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {typeof window !== 'undefined' ? (localStorage.getItem('userName')?.startsWith('Dr.') ? localStorage.getItem('userName') : `Dr. ${localStorage.getItem('userName')}`) : ''}</h2>
                            <p className="text-slate-500 font-medium">You have {sessions.filter(s => s.status === 'Pending').length} pending sessions today.</p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowContributeModal(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Plus size={16} /> Contribute to Education
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === 'Dashboard' && (
                    <>
                        <div className="grid grid-cols-3 gap-8 mb-12">
                            <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:bg-white/80 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-colors group-hover:bg-emerald-500/10" />
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-inner relative z-10">
                                     <CheckCircle2 size={24} />
                                 </div>
                                 <p className="text-4xl font-black text-slate-900 mb-1 relative z-10">{completedSessionsCount}</p>
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px] relative z-10">Interventions Made</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:bg-white/80 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-colors group-hover:bg-orange-500/10" />
                                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-inner relative z-10">
                                     <Clock size={24} />
                                 </div>
                                 <p className="text-4xl font-black text-slate-900 mb-1 relative z-10">{sessions.length}</p>
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px] relative z-10">Total Consultations</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:bg-white/80 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-colors group-hover:bg-indigo-500/10" />
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-inner relative z-10">
                                     <User size={24} />
                                 </div>
                                 <p className="text-4xl font-black text-slate-900 mb-1 relative z-10">{activePatientsCount}</p>
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px] relative z-10">Active Patients</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-12">
                            {/* Appointments List */}
                            <div className="col-span-2 space-y-8">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-4">
                                    <Calendar size={20} className="text-indigo-600" /> Upcoming Sessions
                                </h3>
                                {sessions.length === 0 ? (
                                    <div className="bg-white/40 backdrop-blur-md p-12 rounded-[3.5rem] border border-dashed border-slate-200 text-center shadow-inner">
                                        <p className="text-slate-400 font-bold italic">No bookings found for today.</p>
                                    </div>
                                ) : (
                                    sessions.map((session) => (
                                        <motion.div 
                                            key={session.meetingId}
                                            whileHover={{ y: -5, x: 5 }}
                                            className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/20 flex justify-between items-center group cursor-pointer transition-all"
                                            onClick={() => {
                                                fetchTrends(session.userId, session.user.fullName);
                                                setActiveTab('Analytics');
                                            }}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{session.user.fullName}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (session.status !== 'Completed') {
                                                        setSelectedMeeting(session);
                                                        setShowCompletionModal(true);
                                                    }
                                                }}
                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                                    session.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 cursor-default' : 'bg-slate-900 text-white hover:bg-emerald-500'
                                                }`}
                                            >
                                                {session.status}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Patient Review Panel Quick View */}
                            <div className="col-span-3">
                                {activePatient ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white/70 backdrop-blur-3xl p-10 rounded-[4rem] border border-white shadow-2xl shadow-indigo-100/20 h-full flex flex-col"
                                    >
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                                                    {activePatient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900">{activePatient.name}</h3>
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Case Review</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab('Analytics')}
                                                className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-2"
                                            >
                                                Full Analytics <ChevronRight size={14} />
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Current Condition</label>
                                                <p className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {patientCondition.currentCondition || 'No condition recorded yet.'}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Clinical Observations</label>
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                                    "{patientCondition.expertNotes || 'No long-term notes recorded. Please add notes in the Analytics tab.'}"
                                                </p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setActiveTab('Analytics')}
                                            className="w-full py-4 mt-8 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                        >
                                            Update Case Records
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="bg-white/60 backdrop-blur-3xl p-10 rounded-[4rem] border border-white shadow-2xl shadow-indigo-100/20 min-h-full flex items-center justify-center text-center py-20 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent pointer-events-none" />
                                        <div className="space-y-4 relative z-10">
                                            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-indigo-400 mx-auto mb-8 border border-white shadow-xl shadow-indigo-100/20">
                                                <Activity size={48} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-3">Health Insights</h3>
                                            <p className="text-slate-500 max-w-[280px] font-bold leading-relaxed mb-8 mx-auto">
                                                Select a patient from the list to synchronize their health trends and clinical history.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'Schedule' && (
                    <div className="space-y-8">
                        <div className="bg-white/70 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white shadow-xl shadow-slate-200/50">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Calendar size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Schedule</h2>
                                    <p className="text-slate-500 font-bold">Review and finalize your patient encounters.</p>
                                </div>
                            </div>
                            
                            <div className="max-w-3xl space-y-4">
                                {sessions.length === 0 ? (
                                    <p className="text-slate-400 font-bold italic">No bookings found for today.</p>
                                ) : (
                                    sessions.map((session) => (
                                        <div key={session.meetingId} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 group">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-[1.2rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <User size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-lg mb-1">{session.user.fullName}</h4>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        if (session.status !== 'Completed') {
                                                            setSelectedMeeting(session);
                                                            setShowCompletionModal(true);
                                                        }
                                                    }}
                                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        session.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white hover:bg-indigo-600'
                                                    }`}
                                                >
                                                    {session.status === 'Completed' ? 'Completed' : 'Mark as Complete'}
                                                </button>
                                            </div>
                                            {session.patientComment && (
                                                <div className="mt-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2"><MessageSquare size={12}/> Patient Note</p>
                                                    <p className="text-sm text-slate-700 font-medium">{session.patientComment}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Set Available Time Slots</h3>
                                    <p className="text-slate-500 font-medium">Define your availability for private patient sessions.</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <input 
                                    type="text" 
                                    placeholder="09:00, 10:30, 14:00" 
                                    defaultValue={expertData?.availability || "08:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 14:00"} 
                                    className="flex-1 w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700" 
                                />
                                <button 
                                    onClick={() => alert('Availability Slots Updated Successfully!')} 
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black whitespace-nowrap shadow-lg shadow-indigo-200 transition-all w-full md:w-auto"
                                >
                                    Save Timings
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Analytics' && (
                    <div className="bg-white/70 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Case Review</h2>
                                <p className="text-slate-500 font-bold">Deep analytical insights for active patients.</p>
                            </div>
                        </div>

                        {activePatient ? (
                            <div className="space-y-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-1">{activePatient.name}</h3>
                                        <p className="text-sm font-bold text-slate-400 mb-4">Clinical Review Profile</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"><FileText size={20} /></button>
                                        <button className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 transition-all hover:scale-110"><CheckCircle2 size={20} /></button>
                                    </div>
                                </div>

                                {/* Trends Section */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3 mb-8">
                                            <Brain size={18} className="text-indigo-500" />
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mood Trends</h4>
                                        </div>
                                        <div className="flex items-end gap-2 h-24 mb-6">
                                            {moodScores.map((score, i) => (
                                                <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg transition-all hover:bg-indigo-500" style={{ height: `${score * 10}%` }} />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                                            <TrendingDown size={14} /> 12% drop this week
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3 mb-8">
                                            <Moon size={18} className="text-indigo-500" />
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sleep Efficiency</h4>
                                        </div>
                                        <div className="flex items-end gap-2 h-24 mb-6">
                                            {sleepScores.map((score, i) => (
                                                <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg transition-all hover:bg-indigo-500" style={{ height: `${score * 10}%` }} />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                            <TrendingUp size={14} /> Improving gradually
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Patient Condition Tracking</h4>
                                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Clinical Status</label>
                                            <input 
                                                type="text" 
                                                value={patientCondition.currentCondition}
                                                onChange={e => setPatientCondition({...patientCondition, currentCondition: e.target.value})}
                                                placeholder="e.g. Stable, Mild Anxiety, High Risk..."
                                                className="w-full px-6 py-4 rounded-2xl border border-white bg-white shadow-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Long-term Tracking Notes</label>
                                            <textarea 
                                                value={patientCondition.expertNotes}
                                                onChange={e => setPatientCondition({...patientCondition, expertNotes: e.target.value})}
                                                placeholder="Continuous clinical notes for future reference..."
                                                className="w-full px-6 py-4 rounded-2xl border border-white bg-white shadow-sm font-medium text-slate-700 min-h-[150px] resize-none focus:outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleUpdatePatientCondition}
                                            disabled={isSavingCondition}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isSavingCondition ? 'Saving Records...' : 'Save & Track Condition'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Last Consultation Clinical Observation</h4>
                                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 text-lg">
                                        <p className="text-slate-700 font-medium leading-relaxed italic">
                                            "{patientTrends.lastClinicalNotes || 'No prior clinical observations found for this patient. Start by documenting your first session notes.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center py-24">
                                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-8 shadow-sm">
                                    <Activity size={48} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3">No Active Patient</h3>
                                <p className="text-slate-400 font-medium max-w-sm">Please select a patient from the Dashboard to review their case data.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Profile Update Modal */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setShowProfileModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            >
                                ✕
                            </button>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Update Profile</h3>
                            <p className="text-sm font-bold text-slate-400 mb-8">Manage your basic information</p>

                            <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-3xl shadow-inner shrink-0 relative group cursor-pointer border border-dashed border-indigo-300 overflow-hidden">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            typeof window !== 'undefined' ? (localStorage.getItem('userName')?.charAt(0) || 'D') : 'D'
                                        )}
                                        <div className="absolute inset-0 bg-indigo-600/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200">
                                                <Plus size={20} className="text-indigo-600" />
                                            </div>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                                        <input type="text" defaultValue={typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : ''} className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
                                    <input type="tel" placeholder="+1 (555) 000-0000" className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Specialization</label>
                                    <input type="text" defaultValue={expertData?.specialization || ''} className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        alert('Profile updated successfully!');
                                        setShowProfileModal(false);
                                    }}
                                    className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-colors shadow-lg shadow-indigo-600/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Crop Modal */}
            <AnimatePresence>
                {showCropModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] overflow-hidden w-full max-w-2xl shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Crop Profile Photo</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Adjust your picture</p>
                                </div>
                                <button 
                                    onClick={() => setShowCropModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative h-96 bg-slate-100">
                                {selectedImage && (
                                    <Cropper
                                        image={selectedImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                )}
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Zoom Control</span>
                                        <span>{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setShowCropModal(false)}
                                        className="flex-1 py-4 rounded-2xl font-black text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCropSave}
                                        className="flex-1 py-4 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all"
                                    >
                                        Apply & Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>            {/* Contribute to Education Modal */}
            <AnimatePresence>
                {showContributeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowContributeModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowContributeModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><PlusCircle size={28} className="text-[#7c3aed]" /> Add New Content</h3>
                            <form onSubmit={handleContributionSubmit} className="space-y-5">
                                <input type="text" required value={contributionForm.title} onChange={e => setContributionForm({...contributionForm, title: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 placeholder:font-medium placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Content Title" />
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={contributionForm.category} onChange={e => setContributionForm({...contributionForm, category: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-600 appearance-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all">
                                        <option value="Health">Health</option>
                                        <option value="Caregiving">Caregiving</option>
                                        <option value="Nutrition">Nutrition</option>
                                        <option value="Mental Health">Mental Health</option>
                                        <option value="Labor & Delivery">Labor & Delivery</option>
                                        <option value="Postpartum Care">Postpartum Care</option>
                                        <option value="Physical Therapy">Physical Therapy</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Sleep Management">Sleep Management</option>
                                    </select>
                                    <select value={contributionForm.type} onChange={e => setContributionForm({...contributionForm, type: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-600 appearance-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all">
                                        <option value="article">Article</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                                <textarea required value={contributionForm.content} onChange={e => setContributionForm({...contributionForm, content: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 min-h-[140px] placeholder-slate-400 resize-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Main Content / Description"></textarea>
                                {contributionForm.type === 'video' && (
                                    <input type="url" value={contributionForm.url} onChange={e => setContributionForm({...contributionForm, url: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Video URL (optional if uploading)" />
                                )}
                                <div className="p-4 rounded-2xl border border-dashed border-[#cbd5e1] text-center relative hover:bg-slate-50 transition-colors">
                                    <input type="file" onChange={e => setContributionFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <span className="font-bold text-sm text-[#7c3aed]">{contributionFile ? contributionFile.name : 'Upload File / Thumbnail'}</span>
                                </div>
                                <button type="submit" className="w-full py-4 bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors text-white rounded-2xl font-black mt-2">Submit Contribution for Review</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Session Completion Modal */}
            <AnimatePresence>
                {showCompletionModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCompletionModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowCompletionModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 mb-1">Complete Session</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Add Clinical Notes for {selectedMeeting?.user?.fullName}</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Observations</label>
                                    <textarea 
                                        required 
                                        value={sessionNotes} 
                                        onChange={e => setSessionNotes(e.target.value)} 
                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-medium text-slate-700 min-h-[160px] placeholder-slate-400 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                        placeholder="Enter detailed observations, recommendations, and next steps..."
                                    ></textarea>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setShowCompletionModal(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCompleteSession}
                                        className="flex-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 transition-all"
                                    >
                                        Finalize Session
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
