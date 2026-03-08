import type { SupportedLanguage } from '@/app/i18n';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import type { StudyTask } from '@/app/utils/studyTypes';

type TaskType = StudyTask['type'];
type TaskPhase = NonNullable<StudyTask['phase']>;

const TASK_COPY: Record<SupportedLanguage, {
  type: Record<TaskType, string>;
  phase: Record<TaskPhase, string>;
  title: (subject: string, type: string) => string;
  description: (phase: string, type: string, subject: string) => string;
}> = {
  en: {
    type: { study: 'Study', practice: 'Practice', review: 'Review', quiz: 'Quiz' },
    phase: { foundation: 'Foundation', build: 'Build', consolidation: 'Consolidation', final: 'Final' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `${phase} phase ${type.toLowerCase()} block for ${subject}.`,
  },
  tr: {
    type: { study: 'Çalışma', practice: 'Pratik', review: 'Tekrar', quiz: 'Test' },
    phase: { foundation: 'Temel', build: 'Gelişim', consolidation: 'Pekiştirme', final: 'Final' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `${subject} için ${phase.toLowerCase()} aşaması ${type.toLowerCase()} bloğu.`,
  },
  de: {
    type: { study: 'Lernen', practice: 'Praxis', review: 'Wiederholung', quiz: 'Check' },
    phase: { foundation: 'Grundlage', build: 'Aufbau', consolidation: 'Festigung', final: 'Finale' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `${phase}-Phase: ${type} fuer ${subject}.`,
  },
  fr: {
    type: { study: 'Étude', practice: 'Pratique', review: 'Révision', quiz: 'Quiz' },
    phase: { foundation: 'Base', build: 'Montée', consolidation: 'Consolidation', final: 'Final' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `Bloc ${type.toLowerCase()} pour ${subject} pendant la phase ${phase.toLowerCase()}.`,
  },
  ja: {
    type: { study: '学習', practice: '演習', review: '復習', quiz: '確認' },
    phase: { foundation: '基礎', build: '強化', consolidation: '定着', final: '直前' },
    title: (subject, type) => `${subject}・${type}`,
    description: (phase, type, subject) => `${phase}フェーズの${subject} ${type}ブロック。`,
  },
  ko: {
    type: { study: '학습', practice: '연습', review: '복습', quiz: '점검' },
    phase: { foundation: '기초', build: '강화', consolidation: '정착', final: '파이널' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `${phase} 단계의 ${subject} ${type} 블록.`,
  },
  'zh-Hans': {
    type: { study: '学习', practice: '练习', review: '复习', quiz: '测验' },
    phase: { foundation: '基础', build: '强化', consolidation: '巩固', final: '冲刺' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `${phase}阶段的${subject}${type}模块。`,
  },
  ar: {
    type: { study: 'مذاكرة', practice: 'تدريب', review: 'مراجعة', quiz: 'اختبار' },
    phase: { foundation: 'الأساس', build: 'البناء', consolidation: 'التثبيت', final: 'النهائي' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `كتلة ${type} لمادة ${subject} في مرحلة ${phase}.`,
  },
  hi: {
    type: { study: 'अध्ययन', practice: 'अभ्यास', review: 'दोहराव', quiz: 'क्विज़' },
    phase: { foundation: 'बुनियाद', build: 'निर्माण', consolidation: 'मज़बूती', final: 'अंतिम' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `${subject} के लिए ${phase} चरण का ${type} ब्लॉक।`,
  },
  id: {
    type: { study: 'Belajar', practice: 'Latihan', review: 'Tinjauan', quiz: 'Kuis' },
    phase: { foundation: 'Dasar', build: 'Penguatan', consolidation: 'Konsolidasi', final: 'Final' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `Blok ${type.toLowerCase()} untuk ${subject} pada fase ${phase.toLowerCase()}.`,
  },
  'pt-BR': {
    type: { study: 'Estudo', practice: 'Prática', review: 'Revisão', quiz: 'Quiz' },
    phase: { foundation: 'Base', build: 'Construção', consolidation: 'Consolidação', final: 'Final' },
    title: (subject, type) => `${subject} · ${type}`,
    description: (phase, type, subject) => `Bloco de ${type.toLowerCase()} para ${subject} na fase ${phase.toLowerCase()}.`,
  },
};

const getTaskCopy = (lang: SupportedLanguage) => TASK_COPY[lang] ?? TASK_COPY.en;

export const getLocalizedTaskTypeLabel = (type: string, lang: SupportedLanguage): string => {
  const normalized = (type || 'study').toLowerCase() as TaskType;
  return getTaskCopy(lang).type[normalized] ?? type;
};

export const getLocalizedTaskTitle = (
  task: Pick<StudyTask, 'subject' | 'type'>,
  lang: SupportedLanguage,
  examCode?: string | null
): string => {
  const copy = getTaskCopy(lang);
  const subject = getLocalizedSubjectName(task.subject, lang, task.subject, { examCode });
  const type = getLocalizedTaskTypeLabel(task.type, lang);
  return copy.title(subject, type);
};

export const getLocalizedTaskDescription = (
  task: Pick<StudyTask, 'subject' | 'type' | 'phase'>,
  lang: SupportedLanguage,
  examCode?: string | null
): string => {
  const copy = getTaskCopy(lang);
  const subject = getLocalizedSubjectName(task.subject, lang, task.subject, { examCode });
  const type = getLocalizedTaskTypeLabel(task.type, lang);
  const phase = copy.phase[(task.phase ?? 'build') as TaskPhase] ?? copy.phase.build;
  return copy.description(phase, type, subject);
};
