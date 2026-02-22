'use client';

import { motion, Variants } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Semester, StudyStreak } from '@/types';
import { calculateCGPA } from '@/lib/gpa-utils';
import { ACADEMIC_EVENTS, getDaysUntil } from '@/lib/calendar-data';
import CGPAChart from '@/components/features/cgpa-chart';

const motivationalMessages = [
  "The expert in anything was once a beginner. 🌟",
  "Small progress is still progress. Keep going! 💪",
  "Your future self will thank you for studying today. 📚",
  "Success is the sum of small efforts repeated daily. ✨",
  "Believe in yourself — you're doing great! 🎯",
  "Every hour you study brings you closer to your dream. 🚀",
  "Consistency beats intensity. Stay steady! 🎓",
  "The only limit to our realization of tomorrow is our doubts of today. 💡",
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const [nickname] = useLocalStorage('uthmhub-nickname', '');
  const [semesters] = useLocalStorage<Semester[]>('uthmhub-semesters', []);
  const [streak] = useLocalStorage<StudyStreak>('uthmhub-streak', {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
  });

  const cgpa = calculateCGPA(semesters);
  const now = new Date();

  // Find next upcoming event
  const upcomingEvents = ACADEMIC_EVENTS
    .filter((e) => new Date(e.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const nextEvent = upcomingEvents[0];
  const daysUntilNext = nextEvent ? getDaysUntil(nextEvent.startDate) : 0;

  // Random motivational message (based on day)
  const dayIndex = now.getDate() % motivationalMessages.length;
  const message = motivationalMessages[dayIndex];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Dashboard</p>
        <h1 className="text-3xl font-bold text-white">
          Welcome back <span className="gradient-text">{nickname || 'Student'}</span>
        </h1>
      </motion.div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* CGPA Card */}
        <motion.div variants={item} className="glass-card glow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/40">Current CGPA</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <GraduationCap size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <motion.p
            className="text-4xl font-bold gradient-text"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
          >
            {cgpa > 0 ? cgpa.toFixed(2) : '—'}
          </motion.p>
          <p className="text-xs text-white/30 mt-2">
            {semesters.length > 0 ? `${semesters.length} semester${semesters.length > 1 ? 's' : ''} recorded` : 'No data yet'}
          </p>
        </motion.div>

        {/* Next Event Countdown */}
        <motion.div variants={item} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/40">Next Event</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar size={16} className="text-blue-400" />
            </div>
          </div>
          {nextEvent ? (
            <>
              <p className="text-2xl font-bold text-white">
                {daysUntilNext} <span className="text-sm font-normal text-white/40">days</span>
              </p>
              <p className="text-xs text-white/50 mt-2 line-clamp-1">{nextEvent.title}</p>
            </>
          ) : (
            <p className="text-lg text-white/30">No upcoming events</p>
          )}
        </motion.div>

        {/* Study Streak */}
        <motion.div variants={item} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/40">Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame size={16} className="text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {streak.currentStreak} <span className="text-sm font-normal text-white/40">days</span>
          </p>
          <p className="text-xs text-white/30 mt-2">
            Best: {streak.longestStreak} days
          </p>
        </motion.div>

        {/* Semesters Count */}
        <motion.div variants={item} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/40">Total Credits</span>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {semesters.reduce((sum, s) => sum + s.subjects.reduce((ss, sub) => ss + sub.creditHour, 0), 0)}
          </p>
          <p className="text-xs text-white/30 mt-2">credit hours completed</p>
        </motion.div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* CGPA Progress Chart */}
        <motion.div variants={item} className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-sm font-semibold text-white/70">CGPA Progress</h2>
          </div>
          <CGPAChart semesters={semesters} />
        </motion.div>

        {/* Upcoming Timeline */}
        <motion.div variants={item} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-sm font-semibold text-white/70">Upcoming Events</h2>
          </div>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 4).map((event) => {
              const days = getDaysUntil(event.startDate);
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{event.title}</p>
                    <p className="text-xs text-white/30">
                      {days > 0 ? `in ${days} days` : 'Today'}
                    </p>
                  </div>
                </div>
              );
            })}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">No upcoming events</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Motivational Message */}
      <motion.div
        variants={item}
        className="glass-card p-6 text-center"
      >
        <Sparkles size={20} className="mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
        <p className="text-lg text-white/70 italic">{message}</p>
      </motion.div>
    </motion.div>
  );
}
