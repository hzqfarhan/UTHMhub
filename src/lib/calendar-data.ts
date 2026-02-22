// ==========================================
// UTHMhub - Academic Calendar Data
// UTHM Semester II 2025/2026 Session (18 Weeks)
// ==========================================

import { AcademicEvent } from '@/types';

export const SEMESTER_INFO = {
    session: '2025/2026',
    semester: 'Semester II',
    weeks: 18,
};

export const ACADEMIC_EVENTS: AcademicEvent[] = [
    // Course Registration
    {
        id: 'evt-001',
        title: 'Course Registration',
        startDate: '2026-03-12',
        endDate: '2026-03-13',
        category: 'registration',
        color: '#ef4444', // red
    },
    // Lecture Part 1 (W1-W7)
    {
        id: 'evt-002',
        title: 'Lecture Part 1 (W1-W7)',
        startDate: '2026-03-16',
        endDate: '2026-05-01',
        category: 'lecture',
        color: '#3b82f6', // blue
    },
    // Online Mode
    {
        id: 'evt-003',
        title: 'ONLINE MODE',
        startDate: '2026-03-16',
        endDate: '2026-03-29',
        category: 'online',
        color: '#a855f7', // purple
    },
    // Sultan of Johor's Birthday
    {
        id: 'evt-004',
        title: "Sultan of Johor's Birthday",
        startDate: '2026-03-23',
        endDate: '2026-03-23',
        category: 'holiday',
        color: '#22c55e', // green
    },
    // Eid al-Fitr
    {
        id: 'evt-005',
        title: 'Eid al-Fitr',
        startDate: '2026-03-30',
        endDate: '2026-03-31',
        category: 'holiday',
        color: '#22c55e',
    },
    // Labour Day
    {
        id: 'evt-006',
        title: 'Labour Day',
        startDate: '2026-05-01',
        endDate: '2026-05-01',
        category: 'holiday',
        color: '#22c55e',
    },
    // Break Week
    {
        id: 'evt-007',
        title: 'Break Week',
        startDate: '2026-05-02',
        endDate: '2026-05-08',
        category: 'break',
        color: '#f59e0b', // amber
    },
    // Lecture Part 2 (W8-W14)
    {
        id: 'evt-008',
        title: 'Lecture Part 2 (W8-W14)',
        startDate: '2026-05-09',
        endDate: '2026-06-19',
        category: 'lecture',
        color: '#3b82f6',
    },
    // Wesak Day
    {
        id: 'evt-009',
        title: 'Wesak Day',
        startDate: '2026-05-12',
        endDate: '2026-05-12',
        category: 'holiday',
        color: '#22c55e',
    },
    // Agong's Birthday
    {
        id: 'evt-010',
        title: "Agong's Birthday",
        startDate: '2026-06-01',
        endDate: '2026-06-01',
        category: 'holiday',
        color: '#22c55e',
    },
    // 1st Day of Muharram
    {
        id: 'evt-011',
        title: '1st Day of Muharram',
        startDate: '2026-06-17',
        endDate: '2026-06-17',
        category: 'holiday',
        color: '#22c55e',
    },
    // Revision Week (W15)
    {
        id: 'evt-012',
        title: 'Revision Week (W15)',
        startDate: '2026-06-20',
        endDate: '2026-06-26',
        category: 'revision',
        color: '#f97316', // orange
    },
    // Final Exams (W16-W18)
    {
        id: 'evt-013',
        title: 'Final Exams (W16-W18)',
        startDate: '2026-06-27',
        endDate: '2026-07-17',
        category: 'exam',
        color: '#eab308', // yellow
    },
];

/**
 * Get events for a specific month
 */
export function getEventsForMonth(year: number, month: number): AcademicEvent[] {
    return ACADEMIC_EVENTS.filter((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        return start <= monthEnd && end >= monthStart;
    });
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(dateStr: string): AcademicEvent[] {
    const date = new Date(dateStr);
    return ACADEMIC_EVENTS.filter((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return date >= start && date <= end;
    });
}

/**
 * Get upcoming events from a given date
 */
export function getUpcomingEvents(fromDate: Date, limit: number = 5): AcademicEvent[] {
    return ACADEMIC_EVENTS
        .filter((event) => new Date(event.startDate) >= fromDate)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, limit);
}

/**
 * Get days until an event
 */
export function getDaysUntil(eventDate: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(eventDate);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the category display color
 */
export function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        registration: '#ef4444',
        lecture: '#3b82f6',
        'study-week': '#f97316',
        exam: '#eab308',
        holiday: '#22c55e',
        online: '#a855f7',
        break: '#f59e0b',
        revision: '#f97316',
        other: '#6b7280',
    };
    return colors[category] || colors.other;
}
