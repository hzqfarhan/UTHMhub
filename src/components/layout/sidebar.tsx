'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Calculator,
    TrendingUp,
    Calendar,
    Link2,
    Settings,
    GraduationCap,
    Menu,
    X,
    ChevronsLeft,
    ChevronsRight,
    Timer,
    User,
    Clock,
    BookOpen,
    Trophy,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FacultyTheme } from '@/types';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/study', icon: BookOpen, label: 'Study Timer' },
    { href: '/calculator', icon: Calculator, label: 'GPA Calculator' },
    { href: '/predictor', icon: TrendingUp, label: 'Predictor' },
    { href: '/calendar', icon: Calendar, label: 'Takwim' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/quick-links', icon: Link2, label: 'Quick Links' },
    { href: '/profile', icon: User, label: 'Profile' },
];

const themes: { value: FacultyTheme; label: string; color: string }[] = [
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
];

function LiveClock({ collapsed }: { collapsed: boolean }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeStr = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    const dateStr = time.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    if (collapsed) {
        return (
            <div className="text-center py-3 px-1">
                <p className="text-[10px] text-white/50 font-mono">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
            </div>
        );
    }

    return (
        <div className="px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/30" />
                <div>
                    <p className="text-xs font-medium text-white/60">{timeStr}</p>
                    <p className="text-[10px] text-white/30">{dateStr}</p>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ onPomodoroToggle }: { onPomodoroToggle?: () => void }) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useLocalStorage('uthmhub-sidebar-collapsed', false);
    const [showThemes, setShowThemes] = useState(false);

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';
    const mainMargin = collapsed ? 'ml-[72px]' : 'ml-64';

    // Expose the margin to parent via CSS custom property
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--sidebar-width',
            collapsed ? '72px' : '256px'
        );
    }, [collapsed]);

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-50 md:hidden btn-secondary p-2 rounded-xl"
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-30 md:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full z-40
          glass-panel border-r border-white/5
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full md:translate-x-0'}
        `}
            >
                {/* Logo */}
                <div className={`border-b border-white/5 ${collapsed ? 'p-3' : 'p-5'}`}>
                    <Link
                        href="/"
                        className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'var(--accent-gradient)' }}
                        >
                            <GraduationCap size={22} className="text-white" />
                        </div>
                        {(!collapsed || mobileOpen) && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap">UTHMhub</h1>
                                <p className="text-[11px] text-white/40 tracking-wider uppercase whitespace-nowrap">Student Portal</p>
                            </motion.div>
                        )}
                    </Link>
                </div>

                {/* Live Clock */}
                <LiveClock collapsed={collapsed && !mobileOpen} />

                {/* Navigation */}
                <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? 'px-2 py-3' : 'p-4'}`}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                  relative flex items-center rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${collapsed && !mobileOpen ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                  ${isActive
                                        ? 'text-white'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    }
                `}
                                style={isActive ? { background: 'var(--accent-soft)', color: 'var(--accent-primary)' } : {}}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon size={18} className="shrink-0" />
                                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-indicator"
                                        className="absolute left-0 w-[3px] h-6 rounded-r-full"
                                        style={{ background: 'var(--accent-gradient)' }}
                                    />
                                )}
                            </Link>
                        );
                    })}

                    {/* Pomodoro Timer Button */}
                    <button
                        onClick={() => onPomodoroToggle?.()}
                        className={`
              w-full relative flex items-center rounded-xl text-sm font-medium
              transition-all duration-200 text-white/50 hover:text-white/80 hover:bg-white/5
              ${collapsed && !mobileOpen ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
            `}
                        title={collapsed ? 'Pomodoro Timer' : undefined}
                    >
                        <Timer size={18} className="shrink-0" />
                        {(!collapsed || mobileOpen) && <span>Pomodoro</span>}
                    </button>
                </nav>

                {/* Bottom Section */}
                <div className={`border-t border-white/5 ${collapsed ? 'p-2' : 'p-4'}`}>
                    {/* Theme Switcher */}
                    <button
                        onClick={() => setShowThemes(!showThemes)}
                        className={`
              flex items-center rounded-xl text-sm font-medium text-white/50 
              hover:text-white/80 hover:bg-white/5 transition-all w-full
              ${collapsed && !mobileOpen ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
            `}
                        title={collapsed ? 'Theme' : undefined}
                    >
                        <Settings size={18} className="shrink-0" />
                        {(!collapsed || mobileOpen) && (
                            <>
                                <span>Theme</span>
                                <div
                                    className="w-3 h-3 rounded-full ml-auto"
                                    style={{ background: themes.find((t) => t.value === theme)?.color }}
                                />
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {showThemes && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`flex gap-2 py-3 ${collapsed && !mobileOpen ? 'flex-col items-center px-1' : 'px-4'}`}>
                                    {themes.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => {
                                                setTheme(t.value);
                                                setShowThemes(false);
                                            }}
                                            className={`
                        w-7 h-7 rounded-full transition-all duration-200 shrink-0
                        ${theme === t.value ? 'ring-2 ring-white/30 scale-110' : 'hover:scale-105'}
                      `}
                                            style={{ background: t.color }}
                                            title={t.label}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapse Toggle (Desktop only) */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`
              hidden md:flex items-center rounded-xl text-sm font-medium text-white/30 
              hover:text-white/60 hover:bg-white/5 transition-all w-full mt-1
              ${collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
            `}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                        {!collapsed && <span className="text-xs">Collapse</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
