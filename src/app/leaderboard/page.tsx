'use client';

import { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Trophy, Clock, Medal, Crown, ArrowLeft, Flame } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';

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

// Simulated community members (in a real app, this comes from Supabase)
const SIMULATED_USERS = [
    { name: 'Aiman', avatar: '🧑‍💻', todaySeconds: 14400, weekSeconds: 72000, streak: 12, isOnline: true },
    { name: 'Nurul', avatar: '👩‍🎓', todaySeconds: 12600, weekSeconds: 68000, streak: 8, isOnline: true },
    { name: 'Farhan', avatar: '👨‍💻', todaySeconds: 10800, weekSeconds: 54000, streak: 15, isOnline: false },
    { name: 'Aisyah', avatar: '👩‍🔬', todaySeconds: 9000, weekSeconds: 45000, streak: 5, isOnline: true },
    { name: 'Hafiz', avatar: '🧑‍🏫', todaySeconds: 7200, weekSeconds: 36000, streak: 3, isOnline: false },
    { name: 'Syafiqah', avatar: '👩‍💼', todaySeconds: 5400, weekSeconds: 27000, streak: 7, isOnline: true },
    { name: 'Danish', avatar: '🧑‍🎓', todaySeconds: 3600, weekSeconds: 18000, streak: 2, isOnline: false },
    { name: 'Liyana', avatar: '👩‍🏫', todaySeconds: 2700, weekSeconds: 13500, streak: 4, isOnline: false },
    { name: 'Zulkifli', avatar: '🧑‍🔧', todaySeconds: 1800, weekSeconds: 9000, streak: 1, isOnline: false },
    { name: 'Fatimah', avatar: '👩‍⚕️', todaySeconds: 900, weekSeconds: 4500, streak: 1, isOnline: false },
];

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

    const todayKey = new Date().toISOString().split('T')[0];
    const todayData = studyHistory.find((d) => d.date === todayKey);
    const myTodaySeconds = todayData?.totalSeconds || 0;
    const myWeekSeconds = studyHistory
        .filter((d) => {
            const diff = (new Date().getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        })
        .reduce((acc, d) => acc + d.totalSeconds, 0);

    // Calculate streak
    let myStreak = 0;
    const sorted = [...studyHistory].sort((a, b) => b.date.localeCompare(a.date));
    for (const d of sorted) {
        if (d.totalSeconds >= 60) myStreak++;
        else break;
    }

    // Merge user into leaderboard
    const allUsers = useMemo(() => {
        const me = {
            name: nickname || 'You',
            avatar: '⭐',
            todaySeconds: myTodaySeconds,
            weekSeconds: myWeekSeconds,
            streak: myStreak,
            isOnline: true,
            isMe: true,
        };

        const others = SIMULATED_USERS.map((u) => ({ ...u, isMe: false }));
        const combined = [...others, me];
        combined.sort((a, b) => b.todaySeconds - a.todaySeconds);
        return combined;
    }, [nickname, myTodaySeconds, myWeekSeconds, myStreak]);

    const myRank = allUsers.findIndex((u) => u.isMe) + 1;
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
                        {onlineCount} studying now · Updated in real-time
                    </p>
                </div>
                <Link
                    href="/study"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
                >
                    <ArrowLeft size={16} />
                    Study Timer
                </Link>
            </motion.div>

            {/* My Stats Banner */}
            <motion.div variants={item} className="glass-card p-5 mb-6"
                style={{ borderColor: 'var(--accent-primary)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '1rem' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: 'var(--accent-soft)' }}
                        >
                            ⭐
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{nickname || 'You'}</p>
                            <p className="text-xs text-white/30">Your ranking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>#{myRank}</p>
                            <p className="text-[10px] text-white/30">Rank</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">{formatTime(myTodaySeconds)}</p>
                            <p className="text-[10px] text-white/30">Today</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">{myStreak}</p>
                            <p className="text-[10px] text-white/30">Streak</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div variants={item}>
                <div className="space-y-2">
                    {allUsers.map((user, idx) => {
                        const rank = idx + 1;
                        return (
                            <motion.div
                                key={user.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`glass-card p-4 flex items-center gap-4 transition-all hover:scale-[1.01] ${user.isMe ? 'ring-1' : ''
                                    }`}
                                style={{
                                    boxShadow: getRankGlow(rank, 'var(--accent-primary)'),
                                    ...(user.isMe ? { borderColor: 'var(--accent-primary)', borderWidth: '1px' } : {}),
                                }}
                            >
                                {/* Rank */}
                                <div className="w-8 flex justify-center">
                                    {getRankIcon(rank)}
                                </div>

                                {/* Avatar */}
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${rank <= 3 ? 'bg-white/5' : 'bg-white/[0.02]'
                                        }`}>
                                        {user.avatar}
                                    </div>
                                    {user.isOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-medium truncate ${user.isMe ? '' : 'text-white/70'}`}
                                            style={user.isMe ? { color: 'var(--accent-primary)' } : {}}
                                        >
                                            {user.name} {user.isMe && '(You)'}
                                        </p>
                                        {user.isOnline && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">
                                                studying
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Flame size={10} className="text-orange-400/60" />
                                        <span className="text-[10px] text-white/25">{user.streak} day streak</span>
                                    </div>
                                </div>

                                {/* Study Time */}
                                <div className="text-right">
                                    <p className={`text-sm font-mono font-bold ${rank <= 3 ? 'text-white' : 'text-white/60'}`}>
                                        {formatTime(user.todaySeconds)}
                                    </p>
                                    <p className="text-[10px] text-white/20">today</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Info Note */}
            <motion.div variants={item} className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/25 text-center">
                    📊 Rankings refresh in real-time when connected. Currently showing simulated peers.
                    <br />
                    Connect Supabase to see live leaderboards with actual UTHM students.
                </p>
            </motion.div>
        </motion.div>
    );
}
