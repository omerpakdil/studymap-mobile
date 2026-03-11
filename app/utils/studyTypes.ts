export interface StudyTaskExplainability {
  summary: string;
  reasons: string[];
  signals: {
    phase: 'foundation' | 'build' | 'consolidation' | 'final';
    module?: string;
    rebalanceBoost?: number;
    overdueCarry?: number;
    overloadRisk?: number;
  };
}

export type SessionOutcome = 'easy' | 'okay' | 'hard' | 'incomplete';

export interface StudySessionFeedback {
  taskId: string;
  sessionId: string;
  subject: string;
  examCode?: string;
  outcome: SessionOutcome;
  plannedMinutes: number;
  actualMinutes: number;
  completed: boolean;
  noteLength?: number;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  type: 'study' | 'practice' | 'review' | 'quiz';
  moduleId?: string;
  moduleLabel?: string;
  phase?: 'foundation' | 'build' | 'consolidation' | 'final';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  description: string;
  date: string;
  timeSlot: string;
  completed: boolean;
  progress: number;
  resources?: string[];
  notes?: string;
  explainability?: StudyTaskExplainability;
}

export interface StudyProgram {
  id: string;
  examType: string;
  examDate: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  weeklyHours: number;
  dailyTasks: StudyTask[];
  weeklySchedule: Record<string, StudyTask[]>;
  subjectBreakdown: Record<
    string,
    {
      totalHours: number;
      weeklyHours: number;
      intensityLevel: number;
      priority: number;
      currentProgress: number;
    }
  >;
  milestones: {
    date: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
  generatedAt: string;
  lastUpdated: string;
}
