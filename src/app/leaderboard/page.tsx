'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Trophy, Clock, Medal, Crown, ArrowLeft, Flame, User } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface DailyStudyData {
    date: string;
    totalSeconds: number;
    sessions: { id: string; startTime: string; endTime: string; duration: number; subject: string }[];
}

// Removed SIMULATED_USERS to avoid showing placeholders

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function getRankIcon(rank: number) {
    if (rank === 1) return <Crown size={18} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={18} className="text-gray-300" />;
    if (rank === 3) return <Medal size={18} className="text-amber-600" />;
    return <span className="text-sm font-mono text-white/30 w-[18px] text-center">{rank}</span>;
}

function getRankGlow(rank: number, color: string): string {
    if (rank === 1) return '0 0 20px rgba(234,179,8,0.15)';
    if (rank === 2) return '0 0 15px rgba(156,163,175,0.1)';
    if (rank === 3) return '0 0 15px rgba(217,119,6,0.1)';
    return 'none';
}

export default function LeaderboardPage() {
    const [studyHistory] = useLocalStorage<DailyStudyData[]>('uthmhub-study-history', []);
    const [nickname] = useLocalStorage('uthmhub-nickname', 'You');
    const [avatar] = useLocalStorage<string | null>('uthmhub-avatar', null);

    const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) return;

        supabase!.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                supabase!.rpc('update_user_online', { p_user_id: session.user.id, p_online: true });
            }
        });

        const fetchLeaderboard = async () => {
            const { data } = await supabase!.from('leaderboard_today').select('*').order('today_seconds', { ascending: false });
            if (data) {
                setLiveLeaderboard(data);
                setIsConnected(true);
            }
        };

        fetchLeaderboard();

        const channel = supabase!.channel('leaderboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, fetchLeaderboard)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchLeaderboard)
            .subscribe();

        // Update online status periodically
        const interval = setInterval(() => {
            if (user) supabase!.rpc('update_user_online', { p_user_id: user.id, p_online: true });
        }, 60000);

        return () => {
            clearInterval(interval);
            if (user) supabase!.rpc('update_user_online', { p_user_id: user.id, p_online: false });
            supabase!.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const todayKey = new Date().toISOString().split('T')[0];
    const todayData = studyHistory.find((d) => d.date === todayKey);
    const myTodaySeconds = todayData?.totalSeconds || 0;

    let myStreak = 0;
    const sorted = [...studyHistory].sort((a, b) => b.date.localeCompare(a.date));
    for (const d of sorted) {
        if (d.totalSeconds >= 60) myStreak++;
        else break;
    }

    // Merge users
    const allUsers = useMemo(() => {
        if (isConnected && liveLeaderboard.length > 0) {
            return liveLeaderboard.map((u) => ({
                id: u.user_id,
                name: u.nickname || 'Student',
                avatar: u.avatar_url || '🧑‍💻',
                todaySeconds: Number(u.today_seconds),
                streak: 0, // Would require a separate RPC call to get_study_streak for all, skipping for performance
                isOnline: Boolean(u.is_online),
                isMe: user?.id === u.user_id,
                isImage: String(u.avatar_url).startsWith('http') || String(u.avatar_url).startsWith('data:'),
            }));
        }

        // Fallback for guest mode
        const me = {
            id: 'me',
            name: nickname || 'You',
            avatar: avatar || '⭐',
            todaySeconds: myTodaySeconds,
            streak: myStreak,
            isOnline: true,
            isMe: true,
            isImage: Boolean(avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))),
        };

        const combined = [me];
        combined.sort((a, b) => b.todaySeconds - a.todaySeconds);
        return combined;
    }, [isConnected, liveLeaderboard, user?.id, nickname, avatar, myTodaySeconds, myStreak]);

    const myRank = allUsers.findIndex((u) => u.isMe) + 1;
    const myData = allUsers.find(u => u.isMe) || { name: 'You', todaySeconds: 0, streak: 0, isImage: false, avatar: '' };
    const onlineCount = allUsers.filter((u) => u.isOnline).length;

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} className="mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm uppercase tracking-widest mb-1" style={{ color: 'var(--accent-primary)' }}>
                        Competition
                    </p>
                    <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                    <p className="text-sm text-white/30 mt-1">
                        {onlineCount} studying now {isConnected ? '· Live Database' : '· Guest Mode'}
                    </p>
                </div>
                <Link
                    href="/study"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
                >
                    <ArrowLeft size={16} />
                    Timer
                </Link>
            </motion.div>

            {/* My Stats Banner */}
            <motion.div variants={item} className="glass-card p-5 mb-6"
                style={{ borderColor: 'var(--accent-primary)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '1rem' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-2xl relative shrink-0"
                            style={{ background: 'var(--accent-soft)' }}
                        >
                            {myData.isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={myData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                myData.avatar || '⭐'
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{myData.name}</p>
                            <p className="text-xs text-white/30 truncate">Your ranking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 ml-4">
                        <div className="text-center">
                            <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>#{myRank || '-'}</p>
                            <p className="text-[10px] text-white/30">Rank</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">{formatTime(myData.todaySeconds)}</p>
                            <p className="text-[10px] text-white/30">Today</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div variants={item}>
                {allUsers.length === 0 ? (
                    <div className="text-center py-12 text-white/30 text-sm">No study sessions recorded today yet. Be the first!</div>
                ) : (
                    <div className="space-y-2">
                        {allUsers.map((u, idx) => {
                            const rank = idx + 1;
                            return (
                                <motion.div
                                    key={u.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={`glass-card p-4 flex items-center gap-4 transition-all hover:scale-[1.01] ${u.isMe ? 'ring-1' : ''}`}
                                    style={{
                                        boxShadow: getRankGlow(rank, 'var(--accent-primary)'),
                                        ...(u.isMe ? { borderColor: 'var(--accent-primary)', borderWidth: '1px' } : {}),
                                    }}
                                >
                                    {/* Rank */}
                                    <div className="w-8 flex justify-center shrink-0">
                                        {getRankIcon(rank)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-xl ${rank <= 3 ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                                            {u.isImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                u.avatar || <User size={20} className="text-white/40" />
                                            )}
                                        </div>
                                        {u.isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium truncate ${u.isMe ? '' : 'text-white/70'}`}
                                                style={u.isMe ? { color: 'var(--accent-primary)' } : {}}
                                            >
                                                {u.name} {u.isMe && '(You)'}
                                            </p>
                                            {u.isOnline && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 shrink-0">
                                                    studying
                                                </span>
                                            )}
                                        </div>
                                        {u.streak > 0 && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Flame size={10} className="text-orange-400/80" />
                                                <span className="text-[10px] text-white/30">{u.streak}d</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Study Time */}
                                    <div className="text-right shrink-0 ml-4">
                                        <p className={`text-sm font-mono font-bold ${rank <= 3 ? 'text-white' : 'text-white/60'}`}>
                                            {formatTime(u.todaySeconds)}
                                        </p>
                                        <p className="text-[10px] text-white/20">today</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Info Note */}
            {!isConnected && (
                <motion.div variants={item} className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs text-white/25 text-center">
                        📊 Showing local Guest Mode data.<br />
                        Sign in via Profile to see live leaderboards with actual UTHM students.
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
