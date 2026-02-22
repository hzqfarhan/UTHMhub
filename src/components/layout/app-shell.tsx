'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import PomodoroTimer from '@/components/features/pomodoro-timer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [pomodoroOpen, setPomodoroOpen] = useState(false);

    useEffect(() => {
        if (isSupabaseConfigured && supabase) {
            // Instantiate Supabase globally on mount to intercept OAuth hash fragments
            // in the URL if the user is redirected to the root or any other page.
            const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { });
            return () => subscription.unsubscribe();
        }
    }, []);

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
