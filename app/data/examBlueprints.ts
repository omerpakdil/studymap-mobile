export type SessionType = 'study' | 'review' | 'practice' | 'quiz' | 'mock';

export interface ExamSubjectBlueprint {
  id: string;
  label: string;
  weight: number;
  intensityBias?: number; // -0.3..+0.3, planner can push/pull load by subject complexity
  modules: string[]; // granular content clusters used by generator
  focusSkills: string[]; // execution style hints for planner
}

export interface ExamBlueprint {
  examCode: string;
  subjects: ExamSubjectBlueprint[];
  sessionTypes: SessionType[];
  weeklyRules: {
    minHours: number;
    maxHours: number;
    minReviewRatio: number;
    mockFrequencyDays: number;
    recommendedSessionMinutes: [number, number];
  };
  difficultyCurve: {
    foundationWeeks: number;
    buildWeeks: number;
    peakWeeks: number;
  };
}

const commonRules = {
  minHours: 4,
  maxHours: 16,
  minReviewRatio: 0.25,
  mockFrequencyDays: 14,
  recommendedSessionMinutes: [45, 90] as [number, number],
};

const languageRules = {
  minHours: 3,
  maxHours: 12,
  minReviewRatio: 0.35,
  mockFrequencyDays: 10,
  recommendedSessionMinutes: [35, 75] as [number, number],
};

const professionalRules = {
  minHours: 5,
  maxHours: 18,
  minReviewRatio: 0.3,
  mockFrequencyDays: 12,
  recommendedSessionMinutes: [50, 95] as [number, number],
};

const defaultCurve = {
  foundationWeeks: 3,
  buildWeeks: 6,
  peakWeeks: 3,
};

const s = (
  id: string,
  label: string,
  weight: number,
  modules: string[],
  focusSkills: string[],
  intensityBias = 0
): ExamSubjectBlueprint => ({ id, label, weight, modules, focusSkills, intensityBias });

