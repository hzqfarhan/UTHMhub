'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [msg, setMsg] = useState('Completing sign in...');

    useEffect(() => {
        if (!supabase) {
            router.push('/profile');
            return;
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                setMsg('Sign in successful! Redirecting...');
                router.push('/profile');
            }
        });

        // Fallback timeout in case hash parsing takes a bit too long or is missed
        const timer = setTimeout(() => {
            router.push('/profile');
        }, 3000);

        return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [router]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-white/50" size={32} />
            <p className="text-white/60 text-sm">{msg}</p>
        </div>
    );
}
