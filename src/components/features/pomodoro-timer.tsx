'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Coffee, Brain, Zap } from 'lucide-react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<TimerMode, { label: string; minutes: number; icon: typeof Brain; color: string }> = {
    work: { label: 'Focus', minutes: 25, icon: Brain, color: '#a855f7' },
    shortBreak: { label: 'Short Break', minutes: 5, icon: Coffee, color: '#22c55e' },
    longBreak: { label: 'Long Break', minutes: 15, icon: Zap, color: '#3b82f6' },
};

export default function PomodoroTimer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Create a beep sound using Web Audio API
    const playAlertSound = useCallback(() => {
        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gain.gain.value = 0.3;
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                ctx.close();
            }, 500);
        } catch {
            // fallback: do nothing
        }
    }, []);

    // Send browser notification
    const sendNotification = useCallback((title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon-192.png' });
        }
        playAlertSound();
    }, [playAlertSound]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Timer tick
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
            if (mode === 'work') {
                setSessions((prev) => prev + 1);
                sendNotification('🎉 Focus Session Complete!', 'Time for a break. Great work!');
            } else {
                sendNotification('⏰ Break Over!', 'Ready to get back to work?');
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft, mode, sendNotification]);

    function switchMode(newMode: TimerMode) {
        setMode(newMode);
        setTimeLeft(MODES[newMode].minutes * 60);
        setIsRunning(false);
    }

    function resetTimer() {
        setTimeLeft(MODES[mode].minutes * 60);
        setIsRunning(false);
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = 1 - timeLeft / (MODES[mode].minutes * 60);
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference * (1 - progress);
    const currentMode = MODES[mode];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Timer Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="glass-panel p-8 w-full max-w-sm pointer-events-auto relative">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <h2 className="text-lg font-semibold text-white text-center mb-6">Pomodoro Timer</h2>

                            {/* Mode Tabs */}
                            <div className="flex gap-1 mb-8 bg-white/[0.03] rounded-xl p-1">
                                {(Object.entries(MODES) as [TimerMode, typeof MODES.work][]).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => switchMode(key)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${mode === key ? 'text-white' : 'text-white/40 hover:text-white/60'
                                            }`}
                                        style={mode === key ? { background: `${val.color}20`, color: val.color } : {}}
                                    >
                                        <val.icon size={13} />
                                        {val.label}
                                    </button>
                                ))}
                            </div>

                            {/* Circular Timer */}
                            <div className="flex justify-center mb-8">
                                <div className="relative w-48 h-48">
                                    {/* Background circle */}
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r="90"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="6"
                                        />
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r="90"
                                            fill="none"
                                            stroke={currentMode.color}
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            className="transition-all duration-1000 ease-linear"
                                            style={{ filter: `drop-shadow(0 0 8px ${currentMode.color}40)` }}
                                        />
                                    </svg>

                                    {/* Time Display */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-white font-mono tracking-wider">
                                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                        </span>
                                        <span className="text-xs text-white/30 mt-1">{currentMode.label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <button
                                    onClick={resetTimer}
                                    className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-all"
                                    title="Reset"
                                >
                                    <RotateCcw size={18} />
                                </button>

                                <button
                                    onClick={() => setIsRunning(!isRunning)}
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${currentMode.color}, ${currentMode.color}cc)`,
                                        boxShadow: `0 4px 20px ${currentMode.color}40`,
                                    }}
                                >
                                    {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                                </button>

                                <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="text-xs font-medium text-white/40">{sessions}</span>
                                </div>
                            </div>

                            {/* Session count */}
                            <p className="text-center text-xs text-white/30">
                                {sessions} session{sessions !== 1 ? 's' : ''} completed today
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
