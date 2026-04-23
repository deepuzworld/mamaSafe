'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Send, 
    MessageCircle, 
    Heart, 
    Share2, 
    MoreHorizontal, 
    Smile, 
    User,
    Sparkles,
    Filter,
    ArrowLeft,
    Image as ImageIcon,
    Film,
    Mic,
    TrendingUp,
    Zap,
    History,
    Plus,
    X,
    Flag,
    Ban,
    Home
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, Suspense } from 'react';
interface Comment {
    commentId: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: string;
    user: {
        fullName: string;
    }
}

interface PostAttachment {
    attachmentId: string;
    postId: string;
    fileUrl: string;
    fileType: 'image' | 'video' | 'audio';
    createdAt: string;
}

interface Post {
    postId: string;
    userId: string;
    pseudonym: string;
    content?: string;
    body?: string;
    title?: string;
    category?: string;
    createdAt: string;
    supportedByMe: boolean;
    supportCount: number;
    commentCount: number;
    comments: Comment[];
    attachments?: PostAttachment[];
    avatarUrl?: string;
}

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
            controls 
            className="w-full h-full object-cover max-h-[400px]"
        >
            <source src={src} />
            Your browser does not support the video tag.
        </video>
    );
}

export default function CommunityPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CommunityContent />
        </Suspense>
    );
}

