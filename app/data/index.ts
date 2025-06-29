// Import all curriculum data
import { gmatCurriculum } from './gmat-curriculum';
import { greCurriculum } from './gre-curriculum';
import { ieltsCurriculum } from './ielts-curriculum';
import { lsatCurriculum } from './lsat-curriculum';
import { satCurriculum, type ExamCurriculum, type SubjectData, type TopicData } from './sat-curriculum';
import { toeflCurriculum } from './toefl-curriculum';

// Re-export for convenience
export { gmatCurriculum, greCurriculum, ieltsCurriculum, lsatCurriculum, satCurriculum, toeflCurriculum };
export type { ExamCurriculum, SubjectData, TopicData };

// Map of exam IDs to their curriculum data
export const examCurriculums = {
  sat: satCurriculum,
  gre: greCurriculum,
  toefl: toeflCurriculum,
  ielts: ieltsCurriculum,
  gmat: gmatCurriculum,
  lsat: lsatCurriculum
};

// Helper function to get curriculum by exam ID
export const getCurriculumByExamId = (examId: string): ExamCurriculum | null => {
  return examCurriculums[examId as keyof typeof examCurriculums] || null;
};

// List of all available exams
export const availableExams = [
  { id: 'sat', name: 'SAT', fullName: 'Scholastic Assessment Test' },
  { id: 'gre', name: 'GRE', fullName: 'Graduate Record Examinations' },
  { id: 'toefl', name: 'TOEFL', fullName: 'Test of English as a Foreign Language' },
  { id: 'ielts', name: 'IELTS', fullName: 'International English Language Testing System' },
  { id: 'gmat', name: 'GMAT', fullName: 'Graduate Management Admission Test' },
  { id: 'lsat', name: 'LSAT', fullName: 'Law School Admission Test' }
]; 