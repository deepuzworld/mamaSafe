'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Camera, Loader2, CheckCircle2, XCircle, ScanFace, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function FaceVerificationPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'scanning' | 'verified' | 'failed'>('ready');
    const [message, setMessage] = useState('Ready to verify your identity.');
    const [livenessScore, setLivenessScore] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectingRef = useRef<boolean>(false);
    const sessionIdRef = useRef<string>('');
    const challengeRef = useRef<string>('');
    const pendingRegistrationRef = useRef<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Pre-fetch registration data from session
        const regDataStr = sessionStorage.getItem('registrationData');
        if (regDataStr) {
            pendingRegistrationRef.current = JSON.parse(regDataStr);
        }
        return () => stopCamera();
    }, []);

    if (!mounted) return null;

    const stopCamera = () => {
        detectingRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startScan = async () => {
        setStatus('loading');
        setMessage('Initiating Secure AI Session...');
        
        try {
            // 1. Initialize session with backend
            const res = await fetch('/core-api/verification/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'temp_registration_session' }) // Proxy ID for pre-registration
            });
            const data = await res.json();
            
            if (!data.success) {
                throw new Error("Could not start secure session");
            }
            
            sessionIdRef.current = data.sessionId;
            challengeRef.current = data.challenge[0];
            
            const actionMap: Record<string, string> = {
                'smile': 'smile brightly',
                'surprised': 'show a surprised face',
                'neutral': 'hold a neutral expression',
                'blink': 'blink your eyes once'
            };
            const instruction = actionMap[data.challenge[0]] || data.challenge[0];
            setMessage(`Challenge: Please ${instruction} for the camera.`);
            
            // 2. Start Camera Capture
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play(); // will trigger onPlay -> handleVideoPlay
            }
            
            setStatus('scanning');
        } catch (error: any) {
            setStatus('failed');
            setMessage(error.message || 'Camera access denied or server error.');
        }
    };

    // Stream connection is now handled strictly by the stable callback ref below

    const handleVideoPlay = () => {
        if (!detectingRef.current) {
            detectingRef.current = true;
            captureAndSendFrame();
        }
    };

    const captureAndSendFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !detectingRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                
                const formData = new FormData();
                formData.append('frame', blob, 'frame.jpg');
                formData.append('sessionId', sessionIdRef.current);
                formData.append('expected_challenge', challengeRef.current);
                
                try {
                    const res = await fetch('/core-api/verification/frame', {
                        method: 'POST',
                        body: formData
                    });
                    if (!res.ok) {
                        const text = await res.text();
                        console.error('Server response error:', text);
                        setMessage(`Verification Error: ${res.status}`);
                        return;
                    }
                    const data = await res.json();
                    
                    if (data.success && data.data) {
                        const { faceDetected, isLive, isFemale, livenessScore: score, challengePassed, verified } = data.data;
                        
                        setLivenessScore(Math.round(score * 100)); // Show python confidence
                        
                        // Strict pipeline logic from python backend
                        const role = pendingRegistrationRef.current?.role || 'mother';
                        const genderPass = role !== 'mother' || isFemale === true;

                        if (verified && genderPass) {
                            detectingRef.current = false;
                            handleSuccess();
                            return;
                        } else if (faceDetected) {
                            if (role === 'mother' && isFemale === false) {
                                setMessage('Safe Space Protection: Only Women can access.');
                            } else if (!isLive) {
                                setMessage('Spoofing detected! Live face required.');
                            } else if (!challengePassed) {
                                setMessage(`Please ${challengeRef.current} to verify liveness.`);
                            }
                        } else {
                            setMessage('Align your face in the center.');
                        }
                    } else {
                        // Handle server errors or AI microservice unavailability
                        const errorMsg = data.message || 'AI Microservice Unreachable. Retrying...';
                        setMessage(errorMsg);
                        setLivenessScore(0);
                    }
                } catch (error) {
                    setMessage('Network Link Unstable. Reconnecting...');
                }
            }, 'image/jpeg', 0.8);
        }
        
        if (detectingRef.current) {
            setTimeout(captureAndSendFrame, 1000); // 1 FPS pipeline to not overload python server
        }
    };

    const handleSuccess = async () => {
        stopCamera();
        setStatus('verified');
        setMessage('Network Liveness Verified! Activating...');
        try {
            if (!pendingRegistrationRef.current) throw new Error('No registration data found');
            const reqData = pendingRegistrationRef.current;
            
            // Register their account now that they passed deep-learning ML checks
            const res = await fetch('/core-api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            const data = await res.json();
            
            if (data.success) {
                // Update their face verification status
                await fetch('/core-api/auth/face-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: data.userId, faceIoId: `hybrid-ml-${sessionIdRef.current}` })
                });
                setMessage('Account secured. Redirecting to Dashboard...');
                setTimeout(() => router.push('/dashboard'), 1500);
            } else { throw new Error(data.message); }
        } catch (error: any) {
            setStatus('failed');
            setMessage(error.message);
        }
    };

    const handleFailure = (msg: string) => {
        stopCamera();
        setStatus('failed');
        setMessage(msg);
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] -mr-64 -mt-64 opacity-50" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[460px] relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white p-12 text-center shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)]">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/10 text-emerald-600 mb-6 group relative">
                            <ShieldCheck size={32} className="relative z-10 group-hover:scale-110 transition-transform" />
                            {status === 'scanning' && (
                                <span className="absolute top-[-4px] right-[-4px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse" />
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">AI Verification</h2>
                        <p className="text-emerald-700 font-bold text-sm tracking-tight mt-2 px-1">Network-Validated Liveness Analysis</p>
                    </div>

                    <div className="relative mb-10">
                        <div className={cn(
                            "w-64 h-64 mx-auto bg-emerald-50 rounded-full border-4 relative overflow-hidden flex items-center justify-center transition-all duration-700 shadow-inner",
                            status === 'verified' ? "border-emerald-500 bg-emerald-100/50" : 
                            status === 'scanning' ? "border-blue-500 bg-blue-50" : 
                            status === 'failed' ? "border-rose-500 bg-rose-50" : "border-emerald-100"
                        )}>
                            <AnimatePresence mode="wait">
                                {status === 'scanning' ? (
                                    <>
                                        <motion.video
                                            key="video"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            ref={(node) => {
                                                if (node && streamRef.current && node.srcObject !== streamRef.current) {
                                                    videoRef.current = node;
                                                    node.srcObject = streamRef.current;
                                                    // Let autoPlay native attribute handle the load
                                                }
                                            }}
                                            autoPlay
                                            muted
                                            playsInline
                                            onPlay={handleVideoPlay}
                                            className="absolute inset-0 w-full h-full object-cover scale-[1.15]"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />
                                    </>
                                ) : (
                                    <motion.div 
                                        key="icon"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center gap-4"
                                    >
                                        {status === 'loading' ? <Loader2 size={64} className="text-emerald-300 animate-spin" /> : 
                                         status === 'verified' ? <CheckCircle2 size={84} className="text-emerald-500" /> :
                                         status === 'failed' ? <XCircle size={84} className="text-rose-500" /> :
                                         <ScanFace size={64} className="text-emerald-400" />}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {status === 'scanning' && (
                                <>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 z-20 shadow-[0_0_20px_#3b82f6] animate-[scan_2s_ease-in-out_infinite] opacity-60" />
                                    <div className="absolute inset-0 bg-blue-500/10 z-10 animate-pulse" />
                                    <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-40">
                                        <rect x="25%" y="20%" width="50%" height="60%" rx="20" ry="20" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
                                    </svg>
                                </>
                            )}
                        </div>

                        {status === 'scanning' && (
                            <div className="absolute -inset-4 rounded-full border border-blue-500/10 animate-pulse" />
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="min-h-[80px] flex flex-col justify-center gap-2">
                            <h3 className={cn(
                                "text-lg font-black tracking-tight transition-all duration-500",
                                status === 'failed' ? "text-rose-600" : 
                                status === 'scanning' ? "text-blue-700 text-xl" :
                                status === 'verified' ? "text-emerald-700" : "text-emerald-950"
                            )}>
                                {message}
                            </h3>
                            {status === 'scanning' && (
                                <p className="text-[11px] font-black text-blue-600/70 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Sparkles size={12} /> Live Anti-Spoofing: {livenessScore}%
                                </p>
                            )}
                            {status === 'loading' && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">Establishing Secure Network Link</p>}
                        </div>

                        {(status === 'ready' || status === 'idle' || status === 'failed') && (
                            <button 
                                onClick={startScan} 
                                className={cn(
                                    "w-full py-5 rounded-[2rem] font-black text-base shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3",
                                    status === 'failed' ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                                )}
                            >
                                <Camera size={20} /> {status === 'failed' ? 'Restart Remote Scan' : 'Connect to AI Engine'}
                            </button>
                        )}
                    </div>
                    <div className="mt-8 pt-8 border-t border-emerald-50">
                        <button 
                            onClick={async () => {
                                try {
                                    const res = await fetch('/core-api/health');
                                    const data = await res.json();
                                    alert(`Backend Online: ${data.status}`);
                                } catch (e: any) {
                                    alert(`Backend Offline: ${e.message}`);
                                }
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-emerald-500 transition-colors"
                        >
                            Diagnostic: Test Link
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
