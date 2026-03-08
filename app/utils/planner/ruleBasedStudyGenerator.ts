import type { OnboardingData } from '../onboardingData';
import { migrateLegacyOnboardingToV2, validateOnboardingV2 } from '../onboardingV2';
import { getSubjectFocusMultiplier, loadSubjectFocusOverrides, type SubjectFocusOverrides } from '../subjectFocusManager';
import { getLocalDateKey } from '../localDate';
import { getTaskCompletions, loadDailyTasks } from '../studyProgramStorage';
import type { StudyProgram, StudyTask, StudyTaskExplainability } from '../studyTypes';

import { mapOnboardingV2ToPlannerInput, type PlannerInput } from './plannerInputMapper';
import { ENABLE_TARGET_PRESSURE_ADJUSTMENTS } from './featureFlags';

export type ProgressCallback = (status: string, current: number, total: number) => void;

type PlanningPhase = 'foundation' | 'build' | 'consolidation' | 'final';
type ExamFamily = 'language' | 'admissions' | 'professional' | 'general';
type TaskCandidate = {
  subject: string;
  type: StudyTask['type'];
  score: number;
  rebalanceBoost?: number;
  overdueCarry?: number;
};
type RebalanceProfile = {
  completionRate: number;
  overloadRisk: number;
  subjectStats: Record<
    string,
    {
      completionRate: number;
      recentTotal: number;
      overdueCarry: number;
      boost: number;
    }
  >;
};

const PHASE_CONFIG: Record<
  PlanningPhase,
  {
    label: string;
    typeWeights: Record<StudyTask['type'], number>;
    sessionDuration: number;
    extraTasks: number;
    difficulty: StudyTask['difficulty'];
  }
> = {
  foundation: {
    label: 'Foundation',
    typeWeights: { study: 5, practice: 2, review: 1, quiz: 0 },
    sessionDuration: 50,
    extraTasks: 0,
    difficulty: 'easy',
  },
  build: {
    label: 'Build',
    typeWeights: { study: 3, practice: 4, review: 2, quiz: 1 },
    sessionDuration: 55,
    extraTasks: 0,
    difficulty: 'medium',
  },
  consolidation: {
    label: 'Consolidation',
    typeWeights: { study: 1, practice: 4, review: 4, quiz: 2 },
    sessionDuration: 60,
    extraTasks: 1,
    difficulty: 'medium',
  },
  final: {
    label: 'Final',
    typeWeights: { study: 0, practice: 3, review: 4, quiz: 5 },
    sessionDuration: 65,
    extraTasks: 1,
    difficulty: 'hard',
  },
};

const getDayName = (date: Date): string =>
  ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];

const getPhaseForDay = (remainingDays: number, totalDays: number): PlanningPhase => {
  const foundationThreshold = Math.max(56, Math.floor(totalDays * 0.6));

  if (remainingDays > foundationThreshold) return 'foundation';
  if (remainingDays > 28) return 'build';
  if (remainingDays > 10) return 'consolidation';
  return 'final';
};

const getPriorityByPhase = (phase: PlanningPhase): StudyTask['priority'] => {
  switch (phase) {
    case 'foundation':
      return 'medium';
    case 'build':
      return 'high';
    case 'consolidation':
      return 'high';
    case 'final':
      return 'high';
    default:
      return 'medium';
  }
};

const normalizeKey = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const MODULE_NAME_STOPWORDS = new Set(['and', 'or', 'the', 'of', 'for', 'to', 'with', 'in']);
const SAFE_MODULE_MAX_WORDS = 3;
const SAFE_MODULE_MAX_LENGTH = 28;

const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getSafeModuleLabel = (moduleId: string, fallbackSubject: string): string => {
  const normalizedWords = moduleId
    .split('_')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .filter((part) => !MODULE_NAME_STOPWORDS.has(part))
    .filter((part) => !/^\d+$/.test(part));

  const cappedWords = normalizedWords.slice(0, SAFE_MODULE_MAX_WORDS);
  const candidate = toTitleCase(cappedWords.join(' '));

  if (!candidate) return fallbackSubject;
  if (candidate.length <= SAFE_MODULE_MAX_LENGTH) return candidate;
  return `${candidate.slice(0, SAFE_MODULE_MAX_LENGTH - 1).trim()}…`;
};

const slotDurationCap: Record<string, number> = {
  early_morning: 45,
  morning: 90,
  afternoon: 90,
  evening: 90,
  night: 60,
};

const SLOT_DURATION_FLOOR: Record<string, number> = {
  early_morning: 25,
  morning: 30,
  afternoon: 30,
  evening: 30,
  night: 25,
};

