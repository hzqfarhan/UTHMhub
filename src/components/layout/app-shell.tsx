'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import PomodoroTimer from '@/components/features/pomodoro-timer';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [pomodoroOpen, setPomodoroOpen] = useState(false);

    return (
        <>
            <div className="flex min-h-screen relative z-10">
                <Sidebar onPomodoroToggle={() => setPomodoroOpen(true)} />
                <main
                    className="flex-1 min-h-screen transition-all duration-300"
                    style={{ marginLeft: 'var(--sidebar-width, 256px)' }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Pomodoro Timer Modal */}
            <PomodoroTimer
                isOpen={pomodoroOpen}
                onClose={() => setPomodoroOpen(false)}
            />

            {/* Mobile: reset sidebar margin */}
            <style jsx global>{`
        @media (max-width: 767px) {
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
        </>
    );
}
