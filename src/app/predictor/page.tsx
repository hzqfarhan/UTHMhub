'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, BarChart3, FileText } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Semester } from '@/types';
import { calculateCGPA, getTotalCredits, getAvailableGrades, GRADING_SCALE } from '@/lib/gpa-utils';
import {
    calculateRequiredGPA,
    calculateMinGrades,
    calculateFinalExamScore,
} from '@/lib/predictor-utils';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type Tab = 'target-cgpa' | 'target-gpa' | 'final-exam';

export default function PredictorPage() {
    const [semesters] = useLocalStorage<Semester[]>('uthmhub-semesters', []);
    const [activeTab, setActiveTab] = useState<Tab>('target-cgpa');

    const currentCGPA = calculateCGPA(semesters);
    const totalCredits = getTotalCredits(semesters);

    // Tab A: Target CGPA
    const [targetCGPA, setTargetCGPA] = useState(3.50);
    const [nextSemCredits, setNextSemCredits] = useState(18);

    // Tab B: Target Semester GPA
    const [targetGPA, setTargetGPA] = useState(3.50);
    const [predSubjects, setPredSubjects] = useState([
        { code: 'SUB001', name: 'Subject 1', creditHour: 3 },
        { code: 'SUB002', name: 'Subject 2', creditHour: 3 },
        { code: 'SUB003', name: 'Subject 3', creditHour: 3 },
    ]);

    // Tab C: Final Exam
    const [carryMark, setCarryMark] = useState(65);
    const [carryWeight, setCarryWeight] = useState(60);
    const [targetGrade, setTargetGrade] = useState('A');

    const tabs = [
        { id: 'target-cgpa' as Tab, icon: Target, label: 'Target CGPA' },
        { id: 'target-gpa' as Tab, icon: BarChart3, label: 'Semester GPA' },
        { id: 'final-exam' as Tab, icon: FileText, label: 'Final Exam' },
    ];

    const cgpaResult = calculateRequiredGPA(currentCGPA, totalCredits, targetCGPA, nextSemCredits);
    const minGrades = calculateMinGrades(targetGPA, predSubjects);
    const finalResult = calculateFinalExamScore(carryMark, carryWeight, targetGrade);

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} className="mb-8">
                <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Predictor</p>
                <h1 className="text-3xl font-bold text-white">What-If Analysis</h1>
            </motion.div>

            {/* Current Status */}
            <motion.div variants={item} className="glass-card p-6 mb-6">
                <div className="flex items-center gap-6 flex-wrap">
                    <div>
                        <p className="text-xs text-white/30">Current CGPA</p>
                        <p className="text-2xl font-bold gradient-text">{currentCGPA > 0 ? currentCGPA.toFixed(2) : '—'}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                        <p className="text-xs text-white/30">Credits Completed</p>
                        <p className="text-2xl font-bold text-white">{totalCredits}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                        <p className="text-xs text-white/30">Semesters</p>
                        <p className="text-2xl font-bold text-white">{semesters.length}</p>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={item} className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'text-white'
                                : 'bg-white/5 text-white/40 hover:text-white/60'
                            }`}
                        style={activeTab === tab.id ? { background: 'var(--accent-soft)', color: 'var(--accent-primary)' } : {}}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Tab Content */}
            <motion.div variants={item}>
                {/* Tab A: Target CGPA */}
                {activeTab === 'target-cgpa' && (
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-white">Target CGPA Calculator</h2>
                        <p className="text-sm text-white/40">
                            Calculate the GPA you need next semester to reach your desired CGPA.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Target CGPA</label>
                                <input
                                    type="number"
                                    value={targetCGPA}
                                    onChange={(e) => setTargetCGPA(Number(e.target.value))}
                                    step={0.01}
                                    min={0}
                                    max={4}
                                    className="input-glass"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Next Semester Credits</label>
                                <input
                                    type="number"
                                    value={nextSemCredits}
                                    onChange={(e) => setNextSemCredits(Number(e.target.value))}
                                    min={1}
                                    max={30}
                                    className="input-glass"
                                />
                            </div>
                        </div>

                        {/* Result */}
                        <div
                            className={`p-5 rounded-xl border ${cgpaResult.achievable
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                }`}
                        >
                            {cgpaResult.achievable && cgpaResult.requiredGPA > 0 && (
                                <p className="text-3xl font-bold text-white mb-2">
                                    {cgpaResult.requiredGPA.toFixed(2)} <span className="text-sm font-normal text-white/40">GPA required</span>
                                </p>
                            )}
                            <p className={`text-sm ${cgpaResult.achievable ? 'text-green-400' : 'text-red-400'}`}>
                                {cgpaResult.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tab B: Target Semester GPA */}
                {activeTab === 'target-gpa' && (
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-white">Target Semester GPA</h2>
                        <p className="text-sm text-white/40">
                            See minimum grades needed per subject to reach your target GPA.
                        </p>

                        <div>
                            <label className="text-xs text-white/40 mb-1 block">Target GPA</label>
                            <input
                                type="number"
                                value={targetGPA}
                                onChange={(e) => setTargetGPA(Number(e.target.value))}
                                step={0.01}
                                min={0}
                                max={4}
                                className="input-glass w-40"
                            />
                        </div>

                        {/* Dynamic subject inputs */}
                        <div className="space-y-2">
                            <p className="text-xs text-white/30">Subjects</p>
                            {predSubjects.map((sub, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                        type="text"
                                        value={sub.code}
                                        onChange={(e) => {
                                            const updated = [...predSubjects];
                                            updated[idx] = { ...updated[idx], code: e.target.value };
                                            setPredSubjects(updated);
                                        }}
                                        placeholder="Code"
                                        className="input-glass text-sm col-span-3"
                                    />
                                    <input
                                        type="text"
                                        value={sub.name}
                                        onChange={(e) => {
                                            const updated = [...predSubjects];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setPredSubjects(updated);
                                        }}
                                        placeholder="Name"
                                        className="input-glass text-sm col-span-5"
                                    />
                                    <input
                                        type="number"
                                        value={sub.creditHour}
                                        onChange={(e) => {
                                            const updated = [...predSubjects];
                                            updated[idx] = { ...updated[idx], creditHour: Number(e.target.value) };
                                            setPredSubjects(updated);
                                        }}
                                        min={1}
                                        max={6}
                                        className="input-glass text-sm col-span-2"
                                    />
                                    <button
                                        onClick={() => setPredSubjects(predSubjects.filter((_, i) => i !== idx))}
                                        className="col-span-2 text-white/20 hover:text-red-400 text-xs text-center"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() =>
                                    setPredSubjects([...predSubjects, { code: '', name: '', creditHour: 3 }])
                                }
                                className="text-xs text-white/40 hover:text-white/60 underline"
                            >
                                + Add subject
                            </button>
                        </div>

                        {/* Results */}
                        <div className="space-y-2">
                            <p className="text-xs text-white/30 mb-2">Minimum Required Grades</p>
                            {minGrades.map((sub, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div>
                                        <p className="text-sm text-white/80">{sub.name || sub.code || `Subject ${idx + 1}`}</p>
                                        <p className="text-xs text-white/30">{sub.creditHour} credits</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                                        Min {sub.minGrade}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab C: Final Exam Calculator */}
                {activeTab === 'final-exam' && (
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-white">Final Exam Score Calculator</h2>
                        <p className="text-sm text-white/40">
                            Calculate the score you need on your final exam to get a specific grade.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Carry Mark (%)</label>
                                <input
                                    type="number"
                                    value={carryMark}
                                    onChange={(e) => setCarryMark(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                    className="input-glass"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Carry Weight (%)</label>
                                <input
                                    type="number"
                                    value={carryWeight}
                                    onChange={(e) => setCarryWeight(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                    className="input-glass"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Target Grade</label>
                                <select
                                    value={targetGrade}
                                    onChange={(e) => setTargetGrade(e.target.value)}
                                    className="select-glass"
                                >
                                    {getAvailableGrades().map((g) => (
                                        <option key={g} value={g} style={{ background: '#1a1a2e' }}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Result */}
                        <div
                            className={`p-5 rounded-xl border ${finalResult.achievable
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                }`}
                        >
                            {finalResult.achievable && finalResult.requiredScore > 0 && (
                                <p className="text-3xl font-bold text-white mb-2">
                                    {finalResult.requiredScore.toFixed(1)}% <span className="text-sm font-normal text-white/40">on final exam</span>
                                </p>
                            )}
                            <p className={`text-sm ${finalResult.achievable ? 'text-green-400' : 'text-red-400'}`}>
                                {finalResult.message}
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
