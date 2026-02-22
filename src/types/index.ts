// ==========================================
// UTHMhub - Type Definitions
// ==========================================

export interface Subject {
  id: string;
  code: string;
  name: string;
  creditHour: number;
  grade: string;
  marksPercentage?: number;
  pointValue: number;
}

export interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
  gpa: number;
}

export interface GradingEntry {
  minMark: number;
  maxMark: number;
  grade: string;
  pointValue: number;
}

export interface AcademicEvent {
  id: string;
  title: string;
  startDate: string; // ISO date string
  endDate: string;
  category: EventCategory;
  color: string;
}

export type EventCategory =
  | 'registration'
  | 'lecture'
  | 'study-week'
  | 'exam'
  | 'holiday'
  | 'online'
  | 'break'
  | 'revision'
  | 'other';

export interface UserEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  category: 'assignment' | 'project' | 'quiz' | 'presentation' | 'other';
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  description: string;
  category: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  faculty: string;
  theme: FacultyTheme;
}

export type FacultyTheme = 'purple' | 'blue' | 'red' | 'green' | 'orange';

export interface PredictorInput {
  currentCGPA: number;
  totalCreditsCompleted: number;
  targetCGPA: number;
  nextSemesterCredits: number;
}

export interface FinalExamInput {
  carryMark: number;
  carryWeight: number; // percentage e.g. 60
  targetGrade: string;
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}
