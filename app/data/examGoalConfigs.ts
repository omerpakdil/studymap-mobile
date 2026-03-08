import { examCatalogByCountry } from '@/app/data/examCatalogByCountry';

export type GoalMetricType = 'score' | 'rank' | 'percentile' | 'band' | 'level' | 'grade' | 'pass';
export type GoalDirection = 'higher_better' | 'lower_better';

export interface NumericGoalInput {
  kind: 'numeric';
  min: number;
  max: number;
  step: number;
  direction: GoalDirection;
  unit?: string;
}

export interface LevelGoalInput {
  kind: 'level';
  options: string[];
  direction: GoalDirection;
}

export interface PassGoalInput {
  kind: 'pass';
  options: string[];
  direction: GoalDirection;
}

export type ExamGoalInput = NumericGoalInput | LevelGoalInput | PassGoalInput;

export interface ExamGoalConfig {
  examCode: string;
  examName: string;
  primaryMetric: GoalMetricType;
  allowedMetrics?: GoalMetricType[];
  input: ExamGoalInput;
  ui: {
    title: string;
    helperText: string;
    quickPicks?: (number | string)[];
  };
  planner: {
    normalizationMode: 'minmax' | 'inverse_minmax' | 'categorical';
  };
}

const catalogEntries = Object.values(examCatalogByCountry).flat();
const firstCatalogByCode = new Map<string, (typeof catalogEntries)[number]>();
for (const entry of catalogEntries) {
  if (!firstCatalogByCode.has(entry.examCode)) firstCatalogByCode.set(entry.examCode, entry);
}

const DERIVED_EXAM_CODES = [
  'gaokao_science',
  'gaokao_humanities',
  'suneung_science',
  'suneung_humanities',
  'baccalaureat_science',
  'baccalaureat_humanities',
  'a_levels_science',
  'a_levels_humanities',
  'ayt_sayisal',
  'ayt_ea',
  'ayt_sozel',
  'tyt_ayt_sayisal',
  'tyt_ayt_ea',
  'tyt_ayt_sozel',
  'kpss_gygk',
  'kpss_egitim',
  'kpss_oabt',
  'kpss_a',
] as const;

export const ALL_EXAM_CODES = Array.from(
  new Set([...firstCatalogByCode.keys(), ...DERIVED_EXAM_CODES])
).sort();

const metricAliases: Record<string, string> = {
  ielts_toefl: 'ielts',
  ucat_bmat: 'ucat',
};

const asRank = (examCode: string, examName: string): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'rank',
  input: { kind: 'numeric', min: 1, max: 1_000_000, step: 1, direction: 'lower_better', unit: 'rank' },
  ui: {
    title: 'What rank are you aiming for?',
    helperText: 'Lower rank means better result for this exam.',
    quickPicks: [1000, 5000, 20000, 50000],
  },
  planner: { normalizationMode: 'inverse_minmax' },
});

const asPercentile = (examCode: string, examName: string): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'percentile',
  input: { kind: 'numeric', min: 1, max: 99, step: 1, direction: 'higher_better', unit: 'percentile' },
  ui: {
    title: 'What percentile are you aiming for?',
    helperText: 'Higher percentile increases competitiveness.',
    quickPicks: [75, 85, 95, 99],
  },
  planner: { normalizationMode: 'minmax' },
});

const asScore = (
  examCode: string,
  examName: string,
  min: number,
  max: number,
  step: number,
  quickPicks: number[]
): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'score',
  input: { kind: 'numeric', min, max, step, direction: 'higher_better', unit: 'score' },
  ui: {
    title: 'What score are you aiming for?',
    helperText: 'One clear target keeps your plan measurable and focused.',
    quickPicks,
  },
  planner: { normalizationMode: 'minmax' },
});

