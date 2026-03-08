import { getExamGoalConfig, type ExamGoalConfig, type GoalMetricType } from '@/app/data/examGoalConfigs';

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const normalizeCategorical = (value: string, options: string[]): number => {
  if (!options.length) return 0;
  const idx = options.indexOf(value);
  if (idx < 0) return 0;
  if (options.length === 1) return 1;
  return clamp01(idx / (options.length - 1));
};

export const normalizeTargetValue = (config: ExamGoalConfig | null, rawValue: string): number => {
  if (!config || !rawValue?.trim()) return 0;

  if (config.input.kind === 'numeric') {
    const num = Number(rawValue);
    if (Number.isNaN(num)) return 0;
    const min = config.input.min;
    const max = config.input.max;
    if (max <= min) return 0;

    const bounded = Math.max(min, Math.min(max, num));
    const ratio = (bounded - min) / (max - min);
    if (config.input.direction === 'lower_better') return clamp01(1 - ratio);
    return clamp01(ratio);
  }

  if (config.input.kind === 'level' || config.input.kind === 'pass') {
    return normalizeCategorical(rawValue, config.input.options);
  }

  return 0;
};

export const resolveTargetModel = (
  examId?: string | null,
  rawValue?: string | null
): {
  metricType: GoalMetricType;
  raw: string;
  normalized: number;
} => {
  const config = getExamGoalConfig(examId);
  const fallbackRaw = rawValue?.trim() || '';
  const metricType: GoalMetricType = config?.primaryMetric ?? 'score';

  if (config?.input.kind === 'pass' && !fallbackRaw) {
    const passValue = config.input.options[0] ?? 'Pass';
    return {
      metricType,
      raw: passValue,
      normalized: normalizeTargetValue(config, passValue),
    };
  }

  return {
    metricType,
    raw: fallbackRaw,
    normalized: normalizeTargetValue(config, fallbackRaw),
  };
};
