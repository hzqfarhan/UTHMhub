'use client';

import { motion } from 'framer-motion';
import {
    ExternalLink,
    GraduationCap,
    BookOpen,
    Globe,
    CreditCard,
    Library,
    FileText,
    Briefcase,
    Building2,
    Mail,
} from 'lucide-react';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const quickLinks = [
    {
        title: 'UTHM Portal',
        url: 'https://portal.uthm.edu.my',
        icon: Building2,
        description: 'Main university portal',
        category: 'Portal',
        color: '#3b82f6',
    },
    {
        title: 'e-Learning (UTHM)',
        url: 'https://elearning.uthm.edu.my',
        icon: BookOpen,
        description: 'Online learning platform',
        category: 'Academic',
        color: '#22c55e',
    },
    {
        title: 'AIMS',
        url: 'https://aims.uthm.edu.my',
        icon: GraduationCap,
        description: 'Academic Information Management System',
        category: 'Academic',
        color: '#a855f7',
    },
    {
        title: 'Library',
        url: 'https://lib.uthm.edu.my',
        icon: Library,
        description: 'UTHM Library resources',
        category: 'Resources',
        color: '#f59e0b',
    },
    {
        title: 'Student Portal',
        url: 'https://student.uthm.edu.my',
        icon: CreditCard,
        description: 'Student services and payments',
        category: 'Services',
        color: '#ef4444',
    },
    {
        title: 'UTHM Website',
        url: 'https://www.uthm.edu.my',
        icon: Globe,
        description: 'Official UTHM website',
        category: 'General',
        color: '#06b6d4',
    },
    {
        title: 'Career Center',
        url: 'https://career.uthm.edu.my',
        icon: Briefcase,
        description: 'Career opportunities and guidance',
        category: 'Services',
        color: '#f97316',
    },
    {
        title: 'Research Repository',
        url: 'https://eprints.uthm.edu.my',
        icon: FileText,
        description: 'Academic research and thesis',
        category: 'Resources',
        color: '#8b5cf6',
    },
    {
        title: 'Webmail',
        url: 'https://mail.uthm.edu.my',
        icon: Mail,
        description: 'UTHM email service',
        category: 'Communication',
        color: '#ec4899',
    },
];

export default function QuickLinksPage() {
    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} className="mb-8">
                <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Quick Access</p>
                <h1 className="text-3xl font-bold text-white">Quick Links</h1>
                <p className="text-sm text-white/40 mt-2">Quick access to UTHM portals and services.</p>
            </motion.div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link, idx) => (
                    <motion.a
                        key={idx}
                        variants={item}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card glow-card p-5 group cursor-pointer block"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${link.color}15` }}
                            >
                                <link.icon size={20} style={{ color: link.color }} />
                            </div>
                            <ExternalLink
                                size={14}
                                className="text-white/20 group-hover:text-white/50 transition-colors"
                            />
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-white transition-colors mb-1">
                            {link.title}
                        </h3>
                        <p className="text-xs text-white/30">{link.description}</p>
                        <div className="mt-3">
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: `${link.color}12`, color: link.color }}
                            >
                                {link.category}
                            </span>
                        </div>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
