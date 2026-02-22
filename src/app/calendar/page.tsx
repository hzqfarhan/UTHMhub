'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Star,
    Clock,
} from 'lucide-react';
import {
    SEMESTER_INFO,
    ACADEMIC_EVENTS,
    getEventsForMonth,
    getEventsForDate,
    getDaysUntil,
} from '@/lib/calendar-data';
import { AcademicEvent } from '@/types';
import UserEventsPanel from '@/components/features/user-events-panel';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
} from 'date-fns';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
    registration: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    lecture: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
    online: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7', border: 'rgba(168,85,247,0.25)' },
    holiday: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
    break: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    revision: { bg: 'rgba(249,115,22,0.12)', text: '#f97316', border: 'rgba(249,115,22,0.25)' },
    exam: { bg: 'rgba(234,179,8,0.12)', text: '#eab308', border: 'rgba(234,179,8,0.25)' },
    other: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280', border: 'rgba(107,114,128,0.25)' },
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const monthEvents = getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth());

    // Sort timeline events
    const sortedEvents = useMemo(() => {
        return [...ACADEMIC_EVENTS].sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
    }, []);

    function getEventsForDay(date: Date): AcademicEvent[] {
        const dateStr = format(date, 'yyyy-MM-dd');
        return getEventsForDate(dateStr);
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} className="mb-8">
                <p className="text-sm uppercase tracking-widest mb-1" style={{ color: 'var(--accent-primary)' }}>
                    {SEMESTER_INFO.session} SESSION
                </p>
                <h1 className="text-3xl font-bold text-white">{SEMESTER_INFO.semester}</h1>
                <p className="text-sm text-white/30">{SEMESTER_INFO.weeks} Weeks</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Grid */}
                <motion.div variants={item} className="lg:col-span-3">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <div />
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-lg font-semibold text-white min-w-[160px] text-center">
                                {format(currentDate, 'MMMM yyyy')}
                            </span>
                            <button
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <div />
                    </div>

                    {/* Calendar Grid */}
                    <div className="glass-card overflow-hidden">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 border-b border-white/5">
                            {DAYS.map((day) => (
                                <div key={day} className="p-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                const dayEvents = getEventsForDay(day);
                                const inMonth = isSameMonth(day, currentDate);
                                const today = isToday(day);

                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[100px] p-2 border-b border-r border-white/[0.03] transition-colors hover:bg-white/[0.02] ${!inMonth ? 'opacity-30' : ''}`}
                                    >
                                        <div
                                            className={`text-xs font-medium mb-1 ${today
                                                ? 'w-6 h-6 rounded-full flex items-center justify-center text-white'
                                                : 'text-white/50'
                                                }`}
                                            style={today ? { background: 'var(--accent-gradient)' } : {}}
                                        >
                                            {format(day, 'd')}
                                        </div>

                                        {/* Event pills */}
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 3).map((event) => {
                                                const style = categoryStyles[event.category] || categoryStyles.other;
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className="text-[10px] px-1.5 py-0.5 rounded truncate leading-tight"
                                                        style={{
                                                            background: style.bg,
                                                            color: style.text,
                                                            border: `1px solid ${style.border}`,
                                                        }}
                                                        title={event.title}
                                                    >
                                                        {event.title}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <p className="text-[9px] text-white/30">+{dayEvents.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Events Panel */}
                    <UserEventsPanel />
                </motion.div>

                {/* Timeline Panel */}
                <motion.div variants={item} className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Timeline</h2>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {sortedEvents.map((event) => {
                            const style = categoryStyles[event.category] || categoryStyles.other;
                            const daysUntil = getDaysUntil(event.startDate);

                            return (
                                <div
                                    key={event.id}
                                    className="glass-card p-4 hover:scale-[1.02] transition-transform cursor-default"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider">
                                            {format(new Date(event.startDate), 'MMM dd')}
                                            {event.startDate !== event.endDate
                                                ? ` — ${format(new Date(event.endDate), 'MMM dd, yyyy')}`
                                                : `, ${format(new Date(event.startDate), 'yyyy')}`}
                                        </p>
                                        <Star size={12} className="text-white/15 hover:text-white/40 cursor-pointer" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">{event.title}</h3>
                                    {daysUntil > 0 && (
                                        <span
                                            className="text-[10px] px-2 py-0.5 rounded-full"
                                            style={{ background: style.bg, color: style.text }}
                                        >
                                            in {daysUntil} days
                                        </span>
                                    )}
                                    {daysUntil === 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                                            Today
                                        </span>
                                    )}
                                    {daysUntil < 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                                            Passed
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
