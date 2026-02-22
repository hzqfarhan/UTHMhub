'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Bell, Trash2, CalendarPlus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { UserEvent } from '@/types';
import { generateId } from '@/lib/gpa-utils';

const categories = [
    { value: 'assignment', label: 'Assignment', color: '#ef4444' },
    { value: 'project', label: 'Project', color: '#3b82f6' },
    { value: 'quiz', label: 'Quiz', color: '#f59e0b' },
    { value: 'presentation', label: 'Presentation', color: '#a855f7' },
    { value: 'other', label: 'Other', color: '#6b7280' },
];

export default function UserEventsPanel() {
    const [events, setEvents] = useLocalStorage<UserEvent[]>('uthmhub-user-events', []);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<UserEvent['category']>('assignment');

    // Check for upcoming events and send notifications
    const checkReminders = useCallback(() => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const now = new Date();
        events.forEach((event) => {
            const eventDate = new Date(event.date);
            const diff = eventDate.getTime() - now.getTime();
            const hoursUntil = diff / (1000 * 60 * 60);

            // Notify if event is within 3 hours and in the future
            if (hoursUntil > 0 && hoursUntil <= 3) {
                const minutesUntil = Math.round(diff / (1000 * 60));
                // Only notify once per event by checking a flag in localStorage
                const notifiedKey = `notified-${event.id}`;
                if (!localStorage.getItem(notifiedKey)) {
                    new Notification(`📅 ${event.title}`, {
                        body: `Starting in ${minutesUntil} minutes`,
                        icon: '/icon-192.png',
                    });
                    localStorage.setItem(notifiedKey, 'true');
                }
            }
        });
    }, [events]);

    useEffect(() => {
        checkReminders();
        const interval = setInterval(checkReminders, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    }, [checkReminders]);

    function addEvent() {
        if (!title || !date) return;

        const newEvent: UserEvent = {
            id: generateId(),
            title,
            date: `${date}T${time}`,
            description,
            category,
        };

        setEvents([...events, newEvent]);
        setTitle('');
        setDate('');
        setTime('09:00');
        setDescription('');
        setCategory('assignment');
        setShowForm(false);
    }

    function removeEvent(id: string) {
        setEvents(events.filter((e) => e.id !== id));
        localStorage.removeItem(`notified-${id}`);
    }

    // Sort by date
    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const now = new Date();
    const upcoming = sortedEvents.filter((e) => new Date(e.date) >= now);
    const past = sortedEvents.filter((e) => new Date(e.date) < now);

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bell size={14} style={{ color: 'var(--accent-primary)' }} />
                    <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">My Events</h2>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary text-xs py-1.5 px-3"
                >
                    <Plus size={13} /> Add Event
                </button>
            </div>

            {/* Add Event Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="glass-card p-5 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Event Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Assignment 2 Due"
                                        className="input-glass text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as UserEvent['category'])}
                                        className="select-glass text-sm"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.value} value={c.value} style={{ background: '#1a1a2e' }}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="input-glass text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="input-glass text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Description (optional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add notes..."
                                    className="input-glass text-sm"
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={addEvent} className="btn-primary text-sm">
                                    <CalendarPlus size={14} /> Add Event
                                </button>
                                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
                <div className="space-y-2 mb-4">
                    {upcoming.map((event) => {
                        const cat = categories.find((c) => c.value === event.category);
                        const eventDate = new Date(event.date);
                        const diff = eventDate.getTime() - now.getTime();
                        const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));

                        return (
                            <motion.div
                                key={event.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 flex items-center gap-3"
                            >
                                <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: cat?.color || '#6b7280' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/80 font-medium truncate">{event.title}</p>
                                    <p className="text-xs text-white/30">
                                        {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        {' · '}
                                        {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        {daysUntil > 0 && (
                                            <span className="ml-2 text-white/20">in {daysUntil}d</span>
                                        )}
                                    </p>
                                    {event.description && (
                                        <p className="text-xs text-white/20 mt-0.5 truncate">{event.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeEvent(event.id)}
                                    className="text-white/15 hover:text-red-400 transition-colors shrink-0"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Past events (collapsed view) */}
            {past.length > 0 && (
                <p className="text-[10px] text-white/20">
                    {past.length} past event{past.length !== 1 ? 's' : ''}
                </p>
            )}

            {events.length === 0 && !showForm && (
                <div className="text-center py-8">
                    <Bell size={24} className="mx-auto mb-2 text-white/10" />
                    <p className="text-xs text-white/20">No personal events yet</p>
                </div>
            )}
        </div>
    );
}