const SLOT_DURATION_TARGET: Record<string, number> = {
  early_morning: 30,
  morning: 60,
  afternoon: 60,
  evening: 60,
  night: 45,
};

const SLOT_DAILY_CAPACITY: Record<string, number> = {
  early_morning: 35,
  morning: 70,
  afternoon: 70,
  evening: 75,
  night: 45,
};

const SLOT_TYPE_MULTIPLIER: Record<string, Record<StudyTask['type'], number>> = {
  early_morning: { study: 0.85, practice: 0.75, review: 1, quiz: 1 },
  morning: { study: 1, practice: 1, review: 0.9, quiz: 0.9 },
  afternoon: { study: 1, practice: 1.05, review: 0.95, quiz: 0.95 },
  evening: { study: 0.95, practice: 1.05, review: 1, quiz: 0.95 },
  night: { study: 0.8, practice: 0.85, review: 0.95, quiz: 0.9 },
};

const LANGUAGE_EXAMS = new Set([
  'toefl',
  'ielts',
  'hsk',
  'jlpt',
  'topik',
  'testdaf',
  'delf_dalf',
  'yds',
  'ydt_tr',
]);

const PROFESSIONAL_EXAMS = new Set([
  'usmle',
  'mccqe',
  'scfhs',
  'bar_cn',
  'bar_jp',
  'bar_kr',
  'bar_sa',
  'staatsexamen',
  'zweites_staatsexamen',
  'steuerberater',
  'crfpa',
  'sqe',
  'acca_icaew',
  'cpa_ca',
  'cpa_cn',
  'cpa_id',
  'ca_final',
  'oab',
  'ukmppd',
  'med_lic_jp',
  'med_lic_kr',
  'nca_bar',
  'tus',
  'dus',
]);

const ADMISSIONS_EXAMS = new Set([
  'sat',
  'act',
  'gre',
  'gmat',
  'lsat',
  'mcat',
  'cat',
  'gate',
  'jee',
  'neet',
  'upsc',
  'gaokao',
  'gaokao_science',
  'gaokao_humanities',
  'suneung',
  'suneung_science',
  'suneung_humanities',
  'abitur',
  'a_levels',
  'a_levels_science',
  'a_levels_humanities',
  'baccalaureat',
  'baccalaureat_science',
  'baccalaureat_humanities',
  'tyt',
  'ayt_sayisal',
  'ayt_ea',
  'ayt_sozel',
  'tyt_ayt_sayisal',
  'tyt_ayt_ea',
  'tyt_ayt_sozel',
  'kpss',
  'kpss_gygk',
  'kpss_egitim',
  'kpss_oabt',
  'kpss_a',
  'ales',
  'qudrat',
  'tahsili',
  'utbk_snbt',
  'enem',
  'vestibular',
  'concours_ge',
  'polytechnique_track',
  'common_test_jp',
  'todai_exam',
]);

const getExamFamily = (examId: string): ExamFamily => {
  if (LANGUAGE_EXAMS.has(examId)) return 'language';
  if (PROFESSIONAL_EXAMS.has(examId)) return 'professional';
  if (ADMISSIONS_EXAMS.has(examId)) return 'admissions';
  return 'general';
};

const getDailyCapacityMinutes = (slots: string[]): number => {
  if (!slots.length) return SLOT_DAILY_CAPACITY.morning;
  return slots.reduce((sum, slot) => sum + (SLOT_DAILY_CAPACITY[slot] ?? SLOT_DAILY_CAPACITY.morning), 0);
};

const getDateKey = (date: Date): string => getLocalDateKey(date);