function CommunityContent() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [commentContent, setCommentContent] = useState('');
    const [activeTab, setActiveTab] = useState('personalized');
    const [isGlobalUploading, setIsGlobalUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [attachments, setAttachments] = useState<{ type: 'image' | 'video' | 'audio', file: File | Blob, preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadType, setUploadType] = useState<'image' | 'video' | 'audio' | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const postInputRef = useRef<HTMLTextAreaElement>(null);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

    useEffect(() => {
        const isPost = searchParams.get('action') === 'post';
        setShowCreatePost(isPost);
        if (isPost) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                postInputRef.current?.focus();
            }, 100);
        }
    }, [searchParams]);

    // Mock Personalized Algorithm
    // Uses simple "Interaction Score" (replies + supports) and mock text analysis
    const getPersonalizedPosts = (allPosts: Post[]) => {
        // In a real app, this would use the user's logged 'interests' from bio/vitals
        const interests = ['ppd', 'anxiety', 'sleep', 'newborn'];
        
        return [...allPosts].sort((a, b) => {
            let scoreA = a.supportCount * 2 + a.commentCount * 5;
            let scoreB = b.supportCount * 2 + b.commentCount * 5;
            
            // Add weight if content matches interests
            interests.forEach(interest => {
                const contentA = (a.content || a.body || a.title || '').toLowerCase();
                const contentB = (b.content || b.body || b.title || '').toLowerCase();
                if (contentA.includes(interest)) scoreA += 50;
                if (contentB.includes(interest)) scoreB += 50;
            });
            
            return scoreB - scoreA; // Highest score first
        });
    };

    const displayPosts = (activeTab === 'personalized' 
        ? getPersonalizedPosts(posts) 
        : activeTab === 'my-posts' 
            ? posts.filter(p => p.userId === 'current_user_id') // Replace with actual user ID
            : posts).filter(p => !blockedUsers.includes(p.userId));

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            const res = await fetch('/core-api/community/posts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401 || res.status === 403) {
                localStorage.clear();
                router.push('/login');
                return;
            }
            if (!res.ok) {
                const text = await res.text();
                console.error('Fetch posts failed:', text);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role === 'partner') {
            router.push('/partner');
            return;
        }
        fetchPosts();
    }, []);

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && attachments.length === 0) return;
        
        // Always show the progress bar for feedback
        setIsGlobalUploading(true);
        setUploadProgress(10);
        
        setIsPosting(true);
        setShowCreatePost(false); // Hide container now that we have global feedback
        try {
            const processedAttachments = attachments.map(att => att.file);
            setUploadProgress(20);

            const token = localStorage.getItem('token');
            if (!token) {
                setIsGlobalUploading(false);
                setIsPosting(false);
                router.push('/login');
                return;
            }
            const formData = new FormData();
            formData.append('content', newPostContent);
            
            processedAttachments.forEach((file: Blob | File, i: number) => {
                const extension = (file as File).name?.split('.').pop() || 'bin';
                const fileName = (file as File).name || `upload_${i}.${extension}`;
                formData.append('files', file, fileName);
            });

            setUploadProgress(30);

            // Using XHR for real progress reporting
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/core-api/community/post');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 60) + 30; // Map to 30-90%
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.responseText);
                    if (data.success) {
                        setUploadProgress(100);
                        setTimeout(() => {
                            setNewPostContent('');
                            setAttachments([]);
                            setIsGlobalUploading(false);
                            fetchPosts();
                            router.push('/community');
                        }, 500);
                    }
                } else if (xhr.status === 401 || xhr.status === 403) {
                    console.error('Auth error during upload:', xhr.responseText);
                    setIsGlobalUploading(false);
                    setIsPosting(false);
                    localStorage.clear();
                    router.push('/login');
                    return;
                } else {
                    console.error('Upload failed:', xhr.responseText);
                    setIsGlobalUploading(false);
                }
                setIsPosting(false);
            };

            xhr.onerror = () => {
                console.error('XHR Error');
                setIsGlobalUploading(false);
                setIsPosting(false);
            };

            xhr.send(formData);

        } catch (error) {
            console.error('Error creating post:', error);
            setIsGlobalUploading(false);
            setIsPosting(false);
        }
    };

    const handleToggleSupport = async (postId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/support', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ postId })
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Toggle support failed:', text);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setPosts(prev => prev.map(p => {
                    if (p.postId === postId) {
                        return {
                            ...p,
                            supportedByMe: data.supported,
                            supportCount: data.supported ? p.supportCount + 1 : p.supportCount - 1
                        };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error('Error toggling support:', error);
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!commentContent.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/core-api/community/comment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ postId, content: commentContent })
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Add comment failed:', text);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setCommentContent('');
                setReplyingTo(null);
                fetchPosts(); // Refresh to get the new comment
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadType) return;

        const preview = URL.createObjectURL(file);
        setAttachments(prev => [...prev, { type: uploadType, file, preview }]);
        setUploadType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => {
            const newAttachments = [...prev];
            URL.revokeObjectURL(newAttachments[index].preview);
            newAttachments.splice(index, 1);
            return newAttachments;
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
        if (diffInHours < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                {!showCreatePost && (
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-4 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Users className="text-emerald-600" size={32} />
                            Motherhood Circle
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">A safe, anonymous space for support and connection.</p>
                    </div>
                </header>
                )}

                {/* Minimal Global Upload Progress Bar - Integrated Under Heading */}
                <AnimatePresence>
                    {isGlobalUploading && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-8 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-4"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Zap size={14} className="animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Sharing your story...</span>
                                    <span className="text-[10px] font-black text-emerald-600">{uploadProgress}%</span>
                                </div>
                                <div className="h-1 w-full bg-emerald-100/50 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-emerald-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Post Section - Hidden by default, appears under heading */}
                <AnimatePresence>
                    {showCreatePost && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative">
                                <button 
                                    onClick={() => router.push('/community')}
                                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600 font-bold shrink-0 shadow-inner">
                                        <Smile size={28} />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <textarea
                                            ref={postInputRef}
                                            autoFocus
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            placeholder="What's on your mind today, mama?"
                                            className="w-full bg-slate-50/50 border-none rounded-2xl p-6 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/10 resize-none h-40 transition-all outline-none text-lg"
                                        />
                                        
                                        {attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-3">
                                                {attachments.map((att, idx) => (
                                                    <div key={idx} className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 bg-white shadow-sm">
                                                        {att.type === 'image' && <img src={att.preview} className="w-full h-full object-cover" />}
                                                        {att.type === 'video' && <video src={att.preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />}
                                                        {att.type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600"><Mic size={24} /></div>}
                                                        <button 
                                                            onClick={() => removeAttachment(idx)}
                                                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => { setUploadType('image'); fileInputRef.current?.click(); }}
                                                    className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                                                >
                                                    <ImageIcon size={22} />
                                                </button>
                                                <button 
                                                    onClick={() => { setUploadType('video'); fileInputRef.current?.click(); }}
                                                    className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                                                >
                                                    <Film size={22} />
                                                </button>
                                                <button 
                                                    onClick={() => { setUploadType('audio'); fileInputRef.current?.click(); }}
                                                    className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                                                >
                                                    <Mic size={22} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Posting Privately
                                                </div>
                                                <button
                                                    onClick={handleCreatePost}
                                                    disabled={isPosting || (!newPostContent.trim() && attachments.length === 0)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-8 py-4 rounded-[1.5rem] flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-200"
                                                >
                                                    {isPosting ? 'Sharing...' : 'Share Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : uploadType === 'audio' ? 'audio/*' : '*'}
                />

                {/* Filters/Tabs with Algorithm Highlight */}
                {!showCreatePost && (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
                        {[
                            { id: 'trending', label: 'Trending', icon: TrendingUp },
                            { id: 'personalized', label: 'For You', icon: Zap }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-white text-emerald-600 shadow-md scale-105' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                )}

                {/* Minimal Global Upload Progress Bar */}
                <AnimatePresence>
                    {isGlobalUploading && (
                        <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
                            <motion.div 
                                className="h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${uploadProgress}%` }}
                                exit={{ opacity: 0 }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* Posts List */}
                {!showCreatePost && (
                <div className="bg-white md:rounded-[2.5rem] md:border border-slate-100 md:shadow-xl md:shadow-slate-200/20 overflow-hidden pb-8 md:pb-0 mb-32">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-6 md:p-8 animate-pulse border-b border-slate-50 last:border-0">
                                <div className="flex gap-4">
                                    {/* Left col */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full" />
                                        <div className="w-0.5 bg-slate-50 flex-1 min-h-[40px]" />
                                    </div>
                                    {/* Right col */}
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-4 bg-slate-100 rounded w-1/4" />
                                            <div className="h-4 bg-slate-100 rounded w-1/6" />
                                        </div>
                                        <div className="h-20 bg-slate-50 rounded-2xl mb-4" />
                                        <div className="flex gap-4">
                                            <div className="h-8 bg-slate-100 rounded-xl w-16" />
                                            <div className="h-8 bg-slate-100 rounded-xl w-16" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : displayPosts.length === 0 ? (
                        <div className="text-center py-24 px-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <MessageCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No stories shared yet</h3>
                            <p className="text-slate-500 mt-2">Be the first to share your journey with the community.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {displayPosts.map((post) => (
                                <motion.div
                                    key={post.postId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 md:p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors group relative"
                                >
                                    <div className="flex gap-4">
                                        {/* Left Column: Avatar & Line */}
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors z-10 shrink-0 border-2 border-white overflow-hidden shadow-sm">
                                                {post.avatarUrl ? (
                                                    <img src={post.avatarUrl} alt={post.pseudonym} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                            {/* Thread connecting line - hidden if last post, or maybe we just make it go slightly down */}
                                            {post.comments && post.comments.length > 0 ? (
                                                <div className="w-full bg-slate-200 mt-2 mb-1 flex-1 min-h-[20px] max-w-[2px]" />
                                            ) : null}
                                        </div>
                                        
                                        {/* Right Column: Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="font-bold text-slate-900 truncate">{post.pseudonym}</span>
                                                    <span className="text-[13px] font-medium text-slate-400 shrink-0 hidden sm:inline-block tracking-tight text-opacity-80">
                                                        {formatDate(post.createdAt)}
                                                    </span>
                                                </div>
                                                
                                                {/* More Options */}
                                                <div className="relative shrink-0 flex items-center gap-2">
                                                    <span className="text-[13px] font-medium text-slate-400 sm:hidden">
                                                        {formatDate(post.createdAt)}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(openDropdown === post.postId ? null : post.postId);
                                                        }}
                                                        className="text-slate-300 hover:text-slate-700 transition-colors -mr-2 p-2 rounded-full hover:bg-slate-100"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {openDropdown === post.postId && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                                                className="absolute right-0 top-10 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-1 overflow-hidden"
                                                            >
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm("Are you sure you want to report this post?")) {
                                                                            alert("Post reported successfully.");
                                                                        }
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-semibold transition-colors"
                                                                >
                                                                    <Flag size={16} /> Report
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm("Do you want to hide all posts from this user?")) {
                                                                            setBlockedUsers(prev => [...prev, post.userId]);
                                                                        }
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-semibold transition-colors"
                                                                >
                                                                    <Ban size={16} /> Block User
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="mb-3">
                                                <p className="text-[15px] leading-snug text-slate-800 break-words whitespace-pre-wrap">
                                                    {post.content || post.body}
                                                </p>
                                            </div>

                                            {/* Media */}
                                            {post.attachments && post.attachments.length > 0 && (
                                                <div className="mb-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 max-h-[500px] w-full max-w-lg">
                                                    {post.attachments.map((att) => (
                                                        <div key={att.attachmentId} className="w-full h-full relative group">
                                                            {att.fileType === 'image' && (
                                                                <img 
                                                                    src={`${att.fileUrl}`} 
                                                                    alt="Attached photo" 
                                                                    className="w-full h-auto max-h-[500px] object-cover"
                                                                />
                                                            )}
                                                            {att.fileType === 'video' && (
                                                                <FeedVideo src={`${att.fileUrl}`} />
                                                            )}
                                                            {att.fileType === 'audio' && (
                                                                <div className="p-4 flex gap-3 items-center">
                                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                                        <Mic size={20} />
                                                                    </div>
                                                                    <audio controls className="w-full max-w-[200px] h-8">
                                                                        <source src={`${att.fileUrl}`} />
                                                                    </audio>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Minimal Actions */}
                                            <div className="flex items-center gap-5 mt-3 pt-1 text-slate-500">
                                                <button 
                                                    onClick={() => handleToggleSupport(post.postId)}
                                                    className={`flex items-center gap-1.5 p-1.5 -ml-1.5 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors group/btn ${
                                                        post.supportedByMe ? 'text-rose-500' : ''
                                                    }`}
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        <Heart size={18} className={`transition-all ${post.supportedByMe ? 'fill-current scale-110' : 'group-hover/btn:scale-110'}`} />
                                                    </div>
                                                    {post.supportCount > 0 && <span className="text-[13px] font-semibold">{post.supportCount}</span>}
                                                </button>
                                                <button 
                                                    onClick={() => setReplyingTo(replyingTo === post.postId ? null : post.postId)}
                                                    className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors group/btn"
                                                >
                                                    <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                    {post.commentCount > 0 && <span className="text-[13px] font-semibold">{post.commentCount}</span>}
                                                </button>
                                                                                                
                                            </div>

                                        </div>
                                    </div>
                                    
                                    {/* Inline Replies */}
                                    <AnimatePresence>
                                        {(replyingTo === post.postId || post.comments?.length > 0) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 pl-4 md:pl-[3.5rem]">
                                                    {/* Existing Comments */}
                                                    <div className="space-y-4 pt-3 pb-3">
                                                        {post.comments?.map((comment) => (
                                                            <div key={comment.commentId} className="flex gap-3 items-start relative pb-2 group/comment">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0 z-10 border border-white">
                                                                    <User size={14} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="font-semibold text-slate-900 text-sm truncate">{comment.user.fullName}</span>
                                                                        <span className="text-[12px] text-slate-400 shrink-0">{formatDate(comment.createdAt)}</span>
                                                                    </div>
                                                                    <p className="text-slate-800 text-[14px] leading-snug break-words whitespace-pre-wrap">{comment.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Reply Input */}
                                                    {replyingTo === post.postId && (
                                                        <div className="flex gap-3 items-center py-2 relative">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 text-xs shrink-0 z-10">
                                                                <User size={14} />
                                                            </div>
                                                            <div className="flex-1 flex gap-2 w-full bg-slate-50/80 rounded-[1.5rem] px-4 py-2 hover:bg-slate-100/80 transition-colors focus-within:bg-slate-100 focus-within:ring-2 ring-emerald-500/20">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={commentContent}
                                                                    onChange={(e) => setCommentContent(e.target.value)}
                                                                    placeholder={`Reply to ${post.pseudonym}...`}
                                                                    className="flex-1 bg-transparent border-none p-0 text-[14px] focus:ring-0 outline-none placeholder:text-slate-400 text-slate-800"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleAddComment(post.postId);
                                                                    }}
                                                                />
                                                                <button 
                                                                    onClick={() => handleAddComment(post.postId)}
                                                                    disabled={!commentContent.trim()}
                                                                    className="text-emerald-600 hover:text-emerald-700 disabled:opacity-30 disabled:hover:text-emerald-600 transition-colors font-bold text-sm px-2"
                                                                >
                                                                    Post
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
                )}

            </div>
        </main>
    );
}
