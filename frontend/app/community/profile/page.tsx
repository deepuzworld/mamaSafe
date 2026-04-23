'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, 
    MessageCircle, 
    Share2, 
    User, 
    ArrowLeft,
    Sparkles,
    Settings,
    History,
    UploadCloud,
    Trash2,
    Check,
    X,
    RefreshCw,
    Edit3,
    Bookmark,
    Activity,
    AtSign,
    MoreVertical,
    Camera
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommunityProfile() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<'liked' | 'uploaded' | 'replied'>('uploaded');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [tempPseudonym, setTempPseudonym] = useState('');
    const [tempBio, setTempBio] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [currentView, setCurrentView] = useState<'profile' | 'activity' | 'saved' | 'edit'>('profile');

    const categories = [
        { id: 'uploaded', label: 'My Posts', icon: UploadCloud },
        { id: 'media', label: 'Media Gallery', icon: Sparkles },
        { id: 'liked', label: 'Supported', icon: Heart },
    ];

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
                setTempPseudonym(data.profile.pseudonym);
                setTempBio(data.profile.bio || '');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchMyPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/me/posts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPosts(data.posts.map((p: any) => ({ ...p, type: 'uploaded' })));
            }
        } catch (err) {
            console.error('Error fetching my posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLikedPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/me/liked', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPosts(data.posts);
            }
        } catch (err) {
            console.error('Error fetching liked posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRepliedPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/me/replied', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPosts(data.posts);
            }
        } catch (err) {
            console.error('Error fetching replied posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeSection === 'uploaded') fetchMyPosts();
        if (activeSection === 'replied') fetchRepliedPosts();
        if (activeSection === 'liked') fetchLikedPosts();
    }, [activeSection]);

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/community/post/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(prev => prev.filter(p => p.postId !== postId));
                fetchProfile(); // Refresh stats
            }
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const handleUpdatePost = async (postId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/core-api/community/post/${postId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: editContent })
            });
            if (res.ok) {
                setPosts(prev => prev.map(p => p.postId === postId ? { ...p, content: editContent } : p));
                setEditingPostId(null);
            }
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };

    const generateRandomAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        setProfile((prev: any) => ({ ...prev, avatarUrl: newAvatar }));
        updateProfile(profile.pseudonym, profile.bio, newAvatar);
    };

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        await updateProfile(tempPseudonym, tempBio, profile.avatarUrl);
        setIsEditingProfile(false);
        setIsUpdating(false);
    };

    const updateProfile = async (pseudonym: string, bio: string, avatarUrl: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/profile', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pseudonym, bio, avatarUrl })
            });
            const data = await res.json();
            if (data.success) {
                setProfile((prev: any) => ({ 
                    ...prev, 
                    pseudonym: data.profile.pseudonym, 
                    bio: data.profile.bio,
                    avatarUrl: data.profile.avatarUrl 
                }));
            }
        } catch (err) {
            console.error('Error updating profile:', err);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!profile && loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <main className="min-h-screen pb-32 pt-12 px-4 md:px-8 bg-slate-50/50">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <button 
                        onClick={() => {
                            if (currentView === 'profile') {
                                router.push('/community');
                            } else {
                                setCurrentView('profile');
                            }
                        }}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-8 transition-colors"
                    >
                        <ArrowLeft size={16} /> {currentView === 'profile' ? 'Back to Circle' : 'Back to Profile'}
                    </button>
                    
                    {currentView === 'profile' && (
                        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 relative">
                            <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none z-0">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-40" />
                            </div>
                            
                            {/* Settings Icons */}
                            <div className="absolute top-8 right-8 z-20">
                                <button 
                                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                                    className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 text-slate-400 hover:text-emerald-600 transition-all active:scale-95"
                                >
                                    <Settings size={24} />
                                </button>

                                <AnimatePresence>
                                    {showSettingsDropdown && (
                                        <>
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setShowSettingsDropdown(false)}
                                                className="fixed inset-0 z-30"
                                            />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-40 p-2"
                                            >
                                                <button 
                                                    onClick={() => { setCurrentView('edit'); setShowSettingsDropdown(false); }}
                                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 rounded-2xl transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                                        <Edit3 size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-700">Edit Profile</span>
                                                </button>
                                                <button 
                                                    onClick={() => { setCurrentView('saved'); setShowSettingsDropdown(false); }}
                                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 rounded-2xl transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                        <Bookmark size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-700">Saved</span>
                                                </button>
                                                <button 
                                                    onClick={() => { setCurrentView('activity'); setShowSettingsDropdown(false); }}
                                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 rounded-2xl transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                        <Activity size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-700">Your Activity</span>
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                {/* Avatar Section */}
                                <div className="relative group">
                                    <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600 shadow-inner overflow-hidden border-4 border-white">
                                        {profile?.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={80} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <div className="mb-6">
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{profile?.pseudonym || 'AnonymousMama'}</h1>
                                        {profile?.bio && <p className="text-slate-700 font-bold text-lg max-w-lg mb-2">{profile?.bio}</p>}
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-8">
                                        <div className="text-center md:text-left">
                                            <p className="text-2xl font-black text-slate-900">{profile?.stats?.posts || 0}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posts Shared</p>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <p className="text-2xl font-black text-slate-900">{profile?.stats?.supports || 0}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supports Given</p>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <p className="text-2xl font-black text-slate-900">{profile?.stats?.comments || 0}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Replies Made</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {currentView === 'profile' && (
                    <>
                        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                            {[
                                { id: 'uploaded', label: 'My Posts', icon: UploadCloud },
                                { id: 'replied', label: 'Replied', icon: MessageCircle },
                                { id: 'liked', label: 'Supported', icon: Heart },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveSection(cat.id as any)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-sm whitespace-nowrap transition-all ${
                                        activeSection === cat.id 
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-400/20' 
                                        : 'bg-white text-slate-500 border border-slate-100 hover:border-emerald-200'
                                    }`}
                                >
                                    <cat.icon size={18} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving your history...</p>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                                    <History size={48} className="text-slate-200 mx-auto mb-6" />
                                    <h3 className="text-xl font-bold text-slate-800">No activity yet</h3>
                                    <p className="text-slate-500 mt-2">Your interactions in the circle will appear here.</p>
                                </div>
                            ) : (
                                <AnimatePresence mode='popLayout'>
                                    {posts.map((post) => (
                                        <motion.div
                                            key={post.postId}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/10 group overflow-hidden relative"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 overflow-hidden">
                                                        {post.avatarUrl ? (
                                                            <img src={post.avatarUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">{post.pseudonym}</h3>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(post.createdAt)}</p>
                                                    </div>
                                                </div>
                                                
                                                {activeSection === 'uploaded' && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => { setEditingPostId(post.postId); setEditContent(post.content); }}
                                                            className="p-3 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                                                            title="Edit Post"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeletePost(post.postId)}
                                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                            title="Delete Post"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {editingPostId === post.postId ? (
                                                <div className="flex flex-col gap-4 mb-6">
                                                    <textarea 
                                                        autoFocus
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:ring-2 ring-emerald-500/20 resize-none min-h-[120px]"
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <button 
                                                            onClick={() => setEditingPostId(null)}
                                                            className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdatePost(post.postId)}
                                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-slate-700 text-lg font-medium leading-relaxed mb-8">{post.content}</p>
                                            )}
                                            
                                            {post.attachments && post.attachments.map((att: any) => (
                                                <div key={att.attachmentId} className="mb-6 rounded-2xl overflow-hidden border border-slate-100 max-h-96">
                                                    {att.fileType === 'image' && <img src={`${att.fileUrl}`} className="w-full h-full object-cover" />}
                                                    {att.fileType === 'video' && (
                                                        <video src={`${att.fileUrl}`} controls className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            ))}

                                            <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                                <div className="flex items-center gap-2 text-slate-400 text-sm font-black uppercase tracking-widest">
                                                    <Heart size={18} className="text-rose-500 fill-current" /> {post.supportCount} Supports
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 text-sm font-black uppercase tracking-widest">
                                                    <MessageCircle size={18} className="text-emerald-500" /> {post.commentCount} Replies
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </>
                )}

                {currentView === 'activity' && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <h2 className="text-3xl font-black text-slate-900">Your Activity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Supported', count: profile?.stats?.supports || 0, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                                { label: 'Replied', count: profile?.stats?.comments || 0, icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Mentioned', count: 0, icon: AtSign, color: 'text-blue-500', bg: 'bg-blue-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 text-center group hover:scale-105 transition-all cursor-pointer">
                                    <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform`}>
                                        <item.icon size={30} />
                                    </div>
                                    <p className="text-4xl font-black text-slate-900 mb-2">{item.count}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/10 min-h-[300px] flex flex-col items-center justify-center text-center">
                            <Activity size={48} className="text-slate-100 mb-6" />
                            <p className="text-slate-400 font-bold italic">Detailed activity log coming soon...</p>
                        </div>
                    </motion.div>
                )}

                {currentView === 'saved' && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <h2 className="text-3xl font-black text-slate-900">All Saved</h2>
                        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/10 min-h-[400px] flex flex-col items-center justify-center text-center">
                            <Bookmark size={64} className="text-slate-100 mb-8" />
                            <h3 className="text-2xl font-black text-slate-800 mb-4">No saved items yet</h3>
                            <p className="text-slate-500 max-w-sm">When you save posts or media from the circle, they'll appear here for quick access.</p>
                            <button 
                                onClick={() => router.push('/community')}
                                className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-400/20"
                            >
                                Explore Circle
                            </button>
                        </div>
                    </motion.div>
                )}

                {currentView === 'edit' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100"
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-12">Edit Profile</h2>
                        
                        <div className="flex flex-col items-center mb-12">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-[3rem] bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden border-4 border-white shadow-xl group-hover:bg-slate-200 transition-colors">
                                    {profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={80} />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="text-white mb-2" size={32} />
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Tap to change</span>
                                    </div>
                                </div>
                                </div>
                        </div>

                        <div className="space-y-8 max-w-xl mx-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">User Name</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 focus-within:ring-2 ring-emerald-500/20 transition-all">
                                    <User size={20} className="text-slate-400" />
                                    <input 
                                        value={tempPseudonym}
                                        onChange={(e) => setTempPseudonym(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-xl font-bold text-slate-900 w-full placeholder:text-slate-300"
                                        placeholder="Your Community Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bio</label>
                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 focus-within:ring-2 ring-emerald-500/20 transition-all">
                                    <textarea 
                                        value={tempBio}
                                        onChange={(e) => setTempBio(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-lg font-medium text-slate-700 w-full placeholder:text-slate-300 resize-none h-32"
                                        placeholder="Tell the circle a bit about your journey..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setCurrentView('profile')}
                                    className="flex-1 py-5 rounded-[2rem] text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
                                >
                                    Discard Changes
                                </button>
                                <button 
                                    onClick={async () => {
                                        await handleUpdateProfile();
                                        setCurrentView('profile');
                                    }}
                                    disabled={isUpdating || !tempPseudonym.trim()}
                                    className="flex-1 py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