const getPlannerRebalanceProfile = async (): Promise<RebalanceProfile> => {
  try {
    const [tasks, completions] = await Promise.all([loadDailyTasks(), getTaskCompletions()]);
    if (!tasks.length) {
      return { completionRate: 0.7, overloadRisk: 0, subjectStats: {} };
    }

    const todayKey = getDateKey(new Date());
    const lookbackStart = new Date();
    lookbackStart.setDate(lookbackStart.getDate() - 21);
    const lookbackStartKey = getDateKey(lookbackStart);

    const isCompleted = (task: StudyTask) => Boolean(completions[task.id] || task.completed);
    const historyTasks = tasks.filter((task) => task.date >= lookbackStartKey && task.date < todayKey);
    const overdueTasks = tasks.filter((task) => task.date < todayKey && !isCompleted(task));

    const bySubject: RebalanceProfile['subjectStats'] = {};
    historyTasks.forEach((task) => {
      const key = task.subject;
      if (!bySubject[key]) {
        bySubject[key] = { completionRate: 0, recentTotal: 0, overdueCarry: 0, boost: 0 };
      }

      bySubject[key].recentTotal += 1;
      bySubject[key].completionRate += isCompleted(task) ? 1 : 0;
    });

    Object.values(bySubject).forEach((stats) => {
      if (stats.recentTotal > 0) {
        stats.completionRate = stats.completionRate / stats.recentTotal;
      }
    });

    overdueTasks.forEach((task) => {
      const key = task.subject;
      if (!bySubject[key]) {
        bySubject[key] = { completionRate: 0.65, recentTotal: 0, overdueCarry: 0, boost: 0 };
      }
      bySubject[key].overdueCarry += 1;
    });

    Object.values(bySubject).forEach((stats) => {
      const weaknessBoost = stats.recentTotal >= 3 ? Math.max(0, 0.7 - stats.completionRate) * 2.4 : 0;
      const carryBoost = Math.min(1.3, stats.overdueCarry * 0.3);
      stats.boost = weaknessBoost + carryBoost;
    });

    const totalCompleted = historyTasks.filter(isCompleted).length;
    const completionRate = historyTasks.length > 0 ? totalCompleted / historyTasks.length : 0.7;
    const overloadRisk = Math.max(
      0,
      Math.min(1, (0.68 - completionRate) * 1.6 + Math.min(0.45, overdueTasks.length * 0.04))
    );

    return { completionRate, overloadRisk, subjectStats: bySubject };
  } catch {
    return { completionRate: 0.7, overloadRisk: 0, subjectStats: {} };
  }
};

const getAllowedTaskTypes = (
  input: PlannerInput,
  phase: PlanningPhase,
  dayIndex: number
): StudyTask['type'][] => {
  const phaseEntries = Object.entries(PHASE_CONFIG[phase].typeWeights)
    .filter(([, weight]) => weight > 0)
    .map(([type]) => type as StudyTask['type']);

  const allowed = phaseEntries.filter((type) => input.sessionTypes.includes(type as any));
  if (!allowed.length) return ['practice'];

  const shouldMock = input.sessionTypes.includes('mock' as any)
    && input.mockFrequencyDays > 0
    && dayIndex > 0
    && dayIndex % input.mockFrequencyDays === 0;

  if (shouldMock && !allowed.includes('practice')) return ['practice'];

  const reviewFloor = Math.max(1, Math.round(1 / Math.max(0.15, input.minReviewRatio)));
  if (dayIndex > 0 && dayIndex % reviewFloor === 0 && allowed.includes('review')) {
    return ['review', ...allowed.filter((type) => type !== 'review')];
  }

  return allowed;
};

const getTypeWeight = (phase: PlanningPhase, type: StudyTask['type']): number =>
  Math.max(0, PHASE_CONFIG[phase].typeWeights[type] ?? 0);

const getFamilyTypeAdjust = (
  family: ExamFamily,
  type: StudyTask['type'],
  subjectBlueprint?: PlannerInput['subjectBlueprints'][number]
): number => {
  const subjectId = subjectBlueprint?.id ?? '';
  const focusSkills = subjectBlueprint?.focusSkills ?? [];

  if (family === 'language') {
    if (type === 'practice') return 0.8;
    if (type === 'review') return 0.35;
    if (type === 'study' && (subjectId === 'writing' || subjectId === 'speaking')) return 0.45;
    if (type === 'quiz') return -0.15;
  }

  if (family === 'admissions') {
    if (type === 'practice') return 0.75;
    if (type === 'review') return 0.25;
    if (type === 'study' && focusSkills.includes('timed_accuracy')) return -0.1;
  }

  if (family === 'professional') {
    if (type === 'review') return 0.7;
    if (type === 'study') return 0.45;
    if (type === 'practice') return 0.15;
    if (type === 'quiz') return 0.2;
  }

  return 0;
};

const buildSubjectScores = (
  subjects: PlannerInput['subjectBlueprints'],
  subjectIntensity: Record<string, number>,
  focusOverrides: SubjectFocusOverrides,
  usageCount: Record<string, number>,
  lastScheduledDay: Record<string, number>,
  dayIndex: number
): { subject: string; score: number }[] => {
  return subjects.map((subject) => {
    const subjectKey = subject.label;
    const intensity = (subjectIntensity[subjectKey] ?? 1) + 1;
    const focusMultiplier = getSubjectFocusMultiplier(subjectKey, focusOverrides);
    const timesUsed = usageCount[subjectKey] || 0;
    const lastDay = lastScheduledDay[subjectKey] ?? -7;

    const freshnessBoost = Math.min(2, Math.max(0, dayIndex - lastDay) * 0.15);
    const fatiguePenalty = timesUsed * 0.2;
    const examWeightBoost = Math.max(0.4, subject.weight) * 1.6;
    const score = intensity * focusMultiplier * 1.6 + examWeightBoost + freshnessBoost - fatiguePenalty;

    return { subject: subject.label, score };
  });
};

