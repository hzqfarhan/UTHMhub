'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Semester } from '@/types';
import { calculateGPA } from '@/lib/gpa-utils';

interface CGPAChartProps {
    semesters: Semester[];
}

export default function CGPAChart({ semesters }: CGPAChartProps) {
    if (semesters.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-white/30">Add semesters in the GPA Calculator to see your progress graph.</p>
            </div>
        );
    }

    // Build data points: cumulative CGPA at each semester
    let cumulativeSubjects: { creditHour: number; pointValue: number }[] = [];
    const data = semesters.map((sem, idx) => {
        cumulativeSubjects = [...cumulativeSubjects, ...sem.subjects];
        const totalQuality = cumulativeSubjects.reduce((s, sub) => s + sub.creditHour * sub.pointValue, 0);
        const totalCredits = cumulativeSubjects.reduce((s, sub) => s + sub.creditHour, 0);
        const cgpa = totalCredits > 0 ? Math.round((totalQuality / totalCredits) * 100) / 100 : 0;

        return {
            name: sem.name || `Sem ${idx + 1}`,
            gpa: calculateGPA(sem.subjects),
            cgpa,
        };
    });

    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 4]}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(15, 15, 25, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: 12,
                            color: '#e4e4e7',
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="cgpa"
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--accent-primary)', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        name="CGPA"
                    />
                    <Line
                        type="monotone"
                        dataKey="gpa"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={{ fill: 'rgba(255,255,255,0.3)', r: 3, strokeWidth: 0 }}
                        name="Semester GPA"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
