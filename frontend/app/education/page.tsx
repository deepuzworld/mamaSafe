'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, 
    Play, 
    BookOpen, 
    ChevronRight, 
    Sparkles, 
    ArrowLeft, 
    Video, 
    Users, 
    Info,
    Star,
    Quote,
    X,
    Phone,
    MapPin,
    AlertTriangle,
    Send,
    PlusCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const VIDEOS = [
    {
        id: '1',
        title: "Understanding Postpartum Depression",
        author: "Postpartum Support International",
        duration: "5:20",
        thumbnail: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ" // Example embed
    },
    {
        id: '2',
        title: "Partner's Guide to Support",
        author: "MamaSafe Education",
        duration: "8:45",
        thumbnail: "https://images.unsplash.com/photo-1544126592-807daa215a05?q=80&w=800&auto=format&fit=crop",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    }
];

const BLOGS = [
    {
        id: '1',
        title: "The Fourth Trimester: A Survival Guide",
        category: "Caregiving",
        excerpt: "Navigating the first three months of motherhood is a transformation unlike any other...",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
        type: "article",
        content: "Navigating the first three months of motherhood is a transformation unlike any other. The 'fourth trimester' is a crucial period where you and your baby are adjusting to life outside the womb. During this time, it is fully normal to feel exhausted, overwhelmed, and disconnected while you heal physically and emotionally. Key takeaways include prioritizing sleep whenever possible, leaning heavily on your support network, ignoring household chores, and seeking professional help if you experience signs of postpartum depression or anxiety..."
    },
    {
        id: '2',
        title: "Nutrition for Recovery",
        category: "Health",
        excerpt: "What you eat after delivery matters just as much as what you ate during pregnancy...",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
        type: "article",
        content: "What you eat after delivery matters just as much as what you ate during pregnancy. Recovery from childbirth is heavily dependent on essential nutrients. Focus on anti-inflammatory foods, staying extremely hydrated, and eating warm, easily digestible meals. High-quality proteins, healthy fats, and complex carbohydrates will rebuild your tissue and help balance hormone fluctuations. A well-nourished mother is better equipped to handle the physical demands of newborn care."
    }
];

const STORIES = [
    {
        name: "Sarah M.",
        story: "I didn't realize it was PPD until my partner used MamaSafe to flag my mood patterns. It saved our family.",
        location: "Sydney, AU"
    },
    {
        name: "Elena G.",
        story: "The education modules gave me the language to explain my anxiety to my doctor.",
        location: "London, UK"
    }
];

const getEmbedUrl = (url: string) => {
    if (!url) return '';
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (embedUrl.includes('youtube.com/embed/') && !embedUrl.includes('autoplay=')) {
        embedUrl += embedUrl.includes('?') ? '&autoplay=1' : '?autoplay=1';
    }
    return embedUrl;
};