const buildTaskCandidates = (
  input: PlannerInput,
  phase: PlanningPhase,
  dayIndex: number,
  allowedTypes: StudyTask['type'][],
  focusOverrides: SubjectFocusOverrides,
  usageCount: Record<string, number>,
  lastScheduledDay: Record<string, number>,
  rebalanceProfile: RebalanceProfile
): TaskCandidate[] => {
  const family = getExamFamily(input.examId);
  const subjectScores = new Map(
    buildSubjectScores(
      input.subjectBlueprints,
      input.subjectIntensity,
      focusOverrides,
      usageCount,
      lastScheduledDay,
      dayIndex
    ).map((item) => [item.subject, item.score])
  );

  return input.subjectBlueprints.flatMap((subjectBlueprint) => {
    const subject = subjectBlueprint.label;
    const subjectScore = subjectScores.get(subject) ?? 0;
    const timesUsed = usageCount[subject] || 0;
    const lastDay = lastScheduledDay[subject] ?? -7;
    const daysSinceLast = Math.max(0, dayIndex - lastDay);
    const subjectRebalance = rebalanceProfile.subjectStats[subject];
    const rebalanceBoost = subjectRebalance?.boost ?? 0;

    return allowedTypes.map((type) => {
      const phaseWeight = getTypeWeight(phase, type);
      const familyAdjust = getFamilyTypeAdjust(family, type, subjectBlueprint);
      const reviewFloorBoost = type === 'review'
        ? Math.max(0, input.minReviewRatio - 0.2) * 2.6
        : 0;
      const mockCadenceBoost =
        type === 'practice' && input.mockFrequencyDays > 0 && dayIndex > 0 && dayIndex % input.mockFrequencyDays === 0
          ? 0.55
          : 0;
      const freshnessBoost = type === 'review'
        ? Math.min(0.9, daysSinceLast * 0.08)
        : Math.min(0.6, daysSinceLast * 0.05);
      const repetitionPenalty = timesUsed * (type === 'review' ? 0.12 : 0.18);
      const consecutiveTypePenalty = lastDay === dayIndex - 1 && type !== 'review' ? 0.18 : 0;
      const carryTypeBoost =
        (subjectRebalance?.overdueCarry ?? 0) > 0 && (type === 'review' || type === 'practice')
          ? Math.min(0.7, (subjectRebalance?.overdueCarry ?? 0) * 0.14)
          : 0;
      const overloadTypeAdjust =
        rebalanceProfile.overloadRisk > 0.3
          ? type === 'study'
            ? -rebalanceProfile.overloadRisk * 0.45
            : type === 'review'
              ? rebalanceProfile.overloadRisk * 0.35
              : 0
          : 0;

      const score =
        subjectScore
        + phaseWeight * 0.55
        + familyAdjust
        + reviewFloorBoost
        + mockCadenceBoost
        + freshnessBoost
        + rebalanceBoost
        + carryTypeBoost
        + overloadTypeAdjust
        - repetitionPenalty
        - consecutiveTypePenalty;

      return {
        subject,
        type,
        score,
        rebalanceBoost,
        overdueCarry: subjectRebalance?.overdueCarry ?? 0,
      };
    });
  });
};

const pickTaskCandidate = (
  input: PlannerInput,
  phase: PlanningPhase,
  dayIndex: number,
  allowedTypes: StudyTask['type'][],
  focusOverrides: SubjectFocusOverrides,
  usageCount: Record<string, number>,
  lastScheduledDay: Record<string, number>,
  rebalanceProfile: RebalanceProfile,
  seed: number
): TaskCandidate => {
  const candidates = buildTaskCandidates(
    input,
    phase,
    dayIndex,
    allowedTypes,
    focusOverrides,
    usageCount,
    lastScheduledDay
    ,
    rebalanceProfile
  ).sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    const fallbackSubject = input.subjectBlueprints[seed % input.subjectBlueprints.length]?.label || 'General';
    return { subject: fallbackSubject, type: 'practice', score: 0 };
  }

  const topBand = candidates.filter((candidate) => candidate.score >= candidates[0].score - 0.45);
  return topBand[seed % topBand.length];
};