const asBand = (examCode: string, examName: string): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'band',
  input: { kind: 'numeric', min: 0, max: 9, step: 0.5, direction: 'higher_better', unit: 'band' },
  ui: {
    title: 'What band score are you aiming for?',
    helperText: 'Set your target band to calibrate weekly load.',
    quickPicks: [6, 7, 8, 9],
  },
  planner: { normalizationMode: 'minmax' },
});

const asLevel = (examCode: string, examName: string, options: string[]): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'level',
  input: { kind: 'level', options, direction: 'higher_better' },
  ui: {
    title: 'What level are you aiming for?',
    helperText: 'Choose your target proficiency level.',
    quickPicks: options,
  },
  planner: { normalizationMode: 'categorical' },
});

const asGrade = (examCode: string, examName: string, options: string[]): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'grade',
  input: { kind: 'level', options, direction: 'higher_better' },
  ui: {
    title: 'What grade are you aiming for?',
    helperText: 'Choose the grade target for your exam year.',
    quickPicks: options,
  },
  planner: { normalizationMode: 'categorical' },
});

const asPass = (examCode: string, examName: string): ExamGoalConfig => ({
  examCode,
  examName,
  primaryMetric: 'pass',
  input: { kind: 'pass', options: ['Pass'], direction: 'higher_better' },
  ui: {
    title: 'Ready to pass this exam?',
    helperText: 'We will optimize your plan for pass-focused consistency.',
    quickPicks: ['Pass'],
  },
  planner: { normalizationMode: 'categorical' },
});

