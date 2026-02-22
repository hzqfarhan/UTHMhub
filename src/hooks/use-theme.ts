'use client';

import { useLocalStorage } from './use-local-storage';
import { FacultyTheme } from '@/types';
import { useEffect } from 'react';

const THEME_KEY = 'uthmhub-theme';

export function useTheme() {
    const [theme, setTheme] = useLocalStorage<FacultyTheme>(THEME_KEY, 'purple');

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return { theme, setTheme };
}
