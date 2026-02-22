'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Play, Pause, Square, Clock, Flame, Trophy, BookOpen } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface StudySession {
    id: string;
    startTime: string;
    endTime: string;
    duration: number; // seconds
    subject: string;
}

interface DailyStudyData {
    date: string; // YYYY-MM-DD
    totalSeconds: number;
    sessions: StudySession[];
}

const SUBJECTS = [
    { name: 'General', color: '#a855f7' },
    { name: 'Mathematics', color: '#3b82f6' },
    { name: 'Programming', color: '#22c55e' },
    { name: 'Physics', color: '#f59e0b' },
    { name: 'English', color: '#ef4444' },
    { name: 'Engineering', color: '#06b6d4' },
    { name: 'Islamic Studies', color: '#8b5cf6' },
    { name: 'Other', color: '#6b7280' },
];

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTimeShort(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

export default function StudyPage() {
    const [studyHistory, setStudyHistory] = useLocalStorage<DailyStudyData[]>('uthmhub-study-history', []);
    const [isStudying, setIsStudying] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const [sessionStart, setSessionStart] = useState<Date | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [nickname] = useLocalStorage('uthmhub-nickname', 'Student');
    const [user, setUser] = useState<any>(null);

    // Get auth status
    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) return;
        supabase!.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUser(session.user);
        });
        const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Get today's data
    const todayKey = getTodayKey();
    const todayData = studyHistory.find((d) => d.date === todayKey);
    const todayTotal = (todayData?.totalSeconds || 0) + (isStudying ? elapsed : 0);

    // Week total
    const weekTotal = studyHistory
        .filter((d) => {
            const diff = (new Date().getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        })
        .reduce((acc, d) => acc + d.totalSeconds, 0) + (isStudying ? elapsed : 0);

    // Timer tick
    useEffect(() => {
        if (isStudying) {
            intervalRef.current = setInterval(() => {
                setElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isStudying]);

    function startStudying() {
        setIsStudying(true);
        setElapsed(0);
        setSessionStart(new Date());
    }

    function pauseStudying() {
        setIsStudying(false);
    }

    function resumeStudying() {
        setIsStudying(true);
    }

    function stopStudying() {
        if (elapsed < 10) {
            // Don't save sessions less than 10 seconds
            setIsStudying(false);
            setElapsed(0);
            setSessionStart(null);
            return;
        }

        const session: StudySession = {
            id: Date.now().toString(),
            startTime: sessionStart?.toISOString() || new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: elapsed,
            subject: selectedSubject.name,
        };

        const today = getTodayKey();
        const existing = studyHistory.find((d) => d.date === today);

        if (existing) {
            setStudyHistory(
                studyHistory.map((d) =>
                    d.date === today
                        ? { ...d, totalSeconds: d.totalSeconds + elapsed, sessions: [...d.sessions, session] }
                        : d
                )
            );
        } else {
            setStudyHistory([
                ...studyHistory,
                { date: today, totalSeconds: elapsed, sessions: [session] },
            ]);
        }

        // Push to Supabase if logged in
        if (user && isSupabaseConfigured && supabase) {
            supabase!.from('study_sessions').insert({
                user_id: user.id,
                subject: selectedSubject.name,
                started_at: session.startTime,
                ended_at: session.endTime,
                duration_seconds: session.duration
            }).then(({ error }) => {
                if (error) console.error('Failed to save session to Supabase:', error);
            });
        }

        setIsStudying(false);
        setElapsed(0);
        setSessionStart(null);
    }

    // Progress ring for daily goal (target: 4 hours)
    const dailyGoalSeconds = 4 * 3600;
    const progress = Math.min(todayTotal / dailyGoalSeconds, 1);
    const circumference = 2 * Math.PI * 130;
    const strokeDashoffset = circumference * (1 - progress);

    // Streak calculation
    let streak = 0;
    const sortedHistory = [...studyHistory].sort((a, b) => b.date.localeCompare(a.date));
    for (const day of sortedHistory) {
        if (day.totalSeconds >= 60) {
            streak++;
        } else {
            break;
        }
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} className="mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm uppercase tracking-widest mb-1" style={{ color: 'var(--accent-primary)' }}>
                        Study Timer
                    </p>
                    <h1 className="text-3xl font-bold text-white">
                        {isStudying ? '📖 Studying...' : 'Ready to Study?'}
                    </h1>
                </div>
                <Link
                    href="/leaderboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
                >
                    <Trophy size={16} />
                    Leaderboard
                </Link>
            </motion.div>

            {/* Main Timer Area */}
            <motion.div variants={item} className="flex flex-col items-center mb-10">
                {/* Subject Selector */}
                {!isStudying && (
                    <div className="flex gap-2 mb-8 flex-wrap justify-center">
                        {SUBJECTS.map((subject) => (
                            <button
                                key={subject.name}
                                onClick={() => setSelectedSubject(subject)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedSubject.name === subject.name
                                    ? 'text-white scale-105'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                                style={
                                    selectedSubject.name === subject.name
                                        ? { background: `${subject.color}25`, color: subject.color, border: `1px solid ${subject.color}40` }
                                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }
                                }
                            >
                                {subject.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Timer Circle */}
                <div className="relative w-72 h-72 mb-8">
                    {/* Background ring */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                        <circle
                            cx="140" cy="140" r="130"
                            fill="none"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="140" cy="140" r="130"
                            fill="none"
                            stroke={selectedSubject.color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                            style={{ filter: `drop-shadow(0 0 12px ${selectedSubject.color}50)` }}
                        />
                    </svg>

                    {/* Timer Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isStudying && (
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className="w-3 h-3 rounded-full mb-3"
                                style={{ background: selectedSubject.color, boxShadow: `0 0 12px ${selectedSubject.color}` }}
                            />
                        )}
                        <span className="text-5xl font-bold text-white font-mono tracking-wider">
                            {formatTime(elapsed)}
                        </span>
                        <span className="text-sm text-white/30 mt-2">
                            {isStudying ? selectedSubject.name : 'Select subject & start'}
                        </span>
                        {todayTotal > 0 && (
                            <span className="text-xs text-white/20 mt-1">
                                Today: {formatTimeShort(todayTotal)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {!isStudying && elapsed === 0 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startStudying}
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all"
                            style={{
                                background: `linear-gradient(135deg, ${selectedSubject.color}, ${selectedSubject.color}cc)`,
                                boxShadow: `0 8px 32px ${selectedSubject.color}40`,
                            }}
                        >
                            <Play size={32} className="ml-1" />
                        </motion.button>
                    )}

                    {isStudying && (
                        <>
                            <button
                                onClick={pauseStudying}
                                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                            >
                                <Pause size={22} />
                            </button>
                            <button
                                onClick={stopStudying}
                                className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-all border border-red-500/20"
                            >
                                <Square size={22} />
                            </button>
                        </>
                    )}

                    {!isStudying && elapsed > 0 && (
                        <>
                            <button
                                onClick={resumeStudying}
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${selectedSubject.color}, ${selectedSubject.color}cc)`,
                                    boxShadow: `0 4px 20px ${selectedSubject.color}30`,
                                }}
                            >
                                <Play size={24} className="ml-0.5" />
                            </button>
                            <button
                                onClick={stopStudying}
                                className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-all border border-red-500/20"
                            >
                                <Square size={20} />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-4 text-center">
                    <Clock size={16} className="mx-auto mb-2 text-white/20" />
                    <p className="text-lg font-bold text-white">{formatTimeShort(todayTotal || 0)}</p>
                    <p className="text-[10px] text-white/30">Today</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <BookOpen size={16} className="mx-auto mb-2 text-white/20" />
                    <p className="text-lg font-bold text-white">{formatTimeShort(weekTotal || 0)}</p>
                    <p className="text-[10px] text-white/30">This Week</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <Flame size={16} className="mx-auto mb-2 text-white/20" />
                    <p className="text-lg font-bold text-white">{streak}</p>
                    <p className="text-[10px] text-white/30">Day Streak</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <Trophy size={16} className="mx-auto mb-2 text-white/20" />
                    <p className="text-lg font-bold text-white">{todayData?.sessions.length || 0}</p>
                    <p className="text-[10px] text-white/30">Sessions Today</p>
                </div>
            </motion.div>

            {/* Today's Sessions */}
            {todayData && todayData.sessions.length > 0 && (
                <motion.div variants={item}>
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Today&apos;s Sessions</h2>
                    <div className="space-y-2">
                        {[...todayData.sessions].reverse().map((session) => {
                            const subject = SUBJECTS.find((s) => s.name === session.subject) || SUBJECTS[0];
                            return (
                                <div key={session.id} className="glass-card p-3 flex items-center gap-3">
                                    <div
                                        className="w-2 h-8 rounded-full"
                                        style={{ background: subject.color }}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-white/70 font-medium">{session.subject}</p>
                                        <p className="text-xs text-white/30">
                                            {new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            {' — '}
                                            {new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <p className="text-sm font-mono text-white/50">{formatTimeShort(session.duration)}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Daily Goal Indicator */}
            <motion.div variants={item} className="mt-6">
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/40">Daily Goal: 4 hours</span>
                        <span className="text-xs font-mono" style={{ color: selectedSubject.color }}>
                            {Math.round(progress * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${selectedSubject.color}, ${selectedSubject.color}80)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
