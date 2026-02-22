// ==========================================
// UTHMhub - GPA Calculation Utilities
// ==========================================

import { GradingEntry, Subject, Semester } from '@/types';

// UTHM Grading Scale - Percentage to Grade to Point Value
export const GRADING_SCALE: GradingEntry[] = [
    { minMark: 90, maxMark: 100, grade: 'A+', pointValue: 4.00 },
    { minMark: 85, maxMark: 89, grade: 'A', pointValue: 4.00 },
    { minMark: 80, maxMark: 84, grade: 'A-', pointValue: 3.67 },
    { minMark: 75, maxMark: 79, grade: 'B+', pointValue: 3.33 },
    { minMark: 70, maxMark: 74, grade: 'B', pointValue: 3.00 },
    { minMark: 65, maxMark: 69, grade: 'B-', pointValue: 2.67 },
    { minMark: 60, maxMark: 64, grade: 'C+', pointValue: 2.33 },
    { minMark: 55, maxMark: 59, grade: 'C', pointValue: 2.00 },
    { minMark: 50, maxMark: 54, grade: 'C-', pointValue: 1.67 },
    { minMark: 45, maxMark: 49, grade: 'D+', pointValue: 1.33 },
    { minMark: 40, maxMark: 44, grade: 'D', pointValue: 1.00 },
    { minMark: 35, maxMark: 39, grade: 'D-', pointValue: 0.67 },
    { minMark: 0, maxMark: 34, grade: 'F', pointValue: 0.00 },
];

/**
 * Get grade and point value from marks percentage
 */
export function getGradeFromMarks(marks: number): { grade: string; pointValue: number } {
    const rounded = Math.round(marks);
    const entry = GRADING_SCALE.find(
        (g) => rounded >= g.minMark && rounded <= g.maxMark
    );
    return entry
        ? { grade: entry.grade, pointValue: entry.pointValue }
        : { grade: 'F', pointValue: 0 };
}

/**
 * Get point value from letter grade
 */
export function getPointFromGrade(grade: string): number {
    const entry = GRADING_SCALE.find((g) => g.grade === grade);
    return entry ? entry.pointValue : 0;
}

/**
 * Calculate semester GPA
 * Formula: Sum(Credit Hour × Point Value) / Total Credit Hours
 */
export function calculateGPA(subjects: Subject[]): number {
    if (subjects.length === 0) return 0;

    const totalQualityPoints = subjects.reduce(
        (sum, s) => sum + s.creditHour * s.pointValue,
        0
    );
    const totalCredits = subjects.reduce((sum, s) => sum + s.creditHour, 0);

    if (totalCredits === 0) return 0;
    return Math.round((totalQualityPoints / totalCredits) * 100) / 100;
}

/**
 * Calculate cumulative CGPA across all semesters
 */
export function calculateCGPA(semesters: Semester[]): number {
    const allSubjects = semesters.flatMap((s) => s.subjects);
    return calculateGPA(allSubjects);
}

/**
 * Get total credit hours across all semesters
 */
export function getTotalCredits(semesters: Semester[]): number {
    return semesters.reduce(
        (sum, s) => sum + s.subjects.reduce((sSum, sub) => sSum + sub.creditHour, 0),
        0
    );
}

/**
 * Get all available grades from the grading scale
 */
export function getAvailableGrades(): string[] {
    return GRADING_SCALE.map((g) => g.grade);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
