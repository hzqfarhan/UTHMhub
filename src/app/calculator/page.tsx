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
    UploadCloud,
    Loader2,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Semester, Subject } from '@/types';
import Tesseract from 'tesseract.js';
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

    // Inline edit subject
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [eCode, setECode] = useState('');
    const [eName, setEName] = useState('');
    const [eCredit, setECredit] = useState(3);

    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);

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

    function saveEditSubject(semId: string, subId: string) {
        setSemesters(
            semesters.map((s) => {
                if (s.id !== semId) return s;
                const newSubjects = s.subjects.map((sub) => {
                    if (sub.id !== subId) return sub;
                    return { ...sub, code: eCode || 'SUB', name: eName || 'Unknown', creditHour: eCredit };
                });
                return { ...s, subjects: newSubjects, gpa: calculateGPA(newSubjects) };
            })
        );
        setEditingSubId(null);
    }

    async function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOcrLoading(true);
        setOcrProgress(0);

        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.floor(m.progress * 100));
                    }
                }
            });

            const text = result.data.text;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const parsedSubjects: Subject[] = [];

            let currentSubject: Partial<Subject> | null = null;
            let unknownCount = 1;

            // Updated grade regex: avoids \b because \b breaks on '+' and '-' characters
            const gradeRegex = /(^|\s)(A\+|A|A-|B\+|B|B-|C\+|C|C-|D\+|D|D-|F)(?=\s|$)/i;

            for (const line of lines) {
                // Ignore headers
                if (line.match(/GRADE|STATUS|ASSESSMENT|SYSTEM|LETTER/i)) continue;

                const codeMatch = line.match(/([a-zA-Z]{3,4}\d{4,5})/);
                const gradeMatch = line.match(gradeRegex);

                if (codeMatch) {
                    if (currentSubject) {
                        if (!currentSubject.grade) {
                            currentSubject.grade = 'A';
                            currentSubject.pointValue = getPointFromGrade('A');
                        }
                        parsedSubjects.push(currentSubject as Subject);
                    }

                    const code = codeMatch[1].toUpperCase();
                    const afterCode = line.substring(codeMatch.index! + code.length).trim();
                    const nameMatch = afterCode.match(/^([a-zA-Z\s&\-,\(\)]+)/);
                    let name = nameMatch ? nameMatch[1].trim() : 'Unknown Subject';

                    name = name.replace(/DT NORMAL|DT|NORMAL|PC|NA/ig, '').trim();

                    // Credit is usually 1-6. Since "Section" is 1, and "Credit" is 2-4, 
                    // we pull digits and try to assume the second digit is the credit.
                    const numbers = afterCode.match(/(^|\s)([1-6])(?=\s)/g);
                    let credit = 3;
                    if (numbers) {
                        const cleanNums = numbers.map(n => parseInt(n.trim()));
                        // if we see multiple standalone numbers (like 1 and 3), the second is usually credit
                        if (cleanNums.length > 1) {
                            credit = cleanNums[1];
                        } else {
                            credit = cleanNums[0];
                        }
                    }

                    const grade = gradeMatch ? gradeMatch[2].toUpperCase() : null;

                    currentSubject = {
                        id: generateId(),
                        code,
                        name: name || 'Unknown',
                        creditHour: credit,
                        grade: grade || '',
                        pointValue: grade ? getPointFromGrade(grade) : 0,
                    };
                } else if (currentSubject) {
                    // Try to catch straggling grades on the next few lines
                    if (!currentSubject.grade && gradeMatch) {
                        currentSubject.grade = gradeMatch[2].toUpperCase();
                        currentSubject.pointValue = getPointFromGrade(currentSubject.grade);
                    }
                    // Try to catch credit if it dropped below standalone
                    if (currentSubject.creditHour === 3) {
                        const numbers = line.match(/(^|\s)([1-6])(?=\s)/g);
                        if (numbers) {
                            const cleanNums = numbers.map(n => parseInt(n.trim()));
                            currentSubject.creditHour = cleanNums.length > 1 ? cleanNums[1] : cleanNums[0];
                        }
                    }
                } else if (gradeMatch && line.match(/PASS|FAIL|PC|NA/i)) {
                    // Stray grade line
                    const grade = gradeMatch[2].toUpperCase();
                    parsedSubjects.push({
                        id: generateId(),
                        code: `???${unknownCount++}`,
                        name: 'Tap edit icon \u2192',
                        creditHour: 3,
                        grade,
                        pointValue: getPointFromGrade(grade),
                    });
                }
            }

            if (currentSubject) {
                if (!currentSubject.grade) {
                    currentSubject.grade = 'A';
                    currentSubject.pointValue = getPointFromGrade('A');
                }
                parsedSubjects.push(currentSubject as Subject);
            }

            if (parsedSubjects.length > 0) {
                const newSem: Semester = {
                    id: generateId(),
                    name: `Extracted Semester ${semesters.length + 1}`,
                    subjects: parsedSubjects,
                    gpa: calculateGPA(parsedSubjects),
                };
                setSemesters([...semesters, newSem]);
                setExpandedSem(newSem.id);
            } else {
                alert("Could not detect any valid subjects from the image. Please try a clearer screenshot.");
            }
        } catch (error) {
            console.error('OCR Error:', error);
            alert("An error occurred while reading the image.");
        } finally {
            setIsOcrLoading(false);
            setOcrProgress(0);
            e.target.value = ''; // Reset input
        }
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
                <div className="flex flex-col gap-2">
                    <button onClick={addSemester} className="btn-primary text-sm whitespace-nowrap">
                        <Plus size={16} />
                        Add Semester
                    </button>
                    <label className="btn-secondary text-sm cursor-pointer whitespace-nowrap overflow-hidden relative">
                        {isOcrLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Scanning... {ocrProgress}%</>
                        ) : (
                            <><UploadCloud size={16} /> Scan SMAP</>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleScreenshotUpload}
                            disabled={isOcrLoading}
                        />
                    </label>
                </div>
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
                                                    <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-white/30 px-3">
                                                        <span className="col-span-2">Code</span>
                                                        <span className="col-span-3">Name</span>
                                                        <span className="col-span-2 text-center">Credit</span>
                                                        <span className="col-span-2 text-center">Grade</span>
                                                        <span className="col-span-2 text-center">Points</span>
                                                        <span className="col-span-1" />
                                                    </div>
                                                    {sem.subjects.map((sub) => (
                                                        <div key={sub.id}>
                                                            {editingSubId === sub.id ? (
                                                                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl bg-white/[0.05] border border-[var(--accent-primary)] text-sm mb-2">
                                                                    <input className="col-span-1 sm:col-span-2 input-glass px-2 py-1 text-xs" value={eCode} onChange={e => setECode(e.target.value)} placeholder="Code" autoFocus />
                                                                    <input className="col-span-1 sm:col-span-3 input-glass px-2 py-1 text-xs" value={eName} onChange={e => setEName(e.target.value)} placeholder="Name" />

                                                                    <div className="col-span-2 sm:col-span-7 flex items-center justify-between sm:grid sm:grid-cols-7 gap-2">
                                                                        <input type="number" min={1} max={6} className="sm:col-span-2 input-glass px-2 py-1 text-xs w-16 sm:w-full text-center" value={eCredit} onChange={e => setECredit(Number(e.target.value))} />
                                                                        <span className="sm:col-span-2 text-center text-white/50 bg-black/20 rounded py-1 px-2">{sub.grade}</span>
                                                                        <span className="sm:col-span-2 text-center text-white/50 hidden sm:block">{sub.pointValue.toFixed(2)}</span>
                                                                        <div className="sm:col-span-1 flex justify-end gap-2">
                                                                            <button onClick={() => saveEditSubject(sem.id, sub.id)} className="text-green-400 hover:text-green-300">
                                                                                <Check size={16} />
                                                                            </button>
                                                                            <button onClick={() => setEditingSubId(null)} className="text-red-400 hover:text-red-300">
                                                                                <X size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm mb-2">
                                                                    <div className="flex justify-between items-start sm:col-span-5 sm:grid sm:grid-cols-5 gap-2 mb-2 sm:mb-0">
                                                                        <span className={`sm:col-span-2 font-mono ${sub.code.startsWith('???') ? 'text-yellow-400/80 animate-pulse' : 'text-white/60'}`}>{sub.code}</span>
                                                                        <span className={`sm:col-span-3 truncate ${sub.name.startsWith('Tap edit') ? 'text-white/40 italic' : 'text-white/80'}`}>{sub.name}</span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between sm:col-span-7 sm:grid sm:grid-cols-7 gap-2">
                                                                        <span className="sm:col-span-2 text-white/60 text-xs sm:text-sm sm:text-center shrink-0">Cr: {sub.creditHour}</span>

                                                                        <div className="sm:col-span-2 sm:text-center shrink-0">
                                                                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
                                                                                style={{
                                                                                    background: sub.pointValue >= 3.67 ? 'rgba(34,197,94,0.15)' : sub.pointValue >= 2.0 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                                                                                    color: sub.pointValue >= 3.67 ? '#22c55e' : sub.pointValue >= 2.0 ? '#3b82f6' : '#ef4444',
                                                                                }}
                                                                            >
                                                                                {sub.grade}
                                                                            </span>
                                                                        </div>

                                                                        <span className="sm:col-span-2 text-white/60 text-xs sm:text-sm sm:text-center hidden sm:block whitespace-nowrap">{sub.pointValue.toFixed(2)} pts</span>

                                                                        <div className="sm:col-span-1 flex justify-end gap-3 shrink-0">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingSubId(sub.id);
                                                                                    setECode(sub.code.startsWith('???') ? '' : sub.code);
                                                                                    setEName(sub.name.startsWith('Tap edit') ? '' : sub.name);
                                                                                    setECredit(sub.creditHour);
                                                                                }}
                                                                                className="text-white/20 hover:text-white/60 transition-colors"
                                                                            >
                                                                                <Edit3 size={15} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => removeSubject(sem.id, sub.id)}
                                                                                className="text-white/15 hover:text-red-400 transition-colors"
                                                                            >
                                                                                <Trash2 size={15} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
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