const buildTaskExplainability = (
  phase: PlanningPhase,
  candidate: TaskCandidate,
  moduleLabel: string,
  rebalanceProfile: RebalanceProfile
): StudyTaskExplainability => {
  const reasons = [
    `${PHASE_CONFIG[phase].label} phase favors ${candidate.type} work for this point in the plan.`,
    `${candidate.subject} was selected based on current focus and exam weighting.`,
  ];

  if (candidate.rebalanceBoost && candidate.rebalanceBoost > 0.2) {
    reasons.push(`${candidate.subject} was boosted to recover weaker recent performance.`);
  }

  if ((candidate.overdueCarry ?? 0) > 0) {
    reasons.push(`There are missed or delayed ${candidate.subject} tasks to absorb back into the plan.`);
  }

  if (rebalanceProfile.overloadRisk > 0.3) {
    reasons.push('Overall load was softened to avoid piling more pressure onto an overloaded week.');
  }

  return {
    summary: `${candidate.subject} · ${candidate.type}`,
    reasons,
    signals: {
      phase,
      module: moduleLabel,
      rebalanceBoost: candidate.rebalanceBoost,
      overdueCarry: candidate.overdueCarry,
      overloadRisk: rebalanceProfile.overloadRisk,
    },
  };
};

const buildSubjectBlueprintMap = (input: PlannerInput) =>
  new Map(input.subjectBlueprints.map((subject) => [subject.label, subject]));

const pickModule = (
  subjectLabel: string,
  subjectBlueprintMap: Map<string, PlannerInput['subjectBlueprints'][number]>,
  moduleCursor: Record<string, number>,
  type: StudyTask['type']
): { moduleId: string; moduleLabel: string } => {
  const blueprint = subjectBlueprintMap.get(subjectLabel);
  const modules = blueprint?.modules?.length ? blueprint.modules : [normalizeKey(subjectLabel)];
  const key = blueprint?.id || normalizeKey(subjectLabel);
  const currentIndex = moduleCursor[key] ?? 0;
  const moduleId = modules[currentIndex % modules.length];

  if (type === 'study' || type === 'practice') {
    moduleCursor[key] = currentIndex + 1;
  }

  return {
    moduleId,
    moduleLabel: getSafeModuleLabel(moduleId, subjectLabel),
  };
};

const getTaskDuration = (
  input: PlannerInput,
  type: StudyTask['type'],
  timeSlot: string,
  phase: PlanningPhase,
  durationBias: number
): number => {
  const [minRecommended, maxRecommended] = input.recommendedSessionMinutes;
  const baseByType: Record<StudyTask['type'], number> = {
    study: Math.max(minRecommended, 45),
    practice: Math.min(maxRecommended, 60),
    review: Math.max(25, minRecommended - 10),
    quiz: Math.max(25, minRecommended - 15),
  };

  const phaseAdjust = phase === 'final' ? 5 : phase === 'foundation' ? -5 : 0;
  const slotCap = slotDurationCap[timeSlot] ?? 90;
  const slotFloor = SLOT_DURATION_FLOOR[timeSlot] ?? 25;
  const slotTarget = SLOT_DURATION_TARGET[timeSlot] ?? 60;
  const slotMultiplier = SLOT_TYPE_MULTIPLIER[timeSlot]?.[type] ?? 1;
  const examFamily = getExamFamily(input.examId);
  const familyAdjust =
    examFamily === 'language' && type === 'practice' ? -5
      : examFamily === 'professional' && type === 'review' ? 5
        : examFamily === 'admissions' && type === 'practice' ? 5
          : 0;
  const desired = Math.round((baseByType[type] + phaseAdjust + durationBias + familyAdjust) * slotMultiplier);
  const raw = Math.min(slotCap, Math.max(slotFloor, Math.min(slotTarget, desired)));
  return nearestStandardDuration(raw);
};

