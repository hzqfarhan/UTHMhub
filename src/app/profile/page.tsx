'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { User, Camera, Save, Check, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useTheme } from '@/hooks/use-theme';
import { FacultyTheme } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const MAX_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB

const themes: { value: FacultyTheme; label: string; color: string }[] = [
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
];

async function compressImage(file: File, maxWidth = 256, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas not supported');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// SVG icons for Google
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

export default function ProfilePage() {
    const [nickname, setNickname] = useLocalStorage('uthmhub-nickname', '');
    const [avatar, setAvatar] = useLocalStorage<string | null>('uthmhub-avatar', null);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [authMsg, setAuthMsg] = useState('');
    const { theme, setTheme } = useTheme();
    const fileRef = useRef<HTMLInputElement>(null);

    // Supabase Auth State
    const [user, setUser] = useState<any>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            setIsLoadingAuth(false);
            return;
        }

        // Fetch initial session
        supabase!.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            }
            setIsLoadingAuth(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
            }
            setIsLoadingAuth(false);
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchProfile(userId: string) {
        if (!supabase) return;
        const { data, error } = await supabase!.from('users').select('*').eq('id', userId).single();
        if (data) {
            if (data.name) setNickname(data.name);
            if (data.avatar_url) setAvatar(data.avatar_url);
            if (data.theme) setTheme(data.theme as FacultyTheme);
        } else if (error) {
            console.error('Error fetching profile:', error);
        }
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setErrorMsg('');
        if (file.size > MAX_FILE_SIZE) {
            setErrorMsg(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 2.5 MB.`);
            return;
        }
        if (!file.type.startsWith('image/')) {
            setErrorMsg('Please upload an image file.');
            return;
        }
        try {
            const compressed = await compressImage(file);
            setAvatar(compressed);
            setSavedMsg('Avatar updated!');
            setTimeout(() => setSavedMsg(''), 2000);
        } catch {
            setErrorMsg('Failed to process image.');
        }
    }

    async function handleSave() {
        if (user && supabase) {
            const { error } = await supabase!.from('users').update({
                name: nickname,
                avatar_url: avatar,
                theme: theme
            }).eq('id', user.id);

            if (error) {
                setErrorMsg('Failed to sync to cloud: ' + error.message);
                return;
            }
        }
        setSavedMsg('Profile saved!');
        setTimeout(() => setSavedMsg(''), 2000);
    }

    function handleOAuth(provider: string) {
        if (!isSupabaseConfigured || !supabase) {
            setAuthMsg(`${provider} sign-in requires Supabase credentials. Add them to .env.local.`);
            setTimeout(() => setAuthMsg(''), 5000);
            return;
        }

        supabase!.auth.signInWithOAuth({
            provider: provider.toLowerCase() as any,
            options: {
                redirectTo: window.location.origin + '/profile'
            }
        });
    }

    function handleSignOut() {
        if (supabase) {
            supabase!.auth.signOut();
        }
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="mb-8">
                <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Settings</p>
                <h1 className="text-3xl font-bold text-white">Profile</h1>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Card */}
                <motion.div variants={item} className="glass-card p-6">
                    <h2 className="text-sm font-semibold text-white/60 mb-6">Personal Information</h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-5 mb-6">
                        <div
                            className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group shrink-0"
                            onClick={() => fileRef.current?.click()}
                            style={{ background: avatar ? 'transparent' : 'var(--accent-soft)' }}
                        >
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={32} style={{ color: 'var(--accent-primary)' }} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-white/70 font-medium truncate">{nickname || 'Set your nickname'}</p>
                            <p className="text-xs text-white/30 mt-1">Click avatar to change photo</p>
                            <p className="text-[10px] text-white/20">Max 2.5 MB · Auto-compressed</p>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                            <AlertTriangle size={14} className="text-red-400 shrink-0" />
                            <p className="text-xs text-red-400">{errorMsg}</p>
                        </div>
                    )}

                    {/* Nickname */}
                    <div className="mb-6">
                        <label className="text-xs text-white/40 mb-2 block">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Your display name"
                            className="input-glass"
                            maxLength={30}
                        />
                    </div>

                    <button onClick={handleSave} className="btn-primary">
                        {savedMsg ? <Check size={16} /> : <Save size={16} />}
                        {savedMsg || 'Save Profile'}
                    </button>
                </motion.div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Sign In Options / Logged In State */}
                    <motion.div variants={item} className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <LogIn size={16} className="text-white/40" />
                            <h2 className="text-sm font-semibold text-white/60">Cloud Sync & Leaderboard</h2>
                        </div>

                        {isLoadingAuth ? (
                            <div className="animate-pulse h-12 bg-white/5 rounded-xl" />
                        ) : user ? (
                            <div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 mb-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                                        {user.user_metadata?.avatar_url || avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatar || user.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={20} className="text-white/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{user.email}</p>
                                        <p className="text-xs text-green-400">Connected & Syncing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all"
                                >
                                    <LogOut size={14} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-white/30 mb-5 leading-relaxed">
                                    Sign in to sync your data across devices, appear on leaderboards, and unlock cloud backup.
                                </p>

                                {authMsg && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                                        <p className="text-xs text-amber-400">{authMsg}</p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {/* Google Sign In */}
                                    <button
                                        onClick={() => handleOAuth('Google')}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all text-sm"
                                    >
                                        <GoogleIcon />
                                        <span className="text-white/80 font-medium">Continue with Google</span>
                                    </button>
                                </div>

                                <div className="mt-4 flex gap-2 items-center">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                                        Guest Mode Active
                                    </span>
                                    <span className="text-[10px] text-white/20">
                                        Data stays on this device
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Theme & Preferences */}
                    <motion.div variants={item} className="glass-card p-6">
                        <h2 className="text-sm font-semibold text-white/60 mb-5">Appearance</h2>

                        <div className="mb-6">
                            <label className="text-xs text-white/40 mb-3 block">Faculty Theme</label>
                            <div className="grid grid-cols-5 gap-3">
                                {themes.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTheme(t.value)}
                                        className={`
                                            flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-2
                                            ${theme === t.value ? 'bg-white/5' : 'border-transparent hover:bg-white/[0.03]'}
                                        `}
                                        style={theme === t.value ? { borderColor: t.color } : {}}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full ${theme === t.value ? 'scale-110' : ''}`}
                                            style={{ background: t.color }}
                                        />
                                        <span className="text-[10px] text-white/40">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notification Permission */}
                        <div>
                            <label className="text-xs text-white/40 mb-2 block">Notifications</label>
                            <button
                                onClick={() => {
                                    if ('Notification' in window) {
                                        Notification.requestPermission().then((perm) => {
                                            if (perm === 'granted') {
                                                new Notification('UTHMhub', { body: 'Notifications enabled! ✅', icon: '/icon-192.png' });
                                            }
                                        });
                                    }
                                }}
                                className="btn-secondary text-sm"
                            >
                                Enable Browser Notifications
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