const buildExamGoalConfig = (examCode: string, examName: string): ExamGoalConfig => {
  switch (examCode) {
    case 'sat': return asScore(examCode, examName, 400, 1600, 10, [1000, 1200, 1400, 1550]);
    case 'act': return asScore(examCode, examName, 1, 36, 1, [24, 28, 32, 35]);
    case 'gre': return asScore(examCode, examName, 260, 340, 1, [300, 315, 325, 335]);
    case 'gmat': return asScore(examCode, examName, 205, 805, 5, [555, 625, 695, 755]);
    case 'lsat': return asScore(examCode, examName, 120, 180, 1, [150, 160, 170, 175]);
    case 'mcat': return asScore(examCode, examName, 472, 528, 1, [500, 508, 515, 522]);
    case 'toefl': return asScore(examCode, examName, 0, 120, 1, [80, 90, 100, 110]);
    case 'ielts': return asBand(examCode, examName);
    case 'cat': {
      const config = asPercentile(examCode, examName);
      return { ...config, allowedMetrics: ['percentile', 'score'] };
    }
    case 'gate': {
      const config = asScore(examCode, examName, 0, 100, 1, [45, 60, 75, 90]);
      return { ...config, allowedMetrics: ['score', 'rank'] };
    }
    case 'yds': return asScore(examCode, examName, 0, 100, 1, [60, 70, 80, 90]);
    case 'ales': return asScore(examCode, examName, 50, 100, 1, [70, 80, 90, 95]);
    case 'kpss':
    case 'kpss_gygk':
    case 'kpss_egitim':
    case 'kpss_oabt':
    case 'kpss_a':
      return asScore(examCode, examName, 0, 100, 1, [65, 75, 85, 92]);
    case 'qudrat': return asScore(examCode, examName, 0, 100, 1, [60, 70, 80, 90]);
    case 'tahsili': return asScore(examCode, examName, 0, 100, 1, [65, 75, 85, 95]);
    case 'gaokao':
    case 'gaokao_science':
    case 'gaokao_humanities': {
      const config = asRank(examCode, examName);
      return { ...config, allowedMetrics: ['rank', 'score'] };
    }
    case 'jee': return asRank(examCode, examName);
    case 'neet': return asRank(examCode, examName);
    case 'upsc': return asRank(examCode, examName);
    case 'tyt':
    case 'ayt_sayisal':
    case 'ayt_ea':
    case 'ayt_sozel':
    case 'tyt_ayt_sayisal':
    case 'tyt_ayt_ea':
    case 'tyt_ayt_sozel':
    case 'ydt_tr':
      return asRank(examCode, examName);
    case 'utbk_snbt': {
      const config = asRank(examCode, examName);
      return { ...config, allowedMetrics: ['rank', 'score'] };
    }
    case 'concours_ge':
    case 'polytechnique_track':
    case 'insp_ena':
    case 'nc_track':
    case 'civil_service_jp':
    case 'todai_exam':
    case 'vestibular':
      return asRank(examCode, examName);
    case 'hsk': return asLevel(examCode, examName, ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6']);
    case 'jlpt': return asLevel(examCode, examName, ['N5', 'N4', 'N3', 'N2', 'N1']);
    case 'topik': return asLevel(examCode, examName, ['TOPIK I', 'TOPIK II', 'TOPIK III', 'TOPIK IV', 'TOPIK V', 'TOPIK VI']);
    case 'testdaf': return asLevel(examCode, examName, ['TDN 3', 'TDN 4', 'TDN 5']);
    case 'delf_dalf': return asLevel(examCode, examName, ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    case 'a_levels':
    case 'a_levels_science':
    case 'a_levels_humanities':
      return asGrade(examCode, examName, ['E', 'D', 'C', 'B', 'A', 'A*']);
    case 'abitur': return asGrade(examCode, examName, ['Satisfactory', 'Good', 'Very Good', 'Excellent']);
    case 'baccalaureat':
    case 'baccalaureat_science':
    case 'baccalaureat_humanities':
      return asGrade(examCode, examName, ['Passable', 'Assez bien', 'Bien', 'Tres bien']);
    case 'suneung':
    case 'suneung_science':
    case 'suneung_humanities':
      return asGrade(examCode, examName, ['Grade 5', 'Grade 4', 'Grade 3', 'Grade 2', 'Grade 1']);
    case 'common_test_jp':
      return asPercentile(examCode, examName);
    case 'lnat':
      return asScore(examCode, examName, 0, 42, 1, [18, 24, 30, 36]);
    case 'ucat':
      return asScore(examCode, examName, 1200, 3600, 10, [2400, 2700, 3000, 3200]);
    case 'psat_kr':
    case 'gsat':
    case 'cpns':
    case 'enem':
    case 'enade':
    case 'guokao':
    case 'tus':
    case 'dus':
    case 'kaoyan':
      return asScore(examCode, examName, 0, 100, 1, [60, 70, 80, 90]);
    case 'bar_cn':
    case 'bar_jp':
    case 'bar_kr':
    case 'bar_sa':
    case 'ca_final':
    case 'cma_sa':
    case 'cpa_ca':
    case 'cpa_cn':
    case 'cpa_id':
    case 'crfpa':
    case 'mccqe':
    case 'med_lic_jp':
    case 'med_lic_kr':
    case 'nca_bar':
    case 'oab':
    case 'scfhs':
    case 'sqe':
    case 'staatsexamen':
    case 'steuerberater':
    case 'ukmppd':
    case 'usmle':
    case 'zweites_staatsexamen':
    case 'acca_icaew':
      return asPass(examCode, examName);
    default:
      return asScore(examCode, examName, 0, 100, 1, [60, 70, 80, 90]);
  }
};

export const examGoalConfigs: Record<string, ExamGoalConfig> = ALL_EXAM_CODES.reduce<Record<string, ExamGoalConfig>>(
  (acc, examCode) => {
    const source = firstCatalogByCode.get(examCode);
    const examName = source?.examName ?? examCode.toUpperCase();
    acc[examCode] = buildExamGoalConfig(examCode, examName);
    return acc;
  },
  {}
);

export const getExamGoalConfig = (examCode?: string | null): ExamGoalConfig | null => {
  if (!examCode) return null;
  const normalized = examCode.toLowerCase();
  const aliased = metricAliases[normalized] ?? normalized;
  return examGoalConfigs[aliased] ?? null;
};