const buildTaskContent = (
  input: PlannerInput,
  subject: string,
  subjectBlueprint: PlannerInput['subjectBlueprints'][number] | undefined,
  _moduleLabel: string,
  type: StudyTask['type'],
  phase: PlanningPhase,
  examName: string
): Pick<StudyTask, 'title' | 'description'> => {
  const family = getExamFamily(input.examId);
  const subjectId = subjectBlueprint?.id ?? normalizeKey(subject);
  const titleByType: Record<StudyTask['type'], string> = {
    study: `${subject} · Study`,
    practice: `${subject} · Practice`,
    review: `${subject} · Review`,
    quiz: `${subject} · Quiz`,
  };

  const descriptionByFamily: Record<ExamFamily, Record<StudyTask['type'], string>> = {
    language: {
      study: `${PHASE_CONFIG[phase].label} phase study block for ${subject} in ${examName}.`,
      practice: `${PHASE_CONFIG[phase].label} phase practice block for ${subject} with exam-style timing.`,
      review: `${PHASE_CONFIG[phase].label} phase review block for ${subject} to hold recent gains.`,
      quiz: `${PHASE_CONFIG[phase].label} phase quick check for ${subject} before the next practice cycle.`,
    },
    admissions: {
      study: `${PHASE_CONFIG[phase].label} phase study block for ${subject} to build exam control.`,
      practice: `${PHASE_CONFIG[phase].label} phase practice block for ${subject} under timed pressure.`,
      review: `${PHASE_CONFIG[phase].label} phase review block for ${subject} to stabilize performance.`,
      quiz: `${PHASE_CONFIG[phase].label} phase quick check for ${subject} before the next study block.`,
    },
    professional: {
      study: `${PHASE_CONFIG[phase].label} phase study block for ${subject} to strengthen readiness.`,
      practice: `${PHASE_CONFIG[phase].label} phase practice block for ${subject} with applied question work.`,
      review: `${PHASE_CONFIG[phase].label} phase review block for ${subject} before the next heavy session.`,
      quiz: `${PHASE_CONFIG[phase].label} phase readiness check for ${subject}.`,
    },
    general: {
      study: `${PHASE_CONFIG[phase].label} phase study block for ${subject} in ${examName}.`,
      practice: `${PHASE_CONFIG[phase].label} phase practice block for ${subject} in ${examName}.`,
      review: `${PHASE_CONFIG[phase].label} phase review block for ${subject} in ${examName}.`,
      quiz: `${PHASE_CONFIG[phase].label} phase quick check for ${subject} in ${examName}.`,
    },
  };

  if (family === 'language' && subjectId === 'speaking' && type === 'practice') {
    return {
      title: `${subject} · Practice`,
      description: `${PHASE_CONFIG[phase].label} phase speaking practice block for ${subject}.`,
    };
  }

  if (family === 'language' && subjectId === 'writing' && type === 'study') {
    return {
      title: `${subject} · Study`,
      description: `${PHASE_CONFIG[phase].label} phase writing study block for ${subject}.`,
    };
  }

  if (input.examId === 'lsat' && subjectId === 'lr' && type === 'practice') {
    return {
      title: `${subject} · Practice`,
      description: `${PHASE_CONFIG[phase].label} phase practice block for ${subject} with timed reasoning work.`,
    };
  }

  if ((input.examId.startsWith('kpss') || input.examId === 'kpss') && type === 'practice') {
    return {
      title: `${subject} · Practice`,
      description: `${PHASE_CONFIG[phase].label} phase question practice block for ${subject}.`,
    };
  }

  return {
    title: titleByType[type],
    description: descriptionByFamily[family][type],
  };
};

