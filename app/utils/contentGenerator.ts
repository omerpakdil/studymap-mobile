export interface QuestionContent {
  id: number;
  type: 'question';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
}

export interface PassageContent {
  id: number;
  type: 'passage';
  passage: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic?: string;
}

export interface PromptContent {
  id: number;
  type: 'prompt';
  prompt: string;
  sampleAnswer?: string;
  tips?: string[];
  topic?: string;
}

export type ContentItem = QuestionContent | PassageContent | PromptContent;

interface ContentGenerationParams {
  examId: string;
  subject: string;
  sessionType: 'Practice' | 'Study' | 'Review';
  duration: number;
}

const makeQuestion = (
  id: number,
  label: string,
  explanation: string,
  topic: string,
  sessionType: ContentGenerationParams['sessionType']
): QuestionContent => ({
  id,
  type: 'question',
  question: `${label} (${sessionType})`,
  options: [
    'Start with fundamentals and solve step-by-step',
    'Skip fundamentals and guess patterns',
    'Only read answers without solving',
    'Focus only on speed and ignore accuracy',
  ],
  correct: 0,
  explanation,
  difficulty: id % 3 === 0 ? 'Hard' : id % 2 === 0 ? 'Medium' : 'Easy',
  topic,
});

const subjectPromptMap: Record<string, string> = {
  reading: 'How should you approach a dense reading passage?',
  writing: 'What makes this written response high-scoring?',
  mathematics: 'What is the most reliable solving path for this math item?',
  math: 'What is the most reliable solving path for this math item?',
  listening: 'How do you extract key points from this listening segment?',
  speaking: 'How do you structure a clear spoken response?',
  verbal: 'How do you break down this verbal reasoning item?',
  quantitative: 'How do you solve this quantitative reasoning item accurately?',
  'logical reasoning': 'How do you evaluate the argument structure correctly?',
};

const examFrame: Record<string, string> = {
  sat: 'SAT',
  gre: 'GRE',
  toefl: 'TOEFL',
  ielts: 'IELTS',
  gmat: 'GMAT',
  lsat: 'LSAT',
};

export const generateStudyContent = async (
  params: ContentGenerationParams
): Promise<ContentItem[]> => {
  const itemsCount = Math.max(3, Math.min(8, Math.floor(params.duration / 10)));
  const exam = examFrame[params.examId.toLowerCase()] || 'Exam';
  const subjectKey = params.subject.toLowerCase();
  const basePrompt =
    subjectPromptMap[subjectKey] || `What is the best strategy for improving ${params.subject}?`;

  const explanation = `Use a structured ${exam} workflow: identify the core concept, solve with method, then verify with a quick check.`;

  const items: ContentItem[] = [];
  for (let i = 1; i <= itemsCount; i += 1) {
    items.push(
      makeQuestion(
        i,
        `${exam} ${params.subject}: ${basePrompt}`,
        explanation,
        params.subject,
        params.sessionType
      )
    );
  }

  return items;
};
