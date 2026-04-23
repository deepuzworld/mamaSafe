'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, 
    CheckCircle, 
    ShieldAlert, 
    Users, 
    FileWarning, 
    BarChart3, 
    Activity,
    UserCheck,
    Trash2,
    EyeOff,
    Settings,
    LogOut,
    X,
    Archive,
    Shield,
    Plus,
    FileText,
    Edit3,
    Eye,
    Clock,
    FileEdit,
    PlusCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
    const [pendingExperts, setPendingExperts] = useState<any[]>([]);
    const [allExperts, setAllExperts] = useState<any[]>([]);
    const [removedExperts, setRemovedExperts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [redFlags, setRedFlags] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Control Center');
    const [showAddExpertModal, setShowAddExpertModal] = useState(false);
    const [eduFilter, setEduFilter] = useState('All');
    const [newExpertForm, setNewExpertForm] = useState({
        fullName: '',
        email: '',
        specialization: '',
        licenseNo: ''
    });

    const [educationContent, setEducationContent] = useState<any[]>([]);
    const [showAddResourceModal, setShowAddResourceModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewResource, setPreviewResource] = useState<any>(null);
    const [newResourceForm, setNewResourceForm] = useState({ title: '', content: '', category: 'Care Giving', type: 'article', url: '' });
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
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

            const [resAudit, resModeration, resExperts, resAnalytics, resUsers, resAllExperts, resRemoved, resEdu, resActivity] = await Promise.all([
                fetch('/core-api/admin/audit/face-id', { headers }),
                fetch('/core-api/admin/moderation/flagged', { headers }),
                fetch('/core-api/admin/experts/pending', { headers }),
                fetch('/core-api/admin/analytics/red-flags', { headers }),
                fetch('/core-api/admin/audit/users', { headers }),
                fetch('/core-api/admin/experts/all', { headers }),
                fetch('/core-api/admin/experts/removed', { headers }),
                fetch('/core-api/admin/education', { headers }),
                fetch('/core-api/admin/activity', { headers })
            ]);

            const [auditData, modData, expertData, analyticData, userData, allExpertsData, removedData, eduData, activityData] = await Promise.all([
                resAudit.json(), resModeration.json(), resExperts.json(), resAnalytics.json(), resUsers.json(), resAllExperts.json(), resRemoved.json(), resEdu.json(), resActivity.json()
            ]);

            if (auditData.success) {
                setStats(auditData.stats);
                setTotalUsers(auditData.totalUsers || 0);
            }
            if (modData.success) setFlaggedPosts(modData.flaggedPosts);
            if (expertData.success) setPendingExperts(expertData.pendingExperts);
            if (analyticData.success) setRedFlags(analyticData.trends);
            if (userData.success) setUsers(userData.users);
            if (allExpertsData.success) setAllExperts(allExpertsData.experts);
            if (removedData.success) setRemovedExperts(removedData.removedExperts);
            if (eduData.success) setEducationContent(eduData.resources);
            if (activityData.success) setActivity(activityData.activity);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEducationAction = async (resourceId: string, action: 'approve' | 'delete') => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            if (action === 'approve') {
                await fetch(`/core-api/admin/education/${resourceId}`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isApproved: true })
                });
            } else {
                if (!confirm('Are you sure you want to delete this resource?')) return;
                await fetch(`/core-api/admin/education/${resourceId}`, {
                    method: 'DELETE',
                    headers
                });
            }
            fetchData();
        } catch (err) {
            console.error('Error with education action:', err);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newResourceForm.title);
            formData.append('content', newResourceForm.content);
            formData.append('category', newResourceForm.category);
            formData.append('type', newResourceForm.type);
            formData.append('url', newResourceForm.url);
            if (uploadFile) {
                formData.append('file', uploadFile);
            }
            
            const res = await fetch('/core-api/education/resources', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setShowAddResourceModal(false);
                setNewResourceForm({ title: '', content: '', category: 'Health', type: 'article', url: '' });
                setUploadFile(null);
                fetchData();
            } else {
                alert('Failed to add resource');
            }
        } catch (err) {
            console.error('Error adding resource:', err);
        }
    };

    const handleModeration = async (postId: string, action: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/admin/moderation/post/${postId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, reason: 'Admin moderation action' })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error moderating post:', err);
        }
    };

    const handleVerifyExpert = async (expertId: string, status: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/admin/expert/verify/${expertId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error verifying expert:', err);
        }
    };

    const handleDeleteExpert = async (expertId: string) => {
        if (!confirm('Are you sure you want to remove this medical expert? Their data will be archived.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/admin/expert/${expertId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error deleting expert:', err);
        }
    };

    const handleAddExpertSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/admin/experts/add', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newExpertForm)
            });
            const data = await res.json();
            if (data.success) {
                setShowAddExpertModal(false);
                setNewExpertForm({ fullName: '', email: '', specialization: '', licenseNo: '' });
                fetchData();
            } else {
                alert(data.message || 'Error adding expert');
            }
        } catch (err) {
            console.error('Error adding expert:', err);
        }
    };

    let faceIdIntegrity = 0;
    if (stats && stats.length > 0) {
        let totalFace = 0;
        let verifiedCount = 0;
        stats.forEach((s: any) => {
            totalFace += s._count;
            if (s.verificationStatus === 'verified' || s.verificationStatus === 'VERIFIED') {
                verifiedCount += s._count;
            }
        });
        if (totalFace > 0) {
            faceIdIntegrity = (verifiedCount / totalFace) * 100;
        }
    }

    const chartData = [10, 10, 10, 10, 10, 10, 10, 10];
    if (redFlags.length > 0) {
        const rawCounts = [0, 0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        redFlags.forEach(flag => {
            const flagDate = new Date(flag.createdAt);
            const daysAgo = Math.floor((now.getTime() - flagDate.getTime()) / (1000 * 3600 * 24));
            if (daysAgo >= 0 && daysAgo < 8) {
                rawCounts[7 - daysAgo] += 1;
            }
        });
        const max = Math.max(...rawCounts);
        if (max > 0) {
            for(let i=0; i<8; i++) {
                chartData[i] = rawCounts[i] === 0 ? 10 : Math.max(10, (rawCounts[i] / max) * 100);
            }
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-rose-50/10 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFCFD] flex font-sans relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-rose-50 rounded-full blur-[120px] -mr-96 -mt-96 opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] -ml-96 -mb-96 opacity-50 pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-80 bg-white/60 backdrop-blur-3xl border-r border-white p-8 flex flex-col h-screen fixed z-20 shadow-xl shadow-slate-200/20">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">AdminPortal</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Overseer</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { icon: Activity, label: 'Control Center' },
                        { icon: Users, label: 'User Audit' },
                        { icon: UserCheck, label: 'Expert Portal' },
                        { icon: BarChart3, label: 'System Analytics' },
                        { icon: Plus, label: 'Education' },
                    ].map((item) => (
                        <button 
                            key={item.label}
                            onClick={() => setActiveTab(item.label)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                                activeTab === item.label ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}
                </nav>

                <button 
                    onClick={() => { localStorage.clear(); router.push('/login'); }}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all mt-auto"
                >
                    <LogOut size={20} /> Sign Out
                </button>
            </aside>

            <main className="ml-80 flex-1 p-12 overflow-y-auto">
                <header className="flex justify-between items-end mb-16 relative z-10">
                    <div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Command Center</h2>
                        <p className="text-slate-500 font-bold text-lg tracking-tight">Real-time oversight of the MamaSafe safety ecosystem.</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-xl px-10 py-6 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/30 flex items-center gap-6">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Total Network Users</p>
                            <p className="text-3xl font-black text-slate-900 leading-tight">{totalUsers.toLocaleString()}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-10">
                    {activeTab === 'Control Center' && (
                        <>
                            <div className="col-span-8 space-y-10">
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10">Face-ID Integrity</p>
                                        <div className="flex items-end gap-3 relative z-10">
                                            <p className="text-4xl font-black text-slate-900">{stats ? (faceIdIntegrity > 0 ? faceIdIntegrity.toFixed(1) + '%' : '0%') : 'N/A'}</p>
                                            <CheckCircle className="text-emerald-500 mb-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10">Verification Queue</p>
                                        <div className="flex items-end gap-3 relative z-10">
                                            <p className="text-4xl font-black text-slate-900">{pendingExperts.length}</p>
                                            <UserCheck className="text-indigo-500 mb-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10">Critical Alerts</p>
                                        <div className="flex items-end gap-3 relative z-10">
                                            <p className="text-4xl font-black text-rose-500">{redFlags.filter(f => f.severity === 'Critical').length}</p>
                                            <AlertTriangle className="text-rose-500 mb-1" size={24} />
                                        </div>
                                    </div>
                                </div>

                                <section className="relative z-10">
                                     <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8 ml-2">
                                         <FileWarning size={20} className="text-rose-500" /> Moderation Queue
                                     </h3>
                                     <div className="space-y-4">
                                         {flaggedPosts.length === 0 ? (
                                             <div className="bg-white/40 backdrop-blur-md p-16 rounded-[4rem] border border-dashed border-slate-200 text-center text-slate-400 italic font-bold">
                                                 <CheckCircle size={48} className="mx-auto mb-4 opacity-10" />
                                                 System is clean. No pending flags.
                                             </div>
                                         ) : (
                                             flaggedPosts.map(post => (
                                                 <div key={post.postId} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white flex justify-between items-center group shadow-xl shadow-slate-200/20 hover:bg-white transition-all">
                                                     <div className="flex items-center gap-6">
                                                         <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
                                                             <ShieldAlert size={24} />
                                                         </div>
                                                         <div>
                                                             <h4 className="font-black text-slate-900 text-lg mb-1">{post.title || 'Untitled Post'}</h4>
                                                             <p className="text-xs font-bold text-slate-500 truncate max-w-md">{post.content}</p>
                                                         </div>
                                                     </div>
                                                     <div className="flex gap-3">
                                                         <button onClick={() => handleModeration(post.postId, 'hide')} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"><EyeOff size={18} /></button>
                                                         <button onClick={() => handleModeration(post.postId, 'delete')} className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                                                     </div>
                                                 </div>
                                             ))
                                         )}
                                     </div>
                                 </section>
                            </div>

                            <div className="col-span-4">
                                <section className="bg-[#1e1b4b] p-8 rounded-[3rem] text-white shadow-2xl mb-8">
                                    <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                                        <Activity className="text-indigo-400" size={20} /> Risk Velocity
                                    </h3>
                                    <div className="h-32 flex items-end gap-2">
                                        {chartData.map((h, i) => (
                                            <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-white/70 backdrop-blur-xl p-10 rounded-[4rem] border border-white shadow-2xl shadow-slate-200/20 relative z-10">
                                    <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
                                        <Clock className="text-indigo-500" size={24} /> System Activity
                                    </h3>
                                    <div className="space-y-8">
                                        {activity.length === 0 ? (
                                            <p className="text-slate-400 italic font-bold text-center py-10">No activity recorded.</p>
                                        ) : (
                                            activity.map((item, idx) => (
                                                <div key={idx} className="flex gap-6 relative">
                                                    {idx !== activity.length - 1 && (
                                                        <div className="absolute left-[11px] top-8 bottom-[-32px] w-0.5 bg-slate-100" />
                                                    )}
                                                    <div className={`w-6 h-6 rounded-full mt-1 flex-shrink-0 z-10 border-4 border-white shadow-sm ${
                                                        item.type === 'user' ? 'bg-emerald-500' :
                                                        item.type === 'post' ? 'bg-indigo-500' : 'bg-rose-500'
                                                    }`} />
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 leading-snug">{item.content}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">
                                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </>
                    )}

                    {activeTab === 'Expert Portal' && (
                        <div className="col-span-12 space-y-12">
                            <section>
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <UserCheck className="text-indigo-500" size={20} /> Pending Validation
                                </h3>
                                <div className="grid grid-cols-3 gap-6">
                                    {pendingExperts.map(expert => (
                                        <div key={expert.expertId} className="bg-white p-6 rounded-[2.5rem] border border-slate-200">
                                            <h4 className="font-black text-slate-900 mb-1">{expert.user?.fullName}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{expert.specialization}</p>
                                            <div className="flex gap-3">
                                                <button onClick={() => handleVerifyExpert(expert.expertId, true)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase">Approve</button>
                                                <button onClick={() => handleVerifyExpert(expert.expertId, false)} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase">Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingExperts.length === 0 && <p className="text-slate-400 italic font-medium col-span-3 text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200">No pending experts.</p>}
                                </div>
                            </section>

                            <section>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <Shield className="text-emerald-500" size={20} /> Active Medical Experts
                                    </h3>
                                    <button onClick={() => setShowAddExpertModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs">Add New Expert</button>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    {allExperts.map(expert => (
                                        <div key={expert.expertId} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group">
                                            <div>
                                                <h4 className="font-black text-slate-900">{expert.user?.fullName}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expert.specialization}</p>
                                            </div>
                                            <button onClick={() => handleDeleteExpert(expert.expertId)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="mt-16">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <Archive className="text-slate-400" size={20} /> Removed Medical Experts
                                </h3>
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Expert Name</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Email</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Specialization</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">License</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Removed At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {removedExperts.map(exp => (
                                                <tr key={exp.id} className="hover:bg-slate-50">
                                                    <td className="px-8 py-6 font-black text-slate-900">{exp.fullName}</td>
                                                    <td className="px-8 py-6 text-sm text-slate-500">{exp.email}</td>
                                                    <td className="px-8 py-6 text-sm font-bold text-indigo-600">{exp.specialization}</td>
                                                    <td className="px-8 py-6 text-sm font-medium text-slate-400">{exp.licenseNo}</td>
                                                    <td className="px-8 py-6 text-xs text-slate-400 font-bold">{new Date(exp.removedAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {removedExperts.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">No archived experts.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'Education' && (
                        <div className="col-span-12 grid grid-cols-12 gap-10">
                            <div className="col-span-8 space-y-8">
                                <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/30">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <FileText className="text-indigo-500" size={24} /> Education Content List
                                        </h3>
                                        <div className="flex bg-slate-100 rounded-2xl p-1">
                                            {['All', 'Pending', 'Approved'].map(f => (
                                                <button 
                                                    key={f}
                                                    onClick={() => setEduFilter(f)}
                                                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                                                        eduFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {educationContent.filter((c: any) => eduFilter === 'All' || (eduFilter === 'Approved' ? c.isApproved : !c.isApproved)).map((c: any) => (
                                            <div key={c.resourceId} className="p-6 rounded-[2rem] border border-slate-100 hover:border-slate-200 transition-all bg-slate-50 flex items-center justify-between group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-lg mb-1">{c.title}</h4>
                                                        <div className="flex items-center gap-4 text-xs font-bold">
                                                            <span className="text-slate-500">By {c.authorName || 'Unknown'}</span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <div className={`flex items-center gap-1.5 ${
                                                                c.isApproved ? 'text-emerald-500' : 'text-amber-500'
                                                            }`}>
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                                                        c.isApproved ? 'bg-emerald-400' : 'bg-amber-400'
                                                                    }`}></span>
                                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                                                        c.isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                                                                    }`}></span>
                                                                </span>
                                                                {c.isApproved ? 'Approved' : 'Pending Review'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!c.isApproved ? (
                                                        <button onClick={() => { setPreviewResource(c); setShowPreviewModal(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all flex items-center gap-2">
                                                            <Eye size={14} /> Preview
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => window.open(c.url || c.thumbnail, '_blank')} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2">
                                                            <Eye size={14} /> View
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleEducationAction(c.resourceId, 'delete')} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center gap-2">
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <div className="col-span-4 space-y-8">
                                <section className="bg-gradient-to-br from-[#1e1b4b] to-indigo-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Activity size={100} />
                                    </div>
                                    <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                                        ⚡ Quick Actions
                                    </h3>
                                    <div className="space-y-3 relative z-10">
                                        <button onClick={() => setShowAddResourceModal(true)} className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center gap-4 transition-all group border border-white/5">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                <Plus size={18} />
                                            </div>
                                            <span className="font-bold text-sm tracking-wide">Add New Content</span>
                                        </button>
                                        <button onClick={() => setEduFilter('All')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-4 transition-all group border border-white/5">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-300 group-hover:text-white transition-colors">
                                                <FileEdit size={18} />
                                            </div>
                                            <span className="font-bold text-sm tracking-wide text-indigo-100">Drafts / All</span>
                                        </button>
                                        <button onClick={() => setEduFilter('Pending')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-4 transition-all group border border-white/5">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-300 group-hover:text-amber-200 transition-colors">
                                                <Clock size={18} />
                                            </div>
                                            <span className="font-bold text-sm tracking-wide text-amber-100">Pending Reviews</span>
                                        </button>
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                                        <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <BarChart3 size={14} /> Stats
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white/5 px-5 py-3 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-emerald-400" />
                                                    <span className="text-sm font-bold text-indigo-100">Published</span>
                                                </div>
                                                <span className="text-lg font-black">{educationContent.filter(c => c.isApproved).length}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/5 px-5 py-3 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-amber-400" />
                                                    <span className="text-sm font-bold text-indigo-100">Pending</span>
                                                </div>
                                                <span className="text-lg font-black">{educationContent.filter(c => !c.isApproved).length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'User Audit' && (
                        <div className="col-span-12 space-y-12">
                            <section className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/30">
                                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Users className="text-emerald-500" size={24} /> User Audit Log
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{users.length} Users Found</span>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Name</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Email</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Role</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Face ID</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map((u: any) => (
                                            <tr key={u.userId} className="hover:bg-slate-50">
                                                <td className="px-8 py-6 font-black text-slate-900">{u.fullName}</td>
                                                <td className="px-8 py-6 text-sm text-slate-500">{u.email}</td>
                                                <td className="px-8 py-6 text-sm font-bold text-indigo-600 uppercase">{u.role}</td>
                                                <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                                    {u.faceVerification?.verificationStatus || 'Pending'}
                                                </td>
                                                <td className="px-8 py-6 text-xs text-slate-400 font-bold">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">No users available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        </div>
                    )}

                    {activeTab === 'System Analytics' && (
                        <div className="col-span-12 space-y-12">
                            <section className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/30">
                                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <BarChart3 className="text-rose-500" size={24} /> System Risk Analytics
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{redFlags.length} Events Logged</span>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Severity</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Trigger Source</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Detected At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {redFlags.map((flag: any, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-8 py-6 font-black text-slate-900">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        flag.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 
                                                        flag.severity === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'
                                                    }`}>
                                                        {flag.severity}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-bold text-slate-600">{flag.triggerSource}</td>
                                                <td className="px-8 py-6 text-xs text-slate-400 font-bold">{new Date(flag.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {redFlags.length === 0 && (
                                            <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-400 italic">No risks detected on the system.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {showAddExpertModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddExpertModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowAddExpertModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><X size={20} /></button>
                            <h3 className="text-2xl font-black text-slate-900 mb-8">Register Expert</h3>
                            <form onSubmit={handleAddExpertSubmit} className="space-y-5">
                                <input type="text" required value={newExpertForm.fullName} onChange={e => setNewExpertForm({...newExpertForm, fullName: e.target.value})} className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50" placeholder="Full Name" />
                                <input type="email" required value={newExpertForm.email} onChange={e => setNewExpertForm({...newExpertForm, email: e.target.value})} className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50" placeholder="Email Address" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" required value={newExpertForm.specialization} onChange={e => setNewExpertForm({...newExpertForm, specialization: e.target.value})} className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50" placeholder="Specialization" />
                                    <input type="text" required value={newExpertForm.licenseNo} onChange={e => setNewExpertForm({...newExpertForm, licenseNo: e.target.value})} className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50" placeholder="License No" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">Create Account</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
                {showAddResourceModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddResourceModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowAddResourceModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><X size={20} /></button>
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><PlusCircle size={28} className="text-[#7c3aed]" /> Add New Content</h3>
                            <form onSubmit={handleAddResource} className="space-y-5">
                                <input type="text" required value={newResourceForm.title} onChange={e => setNewResourceForm({...newResourceForm, title: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 placeholder:font-medium placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Content Title" />
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={newResourceForm.category} onChange={e => setNewResourceForm({...newResourceForm, category: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-600 appearance-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all">
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
                                    <select value={newResourceForm.type} onChange={e => setNewResourceForm({...newResourceForm, type: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-600 appearance-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all">
                                        <option value="article">Article</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                                <textarea required value={newResourceForm.content} onChange={e => setNewResourceForm({...newResourceForm, content: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 min-h-[140px] placeholder-slate-400 resize-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Main Content / Description"></textarea>
                                {newResourceForm.type === 'video' && (
                                    <input type="url" value={newResourceForm.url} onChange={e => setNewResourceForm({...newResourceForm, url: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Video URL (optional if uploading)" />
                                )}
                                <div className="p-4 rounded-2xl border border-dashed border-[#cbd5e1] text-center relative hover:bg-slate-50 transition-colors">
                                    <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <span className="font-bold text-sm text-[#7c3aed]">{uploadFile ? uploadFile.name : 'Upload File / Thumbnail'}</span>
                                </div>
                                <button type="submit" className="w-full py-4 bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors text-white rounded-2xl font-black mt-2">Submit Resource</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
                
                {showPreviewModal && previewResource && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowPreviewModal(false); setPreviewResource(null); }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-10 w-full max-w-2xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setShowPreviewModal(false); setPreviewResource(null); }} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={16} /></button>
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">{previewResource.title}</h3>
                                <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span>{previewResource.type}</span>
                                    <span>•</span>
                                    <span>{previewResource.category}</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 max-h-[40vh] overflow-y-auto w-full">
                                {(previewResource.url || previewResource.thumbnail) && previewResource.type === 'video' ? (
                                    <div className="bg-slate-200 rounded-xl flex justify-center items-center h-48 mb-6 overflow-hidden">
                                        <a href={previewResource.url || previewResource.thumbnail} target="_blank" className="font-bold text-indigo-600 flex items-center gap-2" rel="noreferrer">
                                            <Eye size={18} /> Open Video Link
                                        </a>
                                    </div>
                                ) : (previewResource.thumbnail) && (
                                    <img src={previewResource.thumbnail} alt="Banner" className="w-full h-48 object-cover rounded-xl mb-6" />
                                )}
                                <div className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed space-y-4">
                                    {previewResource.content}
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button onClick={() => { handleEducationAction(previewResource.resourceId, 'approve'); setShowPreviewModal(false); }} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    <CheckCircle size={18} /> Approve Content
                                </button>
                                <button onClick={() => { handleEducationAction(previewResource.resourceId, 'delete'); setShowPreviewModal(false); }} className="flex-1 py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors rounded-xl font-bold flex items-center justify-center gap-2">
                                    <Trash2 size={18} /> Delete Content
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