const getThumbnail = (video: any, index: number) => {
    if (video.thumbnail) return video.thumbnail;
    const embedUrl = getEmbedUrl(video.url);
    if (embedUrl.includes('youtube.com/embed/')) {
        const videoId = embedUrl.split('embed/')[1]?.split('?')[0];
        if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    const fallbacks = [
        "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop"
    ];
    return fallbacks[index % fallbacks.length];
};

const getBlogImage = (blog: any, index: number) => {
    if (blog.image) return blog.image;
    if (blog.thumbnail) return blog.thumbnail;
    const fallbacks = [
        "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop"
    ];
    return fallbacks[index % fallbacks.length];
};

export default function EducationPage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeResource, setActiveResource] = useState<any>(null);
    const [showConsultantModal, setShowConsultantModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [dynamicResources, setDynamicResources] = useState<any[]>([]);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [storyForm, setStoryForm] = useState({ title: '', content: '' });
    const [storyFile, setStoryFile] = useState<File | null>(null);
    const [isSubmittingStory, setIsSubmittingStory] = useState(false);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await fetch('/core-api/education/resources');
                const data = await res.json();
                if (data.success) {
                    setDynamicResources(data.resources);
                }
            } catch (err) {
                console.error('Error fetching resources:', err);
            }
        };
        fetchResources();
    }, []);

    const allVideos = [...VIDEOS, ...dynamicResources.filter(r => r.type === 'video')];
    const allBlogs = [...BLOGS, ...dynamicResources.filter(r => r.type === 'article')];
    const allStories = [...STORIES, ...dynamicResources.filter(r => r.type === 'story').map(r => ({
        name: r.authorName || 'MamaSafe User',
        story: r.content,
        location: r.authorRole === 'expert' ? 'Expert Contributor' : 'Community Member'
    }))];

    const handleStorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingStory(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('title', storyForm.title || `${localStorage.getItem('userName')}'s Story`);
            data.append('content', storyForm.content);
            data.append('type', 'story');
            data.append('category', 'Sister Stories');
            if (storyFile) data.append('file', storyFile);

            const res = await fetch('/core-api/education/resources', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (res.ok) {
                alert('Your story has been submitted for review. Thank you for sharing!');
                setShowStoryModal(false);
                setStoryForm({ title: '', content: '' });
                setStoryFile(null);
            }
        } catch (err) {
            console.error('Error submitting story:', err);
        } finally {
            setIsSubmittingStory(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        // If there's no role, redirect.
        // Mothers, Partners, admins, and professionals should be able to view this.
        if (!role) {
            router.push('/login');
        }
    }, [router]);

    const StoriesSection = (
        <section className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/10 flex flex-col h-[600px]">
            <Quote className="absolute top-8 right-8 text-white/5" size={80} />
            <h3 className="text-2xl font-black mb-8 relative z-10 flex items-center gap-3 shrink-0">
                <Users className="text-emerald-400" /> Sister Stories
            </h3>
            <div className="space-y-8 relative z-10 overflow-y-auto pr-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allStories.map((story, i) => (
                    <div key={i} className="space-y-4">
                        <div className="flex gap-1 text-amber-400">
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                        </div>
                        <p className="text-slate-300 font-medium leading-relaxed italic">
                            "{story.story}"
                        </p>
                        <div>
                            <p className="font-black text-emerald-400 text-sm">
                                {story.name.startsWith('Dr.') ? story.name : (story.location === 'Expert Contributor' ? `Dr. ${story.name}` : story.name)}
                            </p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{story.location}</p>
                        </div>
                        {i < allStories.length - 1 && <div className="h-px bg-white/10 w-full" />}
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <main className="min-h-screen bg-[#FDFCFB] p-4 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                                Education <span className="text-emerald-600">Portal</span>
                            </h1>
                            <p className="text-lg text-slate-600 font-medium max-w-2xl">
                                Essential insights, safety protocols, and expert guidance to help you support your partner's postpartum recovery.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Videos', 'Articles', 'Stories'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                        activeCategory === cat 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                        : 'bg-white text-slate-500 border border-slate-100 hover:border-emerald-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Premium Featured Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Featured Video Section */}
                        {(activeCategory === 'All' || activeCategory === 'Videos') && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Video className="text-emerald-600" /> Awareness Videos
                                </h3>
                                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">View All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {allVideos.map((video, index) => (
                                    <motion.div 
                                        key={video.id || video.resourceId || index}
                                        whileHover={{ y: -5 }}
                                        onClick={() => setActiveResource({ type: 'video', url: getEmbedUrl(video.url), title: video.title })}
                                        className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40 group cursor-pointer"
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <img 
                                                src={getThumbnail(video, index)} 
                                                alt={video.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                onError={(e) => {
                                                    const fallbacks = [
                                                        "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop",
                                                        "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
                                                        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop"
                                                    ];
                                                    e.currentTarget.src = fallbacks[index % fallbacks.length];
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform">
                                                    <Play size={32} fill="currentColor" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">
                                                {video.duration || 'Video'}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{video.title}</h4>
                                            <p className="text-xs font-bold text-slate-500">
                                                {(video.author || video.authorName) ? (
                                                    (video.author || video.authorName).startsWith('Dr.') ? (video.author || video.authorName) : `Dr. ${video.author || video.authorName}`
                                                ) : 'MamaSafe Expert'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                        )}

                        {/* Articles/Blogs Section */}
                        {(activeCategory === 'All' || activeCategory === 'Articles') && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <BookOpen className="text-emerald-600" /> Essential Readings
                                </h3>
                                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Explore Blog</button>
                            </div>
                            <div className="space-y-6">
                                {allBlogs.map((blog, index) => (
                                    <motion.div 
                                        key={blog.id || blog.resourceId || index}
                                        whileHover={{ x: 10 }}
                                        onClick={() => setActiveResource({ ...blog, type: 'article', image: getBlogImage(blog, index), content: blog.content || blog.content })}
                                        className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-lg shadow-slate-100/50 flex flex-col md:flex-row gap-6 cursor-pointer group"
                                    >
                                        <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden shrink-0">
                                            <img 
                                                src={getBlogImage(blog, index)} 
                                                alt={blog.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                onError={(e) => {
                                                    const fallbacks = [
                                                        "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
                                                        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
                                                        "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop"
                                                    ];
                                                    e.currentTarget.src = fallbacks[index % fallbacks.length];
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">{blog.category}</span>
                                            <h4 className="text-xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{blog.title}</h4>
                                            <p className="text-slate-600 font-medium line-clamp-2 mb-4 leading-relaxed">{blog.excerpt || blog.content.substring(0, 150) + '...'}</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{blog.readTime || 'Article'}</span>
                                                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs group-hover:translate-x-2 transition-transform">
                                                    Read Article <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                        )}
                        
                        {activeCategory === 'Stories' && StoriesSection}
                    </div>

                    {/* Right Column: Experience Stories & Quick Info */}
                    <div className="space-y-8">
                        {activeCategory === 'All' && StoriesSection}

                        <section className="bg-emerald-50 rounded-[3rem] p-10 border border-emerald-100 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white text-emerald-600 flex items-center justify-center shadow-lg mb-6">
                                <Info size={32} />
                            </div>
                            <h4 className="font-black text-slate-900 text-lg mb-2">Need Immediate Support?</h4>
                            <p className="text-slate-600 font-medium text-sm mb-8 leading-relaxed">
                                Our crisis team is available 24/7. Don't navigate this alone.
                            </p>
                            <button 
                                onClick={() => setShowConsultantModal(true)}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                            >
                                Contact Crisis Line
                            </button>
                        </section>

                        <section 
                            onClick={() => setShowStoryModal(true)}
                            className="p-8 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center group hover:border-emerald-200 transition-colors cursor-pointer"
                        >
                            <PlusCircle className="text-slate-300 mb-4 group-hover:text-emerald-400 transition-colors" size={32} />
                            <p className="text-slate-500 font-black text-xs uppercase tracking-widest text-center">Contribute to <br />Sister Stories</p>
                        </section>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {activeResource && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-sm"
                        onClick={() => setActiveResource(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                <h3 className="font-black text-slate-900 tracking-tight">{activeResource.title || 'Resource Viewer'}</h3>
                                <button onClick={() => setActiveResource(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 w-full bg-slate-50 overflow-y-auto">
                                {activeResource.type === 'video' ? (
                                    <iframe src={activeResource.url} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen />
                                ) : (
                                    <div className="p-12 max-w-3xl mx-auto space-y-8">
                                        <img src={activeResource.image} alt="Cover" className="w-full h-80 object-cover rounded-3xl" />
                                        <div className="space-y-4">
                                            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{activeResource.category}</span>
                                            <h1 className="text-4xl font-black text-slate-900">{activeResource.title}</h1>
                                            <p className="text-sm font-bold text-slate-400">{activeResource.readTime}</p>
                                        </div>
                                        <div className="prose prose-lg text-slate-600 leading-relaxed font-medium">
                                            <p>{activeResource.content}</p>
                                            <p>Remember that it takes a village to raise a child, and an entire community to support a mother. Never hesitate to communicate your boundaries and needs.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConsultantModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
                        onClick={() => setShowConsultantModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative"
                        >
                            <div className="bg-rose-500 p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400 rounded-full blur-2xl -mr-16 -mt-16 opacity-50" />
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl relative z-10">
                                    <Phone className="text-rose-500" size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-white relative z-10">Crisis Line</h3>
                                <p className="text-rose-100 font-medium relative z-10">Immediate Assistance Available</p>
                            </div>
                            <div className="p-8 space-y-6 bg-slate-50">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                                            DR
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-lg">Dr. Anjali Desai</h4>
                                            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Women's Health & Psychiatry</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                            <Phone size={18} className="text-emerald-500" />
                                            <span className="font-bold tracking-wide">+91 98765 43210</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                            <MapPin size={18} className="text-emerald-500" />
                                            <span className="font-medium text-sm">2.5 km away • Apollo Cradle, Mumbai</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                                    >
                                        Call Now
                                    </button>
                                    <button 
                                        onClick={() => setShowConsultantModal(false)}
                                        className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                    <p className="text-[10px] text-slate-500 text-center font-bold mb-3 uppercase tracking-widest">Consultant didn't answer?</p>
                                    <button 
                                        className="w-full py-4 bg-amber-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                                    >
                                        <AlertTriangle size={18} /> Call 112 (Emergency)
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showStoryModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowStoryModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowStoryModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><PlusCircle size={28} className="text-[#10b981]" /> Sister Stories</h3>
                            <p className="text-sm font-bold text-slate-400 mb-8 -mt-6">Share your journey to inspire other mothers.</p>
                            <form onSubmit={handleStorySubmit} className="space-y-5">
                                <input type="text" required value={storyForm.title} onChange={e => setStoryForm({...storyForm, title: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 placeholder:font-medium placeholder-slate-400 focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Story Title (e.g. My Recovery Journey)" />
                                <textarea required value={storyForm.content} onChange={e => setStoryForm({...storyForm, content: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 min-h-[160px] placeholder-slate-400 resize-none focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Tell us your story..."></textarea>
                                <div className="p-4 rounded-2xl border border-dashed border-[#cbd5e1] text-center relative hover:bg-slate-50 transition-colors">
                                    <input type="file" accept="image/*" onChange={e => setStoryFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <span className="font-bold text-sm text-[#10b981]">{storyFile ? storyFile.name : 'Upload Photo (Optional)'}</span>
                                </div>
                                <button type="submit" disabled={isSubmittingStory} className="w-full py-4 bg-[#10b981] hover:bg-[#059669] transition-colors text-white rounded-2xl font-black mt-2 disabled:opacity-50">
                                    {isSubmittingStory ? 'Submitting...' : 'Submit Story for Review'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </main>
    );
}
