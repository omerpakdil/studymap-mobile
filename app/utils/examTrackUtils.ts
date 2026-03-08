export type TrackId =
  | 'sayisal'
  | 'ea'
  | 'sozel'
  | 'gygk'
  | 'egitim'
  | 'oabt'
  | 'a'
  | 'science'
  | 'humanities';

export interface ExamTrackOption {
  id: TrackId;
  examCode: string;
  labelKey: string;
}

export interface ExamTrackConfig {
  titleKey: string;
  subtitleKey: string;
  alertTitleKey?: string;
  alertBodyKey?: string;
  options: ExamTrackOption[];
}

export const EXAM_TRACK_CONFIGS: Record<string, ExamTrackConfig> = {
  ayt: {
    titleKey: 'onboarding.goal_exam.track_title',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_ayt',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body',
    options: [
      { id: 'sayisal', examCode: 'ayt_sayisal', labelKey: 'onboarding.goal_exam.track_sayisal' },
      { id: 'ea', examCode: 'ayt_ea', labelKey: 'onboarding.goal_exam.track_ea' },
      { id: 'sozel', examCode: 'ayt_sozel', labelKey: 'onboarding.goal_exam.track_sozel' },
    ],
  },
  tyt_ayt: {
    titleKey: 'onboarding.goal_exam.track_title',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_tyt_ayt',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body',
    options: [
      { id: 'sayisal', examCode: 'tyt_ayt_sayisal', labelKey: 'onboarding.goal_exam.track_sayisal' },
      { id: 'ea', examCode: 'tyt_ayt_ea', labelKey: 'onboarding.goal_exam.track_ea' },
      { id: 'sozel', examCode: 'tyt_ayt_sozel', labelKey: 'onboarding.goal_exam.track_sozel' },
    ],
  },
  kpss: {
    titleKey: 'onboarding.goal_exam.track_title_kpss',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_kpss',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body',
    options: [
      { id: 'gygk', examCode: 'kpss_gygk', labelKey: 'onboarding.goal_exam.track_gygk' },
      { id: 'egitim', examCode: 'kpss_egitim', labelKey: 'onboarding.goal_exam.track_egitim' },
      { id: 'oabt', examCode: 'kpss_oabt', labelKey: 'onboarding.goal_exam.track_oabt' },
      { id: 'a', examCode: 'kpss_a', labelKey: 'onboarding.goal_exam.track_a' },
    ],
  },
  gaokao: {
    titleKey: 'onboarding.goal_exam.track_title_gaokao',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_gaokao',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title_stream',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body_stream',
    options: [
      { id: 'science', examCode: 'gaokao_science', labelKey: 'onboarding.goal_exam.track_gaokao_science' },
      { id: 'humanities', examCode: 'gaokao_humanities', labelKey: 'onboarding.goal_exam.track_gaokao_humanities' },
    ],
  },
  suneung: {
    titleKey: 'onboarding.goal_exam.track_title_suneung',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_suneung',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title_stream',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body_stream',
    options: [
      { id: 'science', examCode: 'suneung_science', labelKey: 'onboarding.goal_exam.track_suneung_science' },
      { id: 'humanities', examCode: 'suneung_humanities', labelKey: 'onboarding.goal_exam.track_suneung_humanities' },
    ],
  },
  baccalaureat: {
    titleKey: 'onboarding.goal_exam.track_title_baccalaureat',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_baccalaureat',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title_stream',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body_stream',
    options: [
      {
        id: 'science',
        examCode: 'baccalaureat_science',
        labelKey: 'onboarding.goal_exam.track_baccalaureat_science',
      },
      {
        id: 'humanities',
        examCode: 'baccalaureat_humanities',
        labelKey: 'onboarding.goal_exam.track_baccalaureat_humanities',
      },
    ],
  },
  a_levels: {
    titleKey: 'onboarding.goal_exam.track_title_a_levels',
    subtitleKey: 'onboarding.goal_exam.track_subtitle_a_levels',
    alertTitleKey: 'onboarding.goal_exam.track_alert_title_stream',
    alertBodyKey: 'onboarding.goal_exam.track_alert_body_stream',
    options: [
      { id: 'science', examCode: 'a_levels_science', labelKey: 'onboarding.goal_exam.track_a_levels_science' },
      {
        id: 'humanities',
        examCode: 'a_levels_humanities',
        labelKey: 'onboarding.goal_exam.track_a_levels_humanities',
      },
    ],
  },
};

export const getBaseExamId = (examId?: string | null): string => {
  if (!examId) return '';
  if (examId.startsWith('tyt_ayt_')) return 'tyt_ayt';
  if (examId.startsWith('ayt_')) return 'ayt';
  if (examId.startsWith('kpss_')) return 'kpss';
  if (examId.startsWith('gaokao_')) return 'gaokao';
  if (examId.startsWith('suneung_')) return 'suneung';
  if (examId.startsWith('baccalaureat_')) return 'baccalaureat';
  if (examId.startsWith('a_levels_')) return 'a_levels';
  return examId;
};

export const getExamTrackConfig = (examId?: string | null): ExamTrackConfig | null => {
  const baseExamId = getBaseExamId(examId);
  return EXAM_TRACK_CONFIGS[baseExamId] ?? null;
};

export const examRequiresTrack = (examId?: string | null): boolean => Boolean(getExamTrackConfig(examId));

export const getTrackFromExamId = (examId?: string | null): TrackId | null => {
  if (!examId) return null;
  const config = getExamTrackConfig(examId);
  if (!config) return null;
  const matched = config.options.find((option) => option.examCode === examId);
  return matched?.id ?? null;
};

export const buildFinalExamId = (baseExamId: string, trackId: TrackId): string => {
  const config = getExamTrackConfig(baseExamId);
  if (!config) return baseExamId;
  return config.options.find((option) => option.id === trackId)?.examCode ?? baseExamId;
};

export const getExamTrackOptions = (baseExamId: string): ExamTrackOption[] => {
  return getExamTrackConfig(baseExamId)?.options ?? [];
};
