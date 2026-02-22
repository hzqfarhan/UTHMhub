'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Edit3,
    Check,
    X,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Semester, Subject } from '@/types';
import {
    calculateGPA,
    calculateCGPA,
    getGradeFromMarks,
    getPointFromGrade,
    getAvailableGrades,
    generateId,
    GRADING_SCALE,
} from '@/lib/gpa-utils';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function CalculatorPage() {
    const [semesters, setSemesters] = useLocalStorage<Semester[]>('uthmhub-semesters', []);
    const [expandedSem, setExpandedSem] = useState<string | null>(null);
    const [showAddSubject, setShowAddSubject] = useState<string | null>(null);

    // New subject form
    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');
    const [newCredit, setNewCredit] = useState(3);
    const [newGradeMode, setNewGradeMode] = useState<'grade' | 'marks'>('grade');
    const [newGrade, setNewGrade] = useState('A');
    const [newMarks, setNewMarks] = useState(85);

    const [editingSemName, setEditingSemName] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const cgpa = calculateCGPA(semesters);
    const grades = getAvailableGrades();

    function addSemester() {
        const newSem: Semester = {
            id: generateId(),
            name: `Semester ${semesters.length + 1}`,
            subjects: [],
            gpa: 0,
        };
        setSemesters([...semesters, newSem]);
        setExpandedSem(newSem.id);
    }

    function removeSemester(id: string) {
        setSemesters(semesters.filter((s) => s.id !== id));
    }

    function renameSemester(id: string, name: string) {
        setSemesters(semesters.map((s) => (s.id === id ? { ...s, name } : s)));
        setEditingSemName(null);
    }

    function addSubject(semId: string) {
        let pointValue: number;
        let grade: string;

        if (newGradeMode === 'marks') {
            const result = getGradeFromMarks(newMarks);
            grade = result.grade;
            pointValue = result.pointValue;
        } else {
            grade = newGrade;
            pointValue = getPointFromGrade(newGrade);
        }

        const subject: Subject = {
            id: generateId(),
            code: newCode || 'SUB',
            name: newName || 'Subject',
            creditHour: newCredit,
            grade,
            marksPercentage: newGradeMode === 'marks' ? newMarks : undefined,
            pointValue,
        };

        setSemesters(
            semesters.map((s) => {
                if (s.id !== semId) return s;
                const newSubjects = [...s.subjects, subject];
                return { ...s, subjects: newSubjects, gpa: calculateGPA(newSubjects) };
            })
        );

        // Reset form
        setNewCode('');
        setNewName('');
        setNewCredit(3);
        setNewGrade('A');
        setNewMarks(85);
        setShowAddSubject(null);
    }

    function removeSubject(semId: string, subId: string) {
        setSemesters(
            semesters.map((s) => {
                if (s.id !== semId) return s;
                const newSubjects = s.subjects.filter((sub) => sub.id !== subId);
                return { ...s, subjects: newSubjects, gpa: calculateGPA(newSubjects) };
            })
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} className="mb-8">
                <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Calculator</p>
                <h1 className="text-3xl font-bold text-white">GPA Calculator</h1>
            </motion.div>

            {/* CGPA Summary */}
            <motion.div variants={item} className="glass-card p-6 mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm text-white/40 mb-1">Cumulative CGPA</p>
                    <p className="text-4xl font-bold gradient-text">{cgpa > 0 ? cgpa.toFixed(2) : '0.00'}</p>
                    <p className="text-xs text-white/30 mt-1">
                        {semesters.length} semester{semesters.length !== 1 ? 's' : ''} · {semesters.reduce((sum, s) => sum + s.subjects.length, 0)} subjects
                    </p>
                </div>
                <button onClick={addSemester} className="btn-primary">
                    <Plus size={16} />
                    Add Semester
                </button>
            </motion.div>

            {/* Semesters List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {semesters.map((sem) => (
                        <motion.div
                            key={sem.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card overflow-hidden"
                        >
                            {/* Semester Header */}
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                onClick={() => setExpandedSem(expandedSem === sem.id ? null : sem.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--accent-soft)' }}
                                    >
                                        <BookOpen size={14} style={{ color: 'var(--accent-primary)' }} />
                                    </div>
                                    <div>
                                        {editingSemName === sem.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="input-glass py-1 px-2 text-sm w-40"
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') renameSemester(sem.id, editName);
                                                        if (e.key === 'Escape') setEditingSemName(null);
                                                    }}
                                                />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); renameSemester(sem.id, editName); }}
                                                    className="text-green-400 hover:text-green-300"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingSemName(null); }}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-white">{sem.name}</h3>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSemName(sem.id);
                                                        setEditName(sem.name);
                                                    }}
                                                    className="text-white/20 hover:text-white/50"
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-xs text-white/30">
                                            {sem.subjects.length} subject{sem.subjects.length !== 1 ? 's' : ''}
                                            {' · '}GPA: {sem.gpa > 0 ? sem.gpa.toFixed(2) : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-white/70">{sem.gpa > 0 ? sem.gpa.toFixed(2) : '—'}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeSemester(sem.id); }}
                                        className="text-white/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    {expandedSem === sem.id ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedSem === sem.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 border-t border-white/5">
                                            {/* Subject Table */}
                                            {sem.subjects.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <div className="grid grid-cols-12 gap-2 text-xs text-white/30 px-3">
                                                        <span className="col-span-2">Code</span>
                                                        <span className="col-span-3">Name</span>
                                                        <span className="col-span-2 text-center">Credit</span>
                                                        <span className="col-span-2 text-center">Grade</span>
                                                        <span className="col-span-2 text-center">Points</span>
                                                        <span className="col-span-1" />
                                                    </div>
                                                    {sem.subjects.map((sub) => (
                                                        <div
                                                            key={sub.id}
                                                            className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm"
                                                        >
                                                            <span className="col-span-2 font-mono text-white/60">{sub.code}</span>
                                                            <span className="col-span-3 text-white/80 truncate">{sub.name}</span>
                                                            <span className="col-span-2 text-center text-white/60">{sub.creditHour}</span>
                                                            <span className="col-span-2 text-center">
                                                                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
                                                                    style={{
                                                                        background: sub.pointValue >= 3.67 ? 'rgba(34,197,94,0.15)' : sub.pointValue >= 2.0 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                                                                        color: sub.pointValue >= 3.67 ? '#22c55e' : sub.pointValue >= 2.0 ? '#3b82f6' : '#ef4444',
                                                                    }}
                                                                >
                                                                    {sub.grade}
                                                                </span>
                                                            </span>
                                                            <span className="col-span-2 text-center text-white/60">{sub.pointValue.toFixed(2)}</span>
                                                            <span className="col-span-1 text-right">
                                                                <button
                                                                    onClick={() => removeSubject(sem.id, sub.id)}
                                                                    className="text-white/15 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add Subject Form */}
                                            <AnimatePresence>
                                                {showAddSubject === sem.id ? (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                                            <div>
                                                                <label className="text-xs text-white/40 mb-1 block">Subject Code</label>
                                                                <input
                                                                    type="text"
                                                                    value={newCode}
                                                                    onChange={(e) => setNewCode(e.target.value)}
                                                                    placeholder="e.g. BIT20803"
                                                                    className="input-glass text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-white/40 mb-1 block">Subject Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={newName}
                                                                    onChange={(e) => setNewName(e.target.value)}
                                                                    placeholder="e.g. Software Engineering"
                                                                    className="input-glass text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-white/40 mb-1 block">Credit Hours</label>
                                                                <input
                                                                    type="number"
                                                                    value={newCredit}
                                                                    onChange={(e) => setNewCredit(Number(e.target.value))}
                                                                    min={1}
                                                                    max={6}
                                                                    className="input-glass text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-white/40 mb-1 block">Grade Input</label>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setNewGradeMode('grade')}
                                                                        className={`flex-1 text-xs py-2 rounded-lg transition-all ${newGradeMode === 'grade'
                                                                                ? 'text-white'
                                                                                : 'bg-white/5 text-white/40 hover:text-white/60'
                                                                            }`}
                                                                        style={newGradeMode === 'grade' ? { background: 'var(--accent-soft)', color: 'var(--accent-primary)' } : {}}
                                                                    >
                                                                        Letter
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setNewGradeMode('marks')}
                                                                        className={`flex-1 text-xs py-2 rounded-lg transition-all ${newGradeMode === 'marks'
                                                                                ? 'text-white'
                                                                                : 'bg-white/5 text-white/40 hover:text-white/60'
                                                                            }`}
                                                                        style={newGradeMode === 'marks' ? { background: 'var(--accent-soft)', color: 'var(--accent-primary)' } : {}}
                                                                    >
                                                                        Marks %
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Grade or Marks input */}
                                                        <div className="mb-4">
                                                            {newGradeMode === 'grade' ? (
                                                                <div>
                                                                    <label className="text-xs text-white/40 mb-1 block">Grade</label>
                                                                    <select
                                                                        value={newGrade}
                                                                        onChange={(e) => setNewGrade(e.target.value)}
                                                                        className="select-glass text-sm w-40"
                                                                    >
                                                                        {grades.map((g) => (
                                                                            <option key={g} value={g} style={{ background: '#1a1a2e' }}>
                                                                                {g} ({getPointFromGrade(g).toFixed(2)})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <label className="text-xs text-white/40 mb-1 block">
                                                                        Marks Percentage — Auto: {getGradeFromMarks(newMarks).grade} ({getGradeFromMarks(newMarks).pointValue.toFixed(2)})
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={newMarks}
                                                                        onChange={(e) => setNewMarks(Number(e.target.value))}
                                                                        min={0}
                                                                        max={100}
                                                                        className="input-glass text-sm w-40"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button onClick={() => addSubject(sem.id)} className="btn-primary text-sm">
                                                                <Plus size={14} /> Add Subject
                                                            </button>
                                                            <button onClick={() => setShowAddSubject(null)} className="btn-secondary text-sm">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.button
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        onClick={() => setShowAddSubject(sem.id)}
                                                        className="mt-4 w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={14} /> Add Subject
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {semesters.length === 0 && (
                <motion.div variants={item} className="text-center py-16">
                    <BookOpen size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="text-white/30 mb-4">No semesters yet. Start by adding your first semester.</p>
                    <button onClick={addSemester} className="btn-primary">
                        <Plus size={16} /> Add First Semester
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