export const examBlueprints: Record<string, ExamBlueprint> = {
  sat: {
    examCode: 'sat',
    subjects: [
      s('math', 'Math', 0.4, ['algebra', 'advanced_math', 'problem_solving', 'data_analysis', 'geometry_trig'], ['speed_accuracy', 'multi_step_reasoning'], 0.15),
      s('reading', 'Reading', 0.3, ['passage_comprehension', 'evidence_questions', 'inference', 'author_tone'], ['critical_reading', 'time_management'], 0.05),
      s('writing', 'Writing', 0.3, ['grammar_conventions', 'sentence_structure', 'rhetorical_skills'], ['error_detection', 'editing_accuracy'], 0.05),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  gre: {
    examCode: 'gre',
    subjects: [
      s('quant', 'Quantitative', 0.4, ['arithmetic', 'algebra', 'geometry', 'data_interpretation'], ['reasoning', 'calculation_accuracy'], 0.15),
      s('verbal', 'Verbal', 0.4, ['text_completion', 'sentence_equivalence', 'reading_comprehension'], ['vocabulary', 'context_reasoning'], 0.1),
      s('awa', 'Analytical Writing', 0.2, ['issue_task', 'argument_task', 'essay_structure'], ['argumentation', 'clarity'], 0.05),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  toefl: {
    examCode: 'toefl',
    subjects: [
      s('reading', 'Reading', 0.25, ['academic_passages', 'vocabulary_in_context', 'reference_questions'], ['comprehension', 'speed_scanning']),
      s('listening', 'Listening', 0.25, ['lectures', 'conversations', 'note_taking'], ['active_listening', 'detail_capture'], 0.05),
      s('speaking', 'Speaking', 0.25, ['independent_tasks', 'integrated_tasks', 'fluency_control'], ['fluency', 'coherence'], 0.1),
      s('writing', 'Writing', 0.25, ['integrated_writing', 'independent_writing', 'structure_revision'], ['organization', 'grammar_accuracy'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  ielts: {
    examCode: 'ielts',
    subjects: [
      s('reading', 'Reading', 0.25, ['matching_headings', 'true_false_not_given', 'summary_completion'], ['skimming_scanning', 'detail_check']),
      s('listening', 'Listening', 0.25, ['section_1_4_strategies', 'map_labeling', 'note_completion'], ['note_taking', 'anticipation']),
      s('speaking', 'Speaking', 0.25, ['part_1_intro', 'part_2_cue_card', 'part_3_discussion'], ['fluency', 'lexical_range'], 0.1),
      s('writing', 'Writing', 0.25, ['task_1_visuals', 'task_2_argument', 'cohesion_coherence'], ['task_response', 'grammar_control'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  gmat: {
    examCode: 'gmat',
    subjects: [
      s('quant', 'Quantitative', 0.4, ['number_properties', 'algebra', 'word_problems'], ['decision_speed', 'precision'], 0.15),
      s('verbal', 'Verbal', 0.35, ['critical_reasoning', 'reading_comprehension'], ['argument_analysis', 'evidence_parsing'], 0.1),
      s('di', 'Data Insights', 0.25, ['data_sufficiency', 'table_graph_analysis', 'two_part_analysis'], ['data_reasoning', 'logic_filtering'], 0.15),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  lsat: {
    examCode: 'lsat',
    subjects: [
      s('lr', 'Logical Reasoning', 0.45, ['argument_core', 'assumption', 'strengthen_weaken', 'flaw_questions'], ['logic_precision', 'pattern_recognition'], 0.15),
      s('ar', 'Analytical Reasoning', 0.2, ['grouping_games', 'ordering_games', 'hybrid_games'], ['diagramming', 'constraint_tracking'], 0.1),
      s('rc', 'Reading Comprehension', 0.35, ['comparative_reading', 'law_passages', 'science_passages'], ['deep_comprehension', 'inference']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },

  gaokao: {
    examCode: 'gaokao',
    subjects: [
      s('chinese', 'Chinese', 0.2, ['modern_text', 'classical_text', 'writing'], ['comprehension', 'expression']),
      s('math', 'Math', 0.2, ['algebra', 'functions', 'geometry', 'probability'], ['problem_solving', 'accuracy'], 0.1),
      s('english', 'English', 0.2, ['reading', 'grammar', 'writing'], ['language_accuracy', 'speed']),
      s('track_subjects', 'Track Subjects', 0.4, ['physics_chem_bio_or_history_geo_politics'], ['subject_mastery', 'memory_recall'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  gaokao_science: {
    examCode: 'gaokao_science',
    subjects: [
      s('chinese', 'Chinese', 0.2, ['modern_text', 'classical_text', 'writing'], ['comprehension', 'expression']),
      s('math', 'Math', 0.2, ['algebra', 'functions', 'geometry', 'probability'], ['problem_solving', 'accuracy'], 0.1),
      s('english', 'English', 0.2, ['reading', 'grammar', 'writing'], ['language_accuracy', 'speed']),
      s('physics', 'Physics', 0.14, ['mechanics', 'electricity', 'modern_physics'], ['analysis', 'application'], 0.1),
      s('chemistry', 'Chemistry', 0.13, ['organic', 'inorganic', 'physical'], ['concept_linking', 'recall']),
      s('biology', 'Biology', 0.13, ['cell', 'physiology', 'genetics'], ['detail_recall', 'concept_linking']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  gaokao_humanities: {
    examCode: 'gaokao_humanities',
    subjects: [
      s('chinese', 'Chinese', 0.22, ['modern_text', 'classical_text', 'writing'], ['comprehension', 'expression']),
      s('math', 'Math', 0.18, ['algebra', 'functions', 'geometry', 'probability'], ['problem_solving', 'accuracy'], 0.08),
      s('english', 'English', 0.2, ['reading', 'grammar', 'writing'], ['language_accuracy', 'speed']),
      s('history', 'History', 0.14, ['modern_history', 'world_history', 'analysis'], ['recall', 'timeline_reasoning']),
      s('geography', 'Geography', 0.13, ['physical_geo', 'human_geo', 'map_reading'], ['pattern_recognition', 'application']),
      s('politics', 'Politics', 0.13, ['theory', 'current_affairs', 'essay_logic'], ['concept_linking', 'argumentation']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  kaoyan: {
    examCode: 'kaoyan',
    subjects: [
      s('politics', 'Politics', 0.2, ['theory', 'contemporary_topics', 'essay'], ['concept_linking', 'recall']),
      s('english', 'English', 0.25, ['reading', 'translation', 'writing'], ['context_reasoning', 'academic_writing']),
      s('math_or_core', 'Math/Core', 0.25, ['core_problem_sets', 'formula_application'], ['precision', 'method_selection'], 0.1),
      s('major', 'Major Subject', 0.3, ['discipline_modules', 'past_papers'], ['domain_mastery', 'synthesis'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  guokao: {
    examCode: 'guokao',
    subjects: [
      s('aptitude', 'Administrative Aptitude', 0.6, ['verbal', 'quant', 'logic', 'data'], ['speed_reasoning', 'decision_quality'], 0.15),
      s('essay', 'Essay/Policy', 0.4, ['policy_analysis', 'structured_writing'], ['argument_structure', 'clarity']),
    ],
    sessionTypes: ['study', 'review', 'practice'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  hsk: {
    examCode: 'hsk',
    subjects: [
      s('listening', 'Listening', 0.3, ['dialogues', 'lectures', 'keywords'], ['audio_comprehension', 'speed']),
      s('reading', 'Reading', 0.35, ['characters', 'long_texts', 'inference'], ['reading_depth', 'vocab_range']),
      s('writing', 'Writing', 0.35, ['sentence_order', 'short_essay', 'grammar_output'], ['written_accuracy', 'cohesion'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'quiz'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  common_test_jp: {
    examCode: 'common_test_jp',
    subjects: [
      s('japanese', 'Japanese', 0.25, ['modern', 'classical', 'grammar'], ['text_analysis', 'precision']),
      s('math', 'Math', 0.25, ['algebra', 'calculus_basics', 'data'], ['calculation_accuracy', 'problem_solving'], 0.1),
      s('english', 'English', 0.2, ['reading', 'listening'], ['comprehension', 'time_control']),
      s('science_social', 'Science/Social', 0.3, ['elective_tracks', 'past_items'], ['recall', 'application']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  jlpt: {
    examCode: 'jlpt',
    subjects: [
      s('vocab_kanji', 'Vocabulary/Kanji', 0.35, ['core_kanji', 'vocab_sets'], ['retention', 'recognition']),
      s('grammar_reading', 'Grammar/Reading', 0.35, ['grammar_patterns', 'long_reading'], ['pattern_spotting', 'deep_reading']),
      s('listening', 'Listening', 0.3, ['dialogue_comprehension', 'inference_audio'], ['audio_focus', 'context_guessing']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'quiz'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  jee: {
    examCode: 'jee',
    subjects: [
      s('physics', 'Physics', 0.33, ['mechanics', 'electricity', 'modern_physics'], ['problem_solving', 'formula_application'], 0.1),
      s('chemistry', 'Chemistry', 0.33, ['physical', 'organic', 'inorganic'], ['concept_linking', 'memory']),
      s('math', 'Math', 0.34, ['algebra', 'calculus', 'coordinate_geometry'], ['multi_step_reasoning', 'accuracy'], 0.15),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  neet: {
    examCode: 'neet',
    subjects: [
      s('physics', 'Physics', 0.25, ['mechanics', 'electrodynamics', 'modern'], ['numerical_speed', 'concept_accuracy'], 0.1),
      s('chemistry', 'Chemistry', 0.25, ['physical', 'organic', 'inorganic'], ['reaction_logic', 'recall']),
      s('biology', 'Biology', 0.5, ['botany', 'zoology', 'human_physiology', 'genetics'], ['detail_recall', 'diagram_reasoning'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  enem: {
    examCode: 'enem',
    subjects: [
      s('languages', 'Languages', 0.2, ['portuguese', 'foreign_language', 'text_interpretation'], ['comprehension', 'language_accuracy']),
      s('human_sciences', 'Human Sciences', 0.2, ['history', 'geography', 'sociology', 'philosophy'], ['analysis', 'context_reasoning']),
      s('natural_sciences', 'Natural Sciences', 0.2, ['physics', 'chemistry', 'biology'], ['application', 'data_reading']),
      s('math', 'Math', 0.2, ['arithmetic', 'algebra', 'functions'], ['quant_reasoning', 'speed']),
      s('essay', 'Essay', 0.2, ['argument_structure', 'intervention_proposal'], ['writing_coherence', 'thesis_clarity'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  suneung: {
    examCode: 'suneung',
    subjects: [
      s('korean', 'Korean', 0.2, ['reading', 'literature', 'grammar'], ['text_analysis', 'precision']),
      s('math', 'Math', 0.25, ['algebra', 'calculus', 'probability'], ['accuracy', 'speed_reasoning'], 0.1),
      s('english', 'English', 0.2, ['reading', 'listening', 'vocab'], ['comprehension', 'timing']),
      s('electives', 'Electives', 0.35, ['science_or_social_tracks'], ['domain_mastery', 'retention']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  suneung_science: {
    examCode: 'suneung_science',
    subjects: [
      s('korean', 'Korean', 0.2, ['reading', 'literature', 'grammar'], ['text_analysis', 'precision']),
      s('math', 'Math', 0.24, ['algebra', 'calculus', 'probability'], ['accuracy', 'speed_reasoning'], 0.1),
      s('english', 'English', 0.18, ['reading', 'listening', 'vocab'], ['comprehension', 'timing']),
      s('physics', 'Physics', 0.13, ['mechanics', 'electricity', 'modern_physics'], ['analysis', 'application'], 0.1),
      s('chemistry', 'Chemistry', 0.13, ['organic', 'inorganic', 'physical'], ['concept_linking', 'recall']),
      s('biology', 'Biology', 0.12, ['cell', 'physiology', 'genetics'], ['detail_recall', 'concept_linking']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  suneung_humanities: {
    examCode: 'suneung_humanities',
    subjects: [
      s('korean', 'Korean', 0.22, ['reading', 'literature', 'grammar'], ['text_analysis', 'precision']),
      s('math', 'Math', 0.2, ['algebra', 'calculus', 'probability'], ['accuracy', 'speed_reasoning'], 0.08),
      s('english', 'English', 0.18, ['reading', 'listening', 'vocab'], ['comprehension', 'timing']),
      s('history', 'History', 0.14, ['modern_history', 'world_history', 'analysis'], ['recall', 'timeline_reasoning']),
      s('geography', 'Geography', 0.13, ['physical_geo', 'human_geo', 'map_reading'], ['pattern_recognition', 'application']),
      s('politics', 'Politics', 0.13, ['theory', 'current_affairs', 'essay_logic'], ['concept_linking', 'argumentation']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  abitur: {
    examCode: 'abitur',
    subjects: [
      s('german', 'German', 0.25, ['literature', 'analysis', 'essay'], ['writing_clarity', 'interpretation']),
      s('math', 'Math', 0.25, ['algebra', 'analysis', 'stochastics'], ['structured_solving', 'accuracy'], 0.1),
      s('foreign_language', 'Foreign Language', 0.2, ['reading', 'listening', 'writing'], ['communication', 'grammar']),
      s('electives', 'Electives', 0.3, ['state_specific_subjects'], ['content_mastery', 'exam_strategy']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  testdaf: {
    examCode: 'testdaf',
    subjects: [
      s('reading', 'Reading', 0.25, ['academic_texts', 'inference', 'matching'], ['deep_reading', 'time_control']),
      s('listening', 'Listening', 0.25, ['lectures', 'note_capture'], ['audio_focus', 'detail_retention']),
      s('writing', 'Writing', 0.25, ['argument', 'graph_description'], ['structure', 'accuracy']),
      s('speaking', 'Speaking', 0.25, ['task_response', 'academic_expression'], ['fluency', 'coherence'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'quiz'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  a_levels: {
    examCode: 'a_levels',
    subjects: [
      s('subject_1', 'Primary Subject 1', 0.34, ['paper_1', 'paper_2', 'coursework_if_any'], ['depth_mastery', 'exam_technique']),
      s('subject_2', 'Primary Subject 2', 0.33, ['paper_1', 'paper_2', 'application_questions'], ['conceptual_accuracy', 'timing']),
      s('subject_3', 'Primary Subject 3', 0.33, ['paper_1', 'paper_2', 'extended_response'], ['reasoning', 'clarity']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  a_levels_science: {
    examCode: 'a_levels_science',
    subjects: [
      s('math', 'Math', 0.34, ['pure_math', 'mechanics', 'statistics'], ['reasoning', 'accuracy'], 0.12),
      s('physics', 'Physics', 0.33, ['mechanics', 'electricity', 'practical'], ['analysis', 'application'], 0.1),
      s('chemistry', 'Chemistry', 0.33, ['organic', 'inorganic', 'physical'], ['concept_linking', 'recall']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  a_levels_humanities: {
    examCode: 'a_levels_humanities',
    subjects: [
      s('literature', 'Literature', 0.34, ['poetry', 'drama', 'prose'], ['analysis', 'writing_clarity']),
      s('history', 'History', 0.33, ['source_analysis', 'essay_planning', 'period_depth'], ['recall', 'argumentation']),
      s('geography', 'Geography', 0.33, ['human_geo', 'physical_geo', 'case_studies'], ['pattern_recognition', 'application']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  utbk_snbt: {
    examCode: 'utbk_snbt',
    subjects: [
      s('aptitude', 'Aptitude', 0.35, ['reasoning', 'problem_solving'], ['logic_speed', 'decision_quality'], 0.1),
      s('literacy', 'Literacy', 0.35, ['reading_literacy', 'context_questions'], ['comprehension', 'inference']),
      s('numeracy', 'Numeracy', 0.3, ['arithmetic', 'data', 'applied_math'], ['quant_reasoning', 'accuracy'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  baccalaureat: {
    examCode: 'baccalaureat',
    subjects: [
      s('french', 'French', 0.25, ['text_commentary', 'essay', 'oral'], ['analysis', 'expression']),
      s('philosophy', 'Philosophy', 0.2, ['concepts', 'argumentative_essay'], ['critical_thinking', 'essay_logic'], 0.1),
      s('specialties', 'Specialties', 0.35, ['stream_specific_topics'], ['domain_depth', 'application']),
      s('oral_written', 'Oral/Written', 0.2, ['grand_oral', 'exam_composition'], ['presentation', 'clarity']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  baccalaureat_science: {
    examCode: 'baccalaureat_science',
    subjects: [
      s('french', 'French', 0.22, ['text_commentary', 'essay', 'oral'], ['analysis', 'expression']),
      s('philosophy', 'Philosophy', 0.16, ['concepts', 'argumentative_essay'], ['critical_thinking', 'essay_logic'], 0.08),
      s('math', 'Math', 0.2, ['algebra', 'analysis', 'probability'], ['reasoning', 'accuracy'], 0.1),
      s('physics', 'Physics', 0.14, ['mechanics', 'electricity', 'modern_physics'], ['analysis', 'application'], 0.1),
      s('chemistry', 'Chemistry', 0.14, ['organic', 'inorganic', 'physical'], ['concept_linking', 'recall']),
      s('oral_written', 'Oral/Written', 0.14, ['grand_oral', 'exam_composition'], ['presentation', 'clarity']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  baccalaureat_humanities: {
    examCode: 'baccalaureat_humanities',
    subjects: [
      s('french', 'French', 0.24, ['text_commentary', 'essay', 'oral'], ['analysis', 'expression']),
      s('philosophy', 'Philosophy', 0.2, ['concepts', 'argumentative_essay'], ['critical_thinking', 'essay_logic'], 0.1),
      s('history', 'History', 0.16, ['modern_history', 'world_history', 'analysis'], ['recall', 'timeline_reasoning']),
      s('geography', 'Geography', 0.14, ['physical_geo', 'human_geo', 'map_reading'], ['pattern_recognition', 'application']),
      s('oral_written', 'Oral/Written', 0.14, ['grand_oral', 'exam_composition'], ['presentation', 'clarity']),
      s('specialties', 'Specialties', 0.12, ['humanities_specialty_topics'], ['domain_depth', 'argumentation']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  tyt: {
    examCode: 'tyt',
    subjects: [
      s('turkish', 'Turkish', 0.3, ['paragraph', 'grammar', 'meaning'], ['speed', 'reading_accuracy']),
      s('math', 'Mathematics', 0.3, ['problem_solving', 'basic_algebra', 'geometry'], ['problem_solving', 'accuracy'], 0.1),
      s('social', 'Social Sciences', 0.2, ['history', 'geography', 'philosophy', 'religion'], ['recall', 'concept_linking']),
      s('science', 'Science', 0.2, ['physics_basics', 'chemistry_basics', 'biology_basics'], ['application', 'formula_recall']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  ayt_sayisal: {
    examCode: 'ayt_sayisal',
    subjects: [
      s('math', 'Mathematics', 0.34, ['advanced_algebra', 'calculus', 'geometry'], ['deep_problem_solving', 'accuracy'], 0.15),
      s('physics', 'Physics', 0.22, ['mechanics', 'electricity', 'modern_physics'], ['multi_step_reasoning', 'formula_application'], 0.1),
      s('chemistry', 'Chemistry', 0.22, ['physical', 'organic', 'inorganic'], ['reaction_logic', 'memory']),
      s('biology', 'Biology', 0.22, ['systems', 'genetics', 'ecology'], ['detail_recall', 'diagram_reasoning']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  ayt_ea: {
    examCode: 'ayt_ea',
    subjects: [
      s('mathematics', 'Mathematics', 0.35, ['advanced_algebra', 'problem_solving', 'geometry'], ['deep_problem_solving', 'accuracy'], 0.15),
      s('literature', 'Literature', 0.25, ['poetry', 'novel', 'periods_authors'], ['recall', 'text_analysis']),
      s('history', 'History', 0.2, ['ottoman', 'republic', 'world_history'], ['chronology', 'cause_effect']),
      s('geography', 'Geography', 0.2, ['turkiye', 'economic', 'human'], ['map_reasoning', 'concept_linking']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  ayt_sozel: {
    examCode: 'ayt_sozel',
    subjects: [
      s('literature', 'Literature', 0.26, ['poetry', 'novel', 'periods_authors'], ['recall', 'text_analysis']),
      s('history', 'History', 0.22, ['ottoman', 'republic', 'world_history'], ['chronology', 'cause_effect']),
      s('geography', 'Geography', 0.18, ['turkiye', 'economic', 'human'], ['map_reasoning', 'concept_linking']),
      s('philosophy_group', 'Philosophy Group', 0.17, ['philosophy', 'sociology', 'psychology', 'logic'], ['critical_thinking', 'concept_linking']),
      s('religion', 'Religion and Ethics', 0.17, ['belief', 'interpretation', 'contemporary_topics'], ['interpretation', 'recall']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  tyt_ayt_sayisal: {
    examCode: 'tyt_ayt_sayisal',
    subjects: [
      s('tyt_core', 'TYT Core', 0.38, ['turkish', 'math', 'social', 'science_basics'], ['speed', 'accuracy'], 0.1),
      s('ayt_math', 'AYT Mathematics', 0.24, ['advanced_algebra', 'calculus', 'geometry'], ['deep_problem_solving', 'accuracy'], 0.15),
      s('physics', 'Physics', 0.13, ['mechanics', 'electricity', 'modern_physics'], ['multi_step_reasoning', 'formula_application'], 0.1),
      s('chemistry', 'Chemistry', 0.12, ['physical', 'organic', 'inorganic'], ['reaction_logic', 'memory']),
      s('biology', 'Biology', 0.13, ['systems', 'genetics', 'ecology'], ['detail_recall', 'diagram_reasoning']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  tyt_ayt_ea: {
    examCode: 'tyt_ayt_ea',
    subjects: [
      s('tyt_core', 'TYT Core', 0.4, ['turkish', 'math', 'social', 'science_basics'], ['speed', 'accuracy'], 0.1),
      s('ayt_math', 'AYT Mathematics', 0.22, ['advanced_algebra', 'problem_solving', 'geometry'], ['deep_problem_solving', 'accuracy'], 0.15),
      s('literature', 'Literature', 0.18, ['poetry', 'novel', 'periods_authors'], ['recall', 'text_analysis']),
      s('history', 'History', 0.1, ['ottoman', 'republic', 'world_history'], ['chronology', 'cause_effect']),
      s('geography', 'Geography', 0.1, ['turkiye', 'economic', 'human'], ['map_reasoning', 'concept_linking']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  tyt_ayt_sozel: {
    examCode: 'tyt_ayt_sozel',
    subjects: [
      s('tyt_core', 'TYT Core', 0.42, ['turkish', 'math', 'social', 'science_basics'], ['speed', 'accuracy'], 0.1),
      s('literature', 'Literature', 0.18, ['poetry', 'novel', 'periods_authors'], ['recall', 'text_analysis']),
      s('history', 'History', 0.14, ['ottoman', 'republic', 'world_history'], ['chronology', 'cause_effect']),
      s('geography', 'Geography', 0.1, ['turkiye', 'economic', 'human'], ['map_reasoning', 'concept_linking']),
      s('philosophy_group', 'Philosophy Group', 0.08, ['philosophy', 'sociology', 'psychology', 'logic'], ['critical_thinking', 'concept_linking']),
      s('religion', 'Religion and Ethics', 0.08, ['belief', 'interpretation', 'contemporary_topics'], ['interpretation', 'recall']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  ydt_tr: {
    examCode: 'ydt_tr',
    subjects: [
      s('vocabulary', 'Vocabulary', 0.22, ['core_words', 'collocations', 'phrases'], ['retention', 'recall']),
      s('grammar', 'Grammar', 0.2, ['tense', 'clauses', 'structure'], ['pattern_spotting', 'accuracy']),
      s('reading', 'Reading', 0.28, ['passages', 'inference', 'detail_questions'], ['comprehension', 'speed_scanning']),
      s('translation', 'Translation', 0.15, ['tr_to_target', 'target_to_tr'], ['language_transfer', 'precision']),
      s('practice', 'Practice Sets', 0.15, ['past_papers', 'mock_blocks'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  kpss: {
    examCode: 'kpss',
    subjects: [
      s('general_ability', 'General Ability', 0.35, ['turkish', 'math_reasoning'], ['speed_reasoning', 'accuracy'], 0.1),
      s('general_culture', 'General Culture', 0.35, ['history', 'geography', 'citizenship'], ['recall', 'concept_mapping']),
      s('field', 'Field/Education', 0.3, ['education_sciences_or_branch'], ['domain_mastery', 'question_strategy'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  kpss_gygk: {
    examCode: 'kpss_gygk',
    subjects: [
      s('general_ability', 'General Ability', 0.5, ['turkish', 'math_reasoning'], ['speed_reasoning', 'accuracy'], 0.12),
      s('general_culture', 'General Culture', 0.5, ['history', 'geography', 'citizenship', 'current_affairs'], ['recall', 'concept_mapping']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  kpss_egitim: {
    examCode: 'kpss_egitim',
    subjects: [
      s('general_ability', 'General Ability', 0.25, ['turkish', 'math_reasoning'], ['speed_reasoning', 'accuracy'], 0.08),
      s('general_culture', 'General Culture', 0.25, ['history', 'geography', 'citizenship', 'current_affairs'], ['recall', 'concept_mapping']),
      s('education_sciences', 'Education Sciences', 0.5, ['learning_psychology', 'guidance', 'measurement', 'teaching_methods'], ['pedagogy_mastery', 'question_strategy'], 0.12),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  kpss_oabt: {
    examCode: 'kpss_oabt',
    subjects: [
      s('general_ability', 'General Ability', 0.2, ['turkish', 'math_reasoning'], ['speed_reasoning', 'accuracy'], 0.05),
      s('general_culture', 'General Culture', 0.2, ['history', 'geography', 'citizenship', 'current_affairs'], ['recall', 'concept_mapping']),
      s('education_sciences', 'Education Sciences', 0.25, ['learning_psychology', 'guidance', 'measurement', 'teaching_methods'], ['pedagogy_mastery', 'question_strategy'], 0.08),
      s('teaching_field', 'Teaching Field (OABT)', 0.35, ['branch_content', 'curriculum', 'branch_question_sets'], ['domain_mastery', 'applied_accuracy'], 0.12),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  kpss_a: {
    examCode: 'kpss_a',
    subjects: [
      s('general_ability', 'General Ability', 0.2, ['turkish', 'math_reasoning'], ['speed_reasoning', 'accuracy'], 0.05),
      s('general_culture', 'General Culture', 0.2, ['history', 'geography', 'citizenship', 'current_affairs'], ['recall', 'concept_mapping']),
      s('law_economics', 'Law/Economics', 0.3, ['constitutional_law', 'administrative_law', 'micro_macro'], ['analysis', 'concept_linking'], 0.1),
      s('finance_accounting', 'Finance/Accounting', 0.3, ['public_finance', 'accounting', 'statistics'], ['accuracy', 'application'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  qudrat: {
    examCode: 'qudrat',
    subjects: [
      s('verbal', 'Verbal', 0.5, ['analogy', 'reading', 'logic'], ['language_reasoning', 'speed']),
      s('quant', 'Quantitative', 0.5, ['arithmetic', 'algebra', 'word_problems'], ['quant_accuracy', 'time_management'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  tahsili: {
    examCode: 'tahsili',
    subjects: [
      s('math', 'Math', 0.25, ['algebra', 'functions', 'applied_math'], ['problem_solving', 'accuracy'], 0.1),
      s('physics', 'Physics', 0.25, ['mechanics', 'electricity', 'waves'], ['conceptual_application', 'numerical_accuracy'], 0.1),
      s('chemistry', 'Chemistry', 0.25, ['organic', 'inorganic', 'physical'], ['reaction_reasoning', 'recall']),
      s('biology', 'Biology', 0.25, ['cell', 'physiology', 'genetics'], ['detail_recall', 'concept_linking']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  act: {
    examCode: 'act',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['act_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['act_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['act_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  mcat: {
    examCode: 'mcat',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['mcat_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['mcat_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['mcat_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  usmle: {
    examCode: 'usmle',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['usmle_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['usmle_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['usmle_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  cpa_cn: {
    examCode: 'cpa_cn',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['cpa_cn_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['cpa_cn_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['cpa_cn_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  bar_cn: {
    examCode: 'bar_cn',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['bar_cn_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['bar_cn_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['bar_cn_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  todai_exam: {
    examCode: 'todai_exam',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['todai_exam_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['todai_exam_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['todai_exam_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  bar_jp: {
    examCode: 'bar_jp',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['bar_jp_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['bar_jp_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['bar_jp_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  civil_service_jp: {
    examCode: 'civil_service_jp',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['civil_service_jp_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['civil_service_jp_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['civil_service_jp_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  med_lic_jp: {
    examCode: 'med_lic_jp',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['med_lic_jp_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['med_lic_jp_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['med_lic_jp_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  upsc: {
    examCode: 'upsc',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['upsc_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['upsc_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['upsc_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  cat: {
    examCode: 'cat',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['cat_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['cat_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['cat_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  gate: {
    examCode: 'gate',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['gate_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['gate_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['gate_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  ca_final: {
    examCode: 'ca_final',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['ca_final_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['ca_final_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['ca_final_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  vestibular: {
    examCode: 'vestibular',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['vestibular_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['vestibular_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['vestibular_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  oab: {
    examCode: 'oab',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['oab_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['oab_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['oab_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  enade: {
    examCode: 'enade',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['enade_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['enade_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['enade_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  gsat: {
    examCode: 'gsat',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['gsat_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['gsat_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['gsat_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  psat_kr: {
    examCode: 'psat_kr',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['psat_kr_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['psat_kr_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['psat_kr_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  bar_kr: {
    examCode: 'bar_kr',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['bar_kr_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['bar_kr_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['bar_kr_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  topik: {
    examCode: 'topik',
    subjects: [
      s('reading', 'Reading', 0.25, ['topik_reading', 'past_passages'], ['comprehension', 'speed_scanning']),
      s('listening', 'Listening', 0.25, ['topik_listening', 'note_capture'], ['active_listening', 'detail_retention']),
      s('writing', 'Writing', 0.25, ['topik_writing', 'response_structure'], ['organization', 'accuracy']),
      s('speaking', 'Speaking', 0.25, ['topik_speaking', 'fluency_drills'], ['fluency', 'coherence'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  med_lic_kr: {
    examCode: 'med_lic_kr',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['med_lic_kr_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['med_lic_kr_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['med_lic_kr_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  staatsexamen: {
    examCode: 'staatsexamen',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['staatsexamen_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['staatsexamen_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['staatsexamen_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  nc_track: {
    examCode: 'nc_track',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['nc_track_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['nc_track_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['nc_track_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  steuerberater: {
    examCode: 'steuerberater',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['steuerberater_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['steuerberater_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['steuerberater_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  zweites_staatsexamen: {
    examCode: 'zweites_staatsexamen',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['zweites_staatsexamen_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['zweites_staatsexamen_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['zweites_staatsexamen_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  ucat: {
    examCode: 'ucat',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['ucat_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['ucat_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['ucat_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  lnat: {
    examCode: 'lnat',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['lnat_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['lnat_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['lnat_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  sqe: {
    examCode: 'sqe',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['sqe_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['sqe_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['sqe_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  acca_icaew: {
    examCode: 'acca_icaew',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['acca_icaew_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['acca_icaew_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['acca_icaew_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  cpns: {
    examCode: 'cpns',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['cpns_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['cpns_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['cpns_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  ukmppd: {
    examCode: 'ukmppd',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['ukmppd_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['ukmppd_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['ukmppd_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  cpa_id: {
    examCode: 'cpa_id',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['cpa_id_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['cpa_id_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['cpa_id_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  concours_ge: {
    examCode: 'concours_ge',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['concours_ge_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['concours_ge_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['concours_ge_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  polytechnique_track: {
    examCode: 'polytechnique_track',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['polytechnique_track_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['polytechnique_track_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['polytechnique_track_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  insp_ena: {
    examCode: 'insp_ena',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['insp_ena_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['insp_ena_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['insp_ena_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  crfpa: {
    examCode: 'crfpa',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['crfpa_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['crfpa_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['crfpa_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  delf_dalf: {
    examCode: 'delf_dalf',
    subjects: [
      s('reading', 'Reading', 0.25, ['delf_dalf_reading', 'past_passages'], ['comprehension', 'speed_scanning']),
      s('listening', 'Listening', 0.25, ['delf_dalf_listening', 'note_capture'], ['active_listening', 'detail_retention']),
      s('writing', 'Writing', 0.25, ['delf_dalf_writing', 'response_structure'], ['organization', 'accuracy']),
      s('speaking', 'Speaking', 0.25, ['delf_dalf_speaking', 'fluency_drills'], ['fluency', 'coherence'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  mccqe: {
    examCode: 'mccqe',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['mccqe_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['mccqe_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['mccqe_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  cpa_ca: {
    examCode: 'cpa_ca',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['cpa_ca_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['cpa_ca_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['cpa_ca_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  nca_bar: {
    examCode: 'nca_bar',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['nca_bar_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['nca_bar_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['nca_bar_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  ales: {
    examCode: 'ales',
    subjects: [
      s('quant', 'Quantitative', 0.34, ['ales_quant', 'problem_sets'], ['problem_solving', 'accuracy'], 0.1),
      s('verbal', 'Verbal/Language', 0.33, ['ales_verbal', 'reading_reasoning'], ['comprehension', 'critical_reasoning']),
      s('practice', 'Practice & Review', 0.33, ['ales_practice', 'mock_and_review'], ['time_management', 'revision_discipline']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: commonRules,
    difficultyCurve: defaultCurve,
  },
  yds: {
    examCode: 'yds',
    subjects: [
      s('reading', 'Reading', 0.25, ['yds_reading', 'past_passages'], ['comprehension', 'speed_scanning']),
      s('listening', 'Listening', 0.25, ['yds_listening', 'note_capture'], ['active_listening', 'detail_retention']),
      s('writing', 'Writing', 0.25, ['yds_writing', 'response_structure'], ['organization', 'accuracy']),
      s('speaking', 'Speaking', 0.25, ['yds_speaking', 'fluency_drills'], ['fluency', 'coherence'], 0.1),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: languageRules,
    difficultyCurve: defaultCurve,
  },
  dus: {
    examCode: 'dus',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['dus_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['dus_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['dus_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  tus: {
    examCode: 'tus',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['tus_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['tus_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['tus_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  scfhs: {
    examCode: 'scfhs',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['scfhs_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['scfhs_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['scfhs_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  bar_sa: {
    examCode: 'bar_sa',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['bar_sa_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['bar_sa_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['bar_sa_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
  cma_sa: {
    examCode: 'cma_sa',
    subjects: [
      s('core', 'Core Concepts', 0.34, ['cma_sa_core_domains', 'standards_frameworks'], ['concept_mastery', 'recall'], 0.05),
      s('applied', 'Applied Reasoning', 0.33, ['cma_sa_case_analysis', 'scenario_questions'], ['analysis', 'decision_making'], 0.1),
      s('practice', 'Practice Tests', 0.33, ['cma_sa_mock_sets', 'error_log_review'], ['time_management', 'execution']),
    ],
    sessionTypes: ['study', 'review', 'practice', 'mock'],
    weeklyRules: professionalRules,
    difficultyCurve: defaultCurve,
  },
};

export const getBlueprintByExamCode = (examCode?: string): ExamBlueprint | null => {
  if (!examCode) return null;
  return examBlueprints[examCode] ?? null;
};
