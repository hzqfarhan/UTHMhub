// ==========================================
// UTHMhub - GPA Predictor Utilities
// ==========================================

import { GRADING_SCALE, getPointFromGrade } from './gpa-utils';

/**
 * Calculate required GPA for next semester to achieve target CGPA
 *
 * Formula:
 * requiredGPA = (targetCGPA × (completedCredits + nextCredits) - (currentCGPA × completedCredits)) / nextCredits
 */
export function calculateRequiredGPA(
    currentCGPA: number,
    completedCredits: number,
    targetCGPA: number,
    nextSemesterCredits: number
): { requiredGPA: number; achievable: boolean; message: string } {
    if (nextSemesterCredits === 0) {
        return { requiredGPA: 0, achievable: false, message: 'No credits for next semester.' };
    }

    const totalCredits = completedCredits + nextSemesterCredits;
    const requiredGPA =
        (targetCGPA * totalCredits - currentCGPA * completedCredits) / nextSemesterCredits;

    const rounded = Math.round(requiredGPA * 100) / 100;

    if (rounded > 4.0) {
        return {
            requiredGPA: rounded,
            achievable: false,
            message: `You would need a GPA of ${rounded}, which is above 4.00. This target is not achievable in one semester.`,
        };
    }

    if (rounded < 0) {
        return {
            requiredGPA: 0,
            achievable: true,
            message: `You've already exceeded this target! Any GPA will maintain your CGPA above ${targetCGPA}.`,
        };
    }

    return {
        requiredGPA: rounded,
        achievable: true,
        message: `You need at least ${rounded.toFixed(2)} GPA next semester to achieve a ${targetCGPA.toFixed(2)} CGPA.`,
    };
}

/**
 * Calculate minimum grades per subject to reach target semester GPA
 */
export function calculateMinGrades(
    targetGPA: number,
    subjects: { code: string; name: string; creditHour: number }[]
): { code: string; name: string; creditHour: number; minGrade: string; minPoint: number }[] {
    // Find the minimum point value needed
    const totalCredits = subjects.reduce((sum, s) => sum + s.creditHour, 0);
    const totalPointsNeeded = targetGPA * totalCredits;

    // Distribute evenly first, then adjust
    const avgPointNeeded = totalPointsNeeded / totalCredits;

    return subjects.map((s) => {
        // Find the minimum grade that achieves at least the avg point
        const matchingGrade = [...GRADING_SCALE]
            .reverse()
            .find((g) => g.pointValue >= avgPointNeeded);

        return {
            ...s,
            minGrade: matchingGrade?.grade ?? 'A+',
            minPoint: matchingGrade?.pointValue ?? 4.0,
        };
    });
}

/**
 * Calculate final exam score required to achieve target grade
 *
 * Formula:
 * totalMark = carryMark × (carryWeight/100) + finalExam × ((100 - carryWeight)/100)
 * Solve for finalExam:
 * finalExam = (targetMinMark - carryMark × (carryWeight/100)) / ((100 - carryWeight)/100)
 */
export function calculateFinalExamScore(
    carryMark: number,
    carryWeight: number,
    targetGrade: string
): { requiredScore: number; achievable: boolean; message: string } {
    const gradeEntry = GRADING_SCALE.find((g) => g.grade === targetGrade);
    if (!gradeEntry) {
        return { requiredScore: 0, achievable: false, message: 'Invalid grade.' };
    }

    const targetMinMark = gradeEntry.minMark;
    const finalWeight = 100 - carryWeight;

    if (finalWeight === 0) {
        return { requiredScore: 0, achievable: false, message: 'Final exam has 0% weight.' };
    }

    const carryContribution = carryMark * (carryWeight / 100);
    const requiredScore = (targetMinMark - carryContribution) / (finalWeight / 100);
    const rounded = Math.round(requiredScore * 100) / 100;

    if (rounded > 100) {
        return {
            requiredScore: rounded,
            achievable: false,
            message: `You need ${rounded.toFixed(1)}% on the final — not achievable (max 100%).`,
        };
    }

    if (rounded < 0) {
        return {
            requiredScore: 0,
            achievable: true,
            message: `You've already secured ${targetGrade} with your carry marks! Any final score will work.`,
        };
    }

    return {
        requiredScore: rounded,
        achievable: true,
        message: `You need at least ${rounded.toFixed(1)}% on the final exam to get ${targetGrade}.`,
    };
}
