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
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    const userRecord = session.user;
                    const { data } = await supabase!.from('users').select('name, avatar_url').eq('id', userRecord.id).single();

                    const meta = userRecord.user_metadata || (userRecord as any).raw_user_meta_data || {};
                    const oauthName = meta.name || meta.full_name;
                    const oauthAvatar = meta.avatar_url || meta.picture;

                    let updatedName = data?.name || '';
                    let updatedAvatar = data?.avatar_url || '';
                    let needsUpdate = false;

                    if (oauthName && updatedName !== oauthName) {
                        updatedName = oauthName;
                        needsUpdate = true;
                    }
                    if (oauthAvatar && updatedAvatar !== oauthAvatar) {
                        updatedAvatar = oauthAvatar;
                        needsUpdate = true;
                    }

                    // Sync to Local Storage instantly
                    if (updatedName && typeof window !== 'undefined') window.localStorage.setItem('uthmhub-nickname', JSON.stringify(updatedName));
                    if (updatedAvatar && typeof window !== 'undefined') window.localStorage.setItem('uthmhub-avatar', JSON.stringify(updatedAvatar));

                    // Sync to DB
                    if (needsUpdate) {
                        await supabase!.from('users').update({
                            name: updatedName,
                            avatar_url: updatedAvatar
                        }).eq('id', userRecord.id);
                    }
                }
            });
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