const createMilestones = (input: PlannerInput) => {
  const milestones: StudyProgram['milestones'] = [];
  const totalWeeks = Math.ceil(input.totalDays / 7);

  for (let week = 2; week <= totalWeeks; week += 2) {
    const date = new Date(input.startDate);
    date.setDate(input.startDate.getDate() + week * 7);

    const remainingDays = Math.ceil((input.examDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const phase = getPhaseForDay(remainingDays, input.totalDays);

    milestones.push({
      date: getLocalDateKey(date),
      title: `Week ${week} ${PHASE_CONFIG[phase].label} Checkpoint`,
      description:
        phase === 'final'
          ? 'Run full exam-style drills and fix last weak points.'
          : 'Review weak areas and rebalance subject focus.',
      completed: false,
    });
  }

  return milestones;
};

const createSubjectBreakdown = (input: PlannerInput, allTasks: StudyTask[]): StudyProgram['subjectBreakdown'] => {
  const bySubject: StudyProgram['subjectBreakdown'] = {};

  input.subjects.forEach((subject) => {
    const subjectTasks = allTasks.filter((task) => task.subject === subject);
    const totalHours = Math.round(subjectTasks.reduce((acc, task) => acc + task.duration, 0) / 60);

    bySubject[subject] = {
      totalHours,
      weeklyHours: Math.max(1, Math.round(totalHours / Math.max(1, input.totalDays / 7))),
      intensityLevel: input.subjectIntensity[subject] ?? 1,
      priority: (input.subjectIntensity[subject] ?? 1) + 1,
      currentProgress: 0,
    };
  });

  return bySubject;
};

const createWeeklySchedule = (tasks: StudyTask[]): StudyProgram['weeklySchedule'] => {
  const schedule: StudyProgram['weeklySchedule'] = {};
  if (tasks.length === 0) return schedule;

  const firstDay = new Date(tasks[0].date);

  tasks.forEach((task) => {
    const current = new Date(task.date);
    const dayDiff = Math.floor((current.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(dayDiff / 7) + 1;
    const key = `week_${weekNumber}`;

    if (!schedule[key]) schedule[key] = [];
    schedule[key].push(task);
  });

  return schedule;
};

const STANDARD_DURATION_BLOCKS = [25, 30, 45, 60, 90] as const;

const nearestStandardDuration = (value: number): number => {
  return STANDARD_DURATION_BLOCKS.reduce((best, cur) =>
    Math.abs(cur - value) < Math.abs(best - value) ? cur : best
  );
};

const rebalanceDurationTotals = (durations: number[], targetTotal: number): number[] => {
  const next = [...durations];
  const getDelta = () => targetTotal - next.reduce((sum, d) => sum + d, 0);

  // Bounded local search: nudge entries to neighboring standard blocks.
  for (let i = 0; i < 200; i += 1) {
    const delta = getDelta();
    if (Math.abs(delta) < 5) break;

    let bestIdx = -1;
    let bestStep = 0;

    for (let idx = 0; idx < next.length; idx += 1) {
      const current = next[idx];
      const currentPos = STANDARD_DURATION_BLOCKS.indexOf(current as any);
      if (currentPos < 0) continue;

      if (delta > 0 && currentPos < STANDARD_DURATION_BLOCKS.length - 1) {
        const candidate = STANDARD_DURATION_BLOCKS[currentPos + 1];
        const step = candidate - current;
        if (bestStep === 0 || step < bestStep) {
          bestIdx = idx;
          bestStep = step;
        }
      }

      if (delta < 0 && currentPos > 0) {
        const candidate = STANDARD_DURATION_BLOCKS[currentPos - 1];
        const step = current - candidate;
        if (bestStep === 0 || step < bestStep) {
          bestIdx = idx;
          bestStep = step;
        }
      }
    }

    if (bestIdx < 0 || bestStep === 0) break;

    const pos = STANDARD_DURATION_BLOCKS.indexOf(next[bestIdx] as any);
    next[bestIdx] = delta > 0 ? STANDARD_DURATION_BLOCKS[pos + 1] : STANDARD_DURATION_BLOCKS[pos - 1];
  }

  return next;
};

const normalizeTaskDurations = (tasks: StudyTask[]): StudyTask[] => {
  if (!tasks.length) return tasks;

  const rawDurations = tasks.map((task) => task.duration);
  const rawTotal = rawDurations.reduce((sum, d) => sum + d, 0);
  const rounded = rawDurations.map((d) => nearestStandardDuration(d));
  const rebalanced = rebalanceDurationTotals(rounded, rawTotal);

  return tasks.map((task, idx) => ({
    ...task,
    duration: rebalanced[idx],
  }));
};

const generateTasks = (
  input: PlannerInput,
  focusOverrides: SubjectFocusOverrides,
  rebalanceProfile: RebalanceProfile,
  onProgress?: ProgressCallback
): StudyTask[] => {
  const tasks: StudyTask[] = [];
  const totalWeeks = Math.ceil(input.totalDays / 7);

  const studyDays = Object.keys(input.schedule).filter((day) => (input.schedule[day] || []).length > 0);
  const fallbackStudyDays = studyDays.length > 0 ? studyDays : ['monday', 'wednesday', 'friday'];
  const baseTasksPerDay = Math.max(1, Math.round(input.weeklyHours / fallbackStudyDays.length));
  const targetPressure = ENABLE_TARGET_PRESSURE_ADJUSTMENTS
    ? Math.max(0, Math.min(1, input.targetValueNormalized || 0))
    : 0;
  const pressureLookaheadDays = Math.round(targetPressure * 6);
  const extraTaskBias = targetPressure >= 0.7 ? 1 : 0;
  const durationBias = Math.round(targetPressure * 8 - rebalanceProfile.overloadRisk * 6);
  const overloadTaskReduction = rebalanceProfile.overloadRisk >= 0.35 ? 1 : 0;
  const subjectBlueprintMap = buildSubjectBlueprintMap(input);
  const moduleCursor: Record<string, number> = {};

  const usageCount: Record<string, number> = {};
  const lastScheduledDay: Record<string, number> = {};

  let currentDate = new Date(input.startDate);
  let taskIndex = 0;
  let dayIndex = 0;

  for (let week = 1; week <= totalWeeks; week += 1) {
    if (onProgress) onProgress(`Building week ${week}...`, week - 1, totalWeeks);

    for (let day = 0; day < 7; day += 1) {
      if (tasks.length > 0 && currentDate > input.examDate) break;

      const dayName = getDayName(currentDate);
      const timeSlots = input.schedule[dayName] || [];
      const isStudyDay = timeSlots.length > 0 || fallbackStudyDays.includes(dayName);

      if (isStudyDay) {
        const slots = timeSlots.length > 0 ? timeSlots : ['morning'];
        const remainingDays = Math.max(
          0,
          Math.ceil((input.examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        const phase = getPhaseForDay(Math.max(0, remainingDays - pressureLookaheadDays), input.totalDays);
        const config = PHASE_CONFIG[phase];
        const dailyCapacityMinutes = getDailyCapacityMinutes(slots);
        const expectedTaskDuration = Math.max(
          25,
          Math.min(input.recommendedSessionMinutes[1], Math.round(dailyCapacityMinutes / Math.max(1, slots.length)))
        );
        const dailyCapacityFromSlots = Math.max(1, Math.round(dailyCapacityMinutes / expectedTaskDuration));
        const tasksForDay = Math.min(
          dailyCapacityFromSlots,
          Math.max(1, baseTasksPerDay + config.extraTasks + extraTaskBias - overloadTaskReduction)
        );
        const allowedTypes = getAllowedTaskTypes(input, phase, dayIndex);

        for (let i = 0; i < tasksForDay; i += 1) {
          const seed = taskIndex + week + i + dayIndex;
          const candidate = pickTaskCandidate(
            input,
            phase,
            dayIndex,
            allowedTypes,
            focusOverrides,
            usageCount,
            lastScheduledDay,
            rebalanceProfile,
            seed
          );
          const subject = candidate.subject;
          const type = candidate.type;
          const timeSlot = slots[i % slots.length];
          const { moduleId, moduleLabel } = pickModule(subject, subjectBlueprintMap, moduleCursor, type);
          const duration = getTaskDuration(input, type, timeSlot, phase, durationBias);
          const subjectBlueprint = subjectBlueprintMap.get(subject);
          const taskContent = buildTaskContent(input, subject, subjectBlueprint, moduleLabel, type, phase, input.examName);
          const explainability = buildTaskExplainability(phase, candidate, moduleLabel, rebalanceProfile);

          usageCount[subject] = (usageCount[subject] || 0) + 1;
          lastScheduledDay[subject] = dayIndex;

          tasks.push({
            id: `task_${taskIndex + 1}`,
            title: taskContent.title,
            subject,
            type,
            moduleId,
            moduleLabel,
            phase,
            duration,
            difficulty: config.difficulty,
            priority: getPriorityByPhase(phase),
            description: taskContent.description,
            date: getLocalDateKey(currentDate),
            timeSlot,
            completed: false,
            progress: 0,
            resources: [`${input.examName} prep`, moduleLabel],
            notes: '',
            explainability,
          });

          taskIndex += 1;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex += 1;
      if (currentDate > input.examDate) break;
    }
  }

  if (onProgress) onProgress('Program complete', totalWeeks, totalWeeks);
  return normalizeTaskDurations(tasks);
};

export const generateStudyProgramWithRules = async (
  legacyOnboardingData: OnboardingData,
  onProgress?: ProgressCallback
): Promise<StudyProgram | null> => {
  try {
    const v2 = migrateLegacyOnboardingToV2(legacyOnboardingData);
    const validation = validateOnboardingV2(v2);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid onboarding data');
    }

    const input = mapOnboardingV2ToPlannerInput(v2);
    const [focusOverrides, rebalanceProfile] = await Promise.all([
      loadSubjectFocusOverrides(),
      getPlannerRebalanceProfile(),
    ]);
    const tasks = generateTasks(input, focusOverrides, rebalanceProfile, onProgress);

    return {
      id: `rule_program_${Date.now()}`,
      examType: input.examName,
      examDate: v2.examDate,
      startDate: getLocalDateKey(input.startDate),
      endDate: getLocalDateKey(input.examDate),
      totalDays: input.totalDays,
      weeklyHours: input.weeklyHours,
      dailyTasks: tasks,
      weeklySchedule: createWeeklySchedule(tasks),
      subjectBreakdown: createSubjectBreakdown(input, tasks),
      milestones: createMilestones(input),
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Rule-based generation failed:', error);
    return null;
  }
};
