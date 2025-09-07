import { getCurriculumByExamId } from '@/app/data';
import Anthropic from '@anthropic-ai/sdk';
import { OnboardingData } from './onboardingData';

// API Key from environment variables with validation
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// Validate API key
if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
  console.warn('⚠️ Anthropic API key not configured properly. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file');
  console.warn('💡 Get your API key from: https://console.anthropic.com/');
}

// Initialize Anthropic client with error handling
let anthropic: Anthropic | null = null;
try {
  if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here') {
    anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Anthropic client:', error);
}

// Study program data types
export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  type: 'study' | 'practice' | 'review' | 'quiz';
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  description: string;
  date: string; // YYYY-MM-DD format
  timeSlot: string; // e.g., "09:00-10:30"
  completed: boolean;
  progress: number; // 0-100%
  resources?: string[];
  notes?: string;
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
  weeklySchedule: {
    [week: string]: StudyTask[];
  };
  subjectBreakdown: {
    [subject: string]: {
      totalHours: number;
      weeklyHours: number;
      intensityLevel: number;
      priority: number;
      currentProgress: number;
    };
  };
  milestones: {
    date: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
  generatedAt: string;
  lastUpdated: string;
}

// Safe date parsing function
const parseExamDate = (dateString: string): Date | null => {
  try {
    if (!dateString?.trim()) return null;

    const dateParts = dateString.trim().split('/');
    if (dateParts.length === 3) {
      const month = parseInt(dateParts[0], 10);
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2024 && year <= 2030) {
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
};

// Generate intelligent prompt from onboarding data
const generateClaudePrompt = (onboardingData: OnboardingData): string => {
  const { examData, subjectIntensity, goalsData, scheduleData, learningStyleData } = onboardingData;

  if (!examData || !goalsData) {
    throw new Error('Missing required onboarding data for prompt generation');
  }

  // Parse exam date
  const examDate = parseExamDate(goalsData.examDate);
  if (!examDate) {
    throw new Error('Invalid exam date format');
  }

  const today = new Date();
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate weekly hours from schedule and intensity
  const calculateWeeklyHours = (): number => {
    // Count total available time slots per week
    const daysInWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let totalWeeklySlots = 0;
    
    daysInWeek.forEach(day => {
      const daySlots = scheduleData[day] || [];
      totalWeeklySlots += daySlots.length;
    });

    // Base hours per slot (assuming each slot is ~1 hour)
    const baseHoursPerSlot = 1;
    let baseWeeklyHours = totalWeeklySlots * baseHoursPerSlot;

    // Adjust based on study intensity
    const intensityMultiplier = {
      'relaxed': 0.7,    // 70% of available time
      'moderate': 0.85,  // 85% of available time  
      'intensive': 1.0,  // 100% of available time
      'extreme': 1.2     // 120% of available time (longer sessions)
    };

    const multiplier = intensityMultiplier[goalsData.studyIntensity as keyof typeof intensityMultiplier] || 0.85;
    const calculatedHours = Math.round(baseWeeklyHours * multiplier);

    // Ensure reasonable bounds (minimum 5 hours, maximum 40 hours per week)
    return Math.max(5, Math.min(40, calculatedHours));
  };

  const weeklyHours = calculateWeeklyHours();

  // Generate subject intensity context
  const intensityContext = Object.entries(subjectIntensity)
    .map(([subject, level]) => {
      const intensityLabels = ['Light', 'Moderate', 'High', 'Intensive'];
      const percentages = ['20%', '40%', '60%', '80%'];
      return `${subject}: ${intensityLabels[level]} focus (${percentages[level]} effort)`;
    })
    .join(', ');

  const availableTimeSlots = Object.entries(scheduleData)
    .map(([day, slots]) => `${day}: ${slots.join(', ')}`)
    .filter(entry => !entry.endsWith(': '))
    .join('; ');

  // Calculate typical task duration from time slots
  const calculateTaskDuration = (): number => {
    // Get all time slots and calculate average duration
    const allSlots = Object.values(scheduleData).flat();
    if (allSlots.length === 0) return 60; // default 1 hour
    
    // Assume most time slots are 1-2 hours, adjust by session length preference
    const sessionLengthMultiplier = {
      'Short': 0.75,   // 45 min
      'Medium': 1.0,   // 60 min
      'Long': 1.5      // 90 min
    };
    
    const baseMinutes = 60;
    const multiplier = sessionLengthMultiplier[learningStyleData?.preferences?.sessionLength as keyof typeof sessionLengthMultiplier] || 1.0;
    return Math.round(baseMinutes * multiplier);
  };

  const typicalTaskDuration = calculateTaskDuration();

  // Get exam-specific subjects and create dynamic subject breakdown
  const examSubjects = getExamSubjects(examData.id);
  const createSubjectBreakdown = () => {
    const breakdown: Record<string, any> = {};
    const totalSubjects = examSubjects.length;
    
    // Calculate total intensity weights
    const totalIntensityWeight = Object.values(subjectIntensity).reduce((sum, intensity) => sum + intensity + 1, 0);
    
    examSubjects.forEach((subject, index) => {
      // Get intensity level for this subject (default to 1 if not set)
      const intensityLevel = subjectIntensity[subject] ?? 1;
      
      // Calculate priority based on intensity level (higher intensity = higher priority)
      const priority = intensityLevel + 1; // 1-4 scale
      
      // Distribute weekly hours based on intensity
      const intensityWeight = (intensityLevel + 1) / totalIntensityWeight;
      const subjectWeeklyHours = Math.max(1, Math.round(weeklyHours * intensityWeight));
      
      breakdown[subject] = {
        totalHours: Math.round(subjectWeeklyHours * (daysUntilExam / 7)),
        weeklyHours: subjectWeeklyHours,
        intensityLevel: intensityLevel,
        priority: priority,
        currentProgress: 0
      };
    });
    
    return breakdown;
  };

  const subjectBreakdownTemplate = createSubjectBreakdown();
  const subjectBreakdownJson = Object.entries(subjectBreakdownTemplate)
    .map(([subject, data]) => `    "${subject}": ${JSON.stringify(data, null, 6).replace(/\n/g, '\n    ')}`)
    .join(',\n');

  // Calculate daily study time distribution
  const dailyHoursDistribution = Object.entries(scheduleData).reduce((acc, [day, slots]) => {
    acc[day] = slots.length; // Each slot = 1 hour
    return acc;
  }, {} as Record<string, number>);

  const totalDailyHours = Object.values(dailyHoursDistribution).reduce((sum, hours) => sum + hours, 0);
  const dailyAverage = totalDailyHours / 7;

  const prompt = `You are an expert AI study coach creating a personalized study program. Generate a comprehensive study plan based on the following student information:

## STUDENT PROFILE

**Exam Information:**
- Exam Type: ${examData.name} (${examData.fullName})
- Exam Date: ${goalsData.examDate}
- Days Until Exam: ${daysUntilExam}
- Target Score: ${goalsData.targetScore}

**DETAILED DAILY SCHEDULE:**
${Object.entries(dailyHoursDistribution).map(([day, hours]) => 
  hours > 0 ? `${day}: ${hours} hours available (${scheduleData[day]?.join(', ')})` : `${day}: No study time`
).join('\n')}

**SUBJECT INTENSITY PREFERENCES (Study focus allocation):**
${intensityContext}

**Study Preferences:**
- Study Intensity: ${goalsData.studyIntensity}
- Total Weekly Hours: ${weeklyHours}
- Typical Task Duration: ${typicalTaskDuration} minutes
- Daily Average: ${dailyAverage.toFixed(1)} hours per day
- Motivation: ${goalsData.motivation}

**Learning Style:**
- Primary Style: ${learningStyleData?.primaryStyle || 'Visual'}
- Study Environment: ${learningStyleData?.preferences?.studyEnvironment || 'Quiet'}
- Session Length: ${learningStyleData?.preferences?.sessionLength || 'Medium'}
- Break Frequency: ${learningStyleData?.preferences?.breakFrequency || 'Regular'}

**INTELLIGENT SUBJECT ALLOCATION:**
${JSON.stringify(subjectBreakdownTemplate, null, 2)}

## CRITICAL REQUIREMENTS

1. **DAILY TASK DISTRIBUTION:**
   - Create ${Math.round(dailyAverage * 60 / typicalTaskDuration)} tasks per study day on average
   - Fill ALL available time slots with appropriate tasks
   - Days with 0 hours should have NO tasks
   - Match task scheduling to the exact available time slots provided

2. **INTENSITY-BASED PRIORITIZATION:**
   - Intensive focus subjects (level 3) should get 40-50% of total time
   - High focus subjects (level 2) should get 30-35% of time  
   - Moderate focus subjects (level 1) should get 20-25% of time
   - Light focus subjects (level 0) should get 10-15% of time

3. **PROGRESSIVE DIFFICULTY:**
   - Week 1-2: Focus on fundamentals and assessment
   - Week 3-4: Intermediate concepts and regular practice
   - Final weeks: Advanced practice, full tests, weak area review
   - Increase quiz frequency as exam approaches

4. **TASK VARIETY & DURATION:**
   - Use ${typicalTaskDuration}-minute sessions primarily
   - 40% study sessions (learning new concepts)
   - 30% practice sessions (applying knowledge)
   - 20% review sessions (reinforcing previous material)
   - 10% quiz sessions (testing knowledge)

5. **WEEKLY STRUCTURE:**
   - Each week should total approximately ${weeklyHours} hours
   - Balance all subjects weekly, but prioritize high intensity subjects
   - Include progressive milestones with specific skill targets

## OUTPUT FORMAT

Please respond with a valid JSON object following this exact structure:

\`\`\`json
{
  "id": "claude_study_program_${Date.now()}",
  "examType": "${examData.id}",
  "examDate": "${goalsData.examDate}",
  "startDate": "${today.toISOString().split('T')[0]}",
  "endDate": "${examDate?.toISOString().split('T')[0]}",
  "totalDays": ${daysUntilExam},
  "weeklyHours": ${weeklyHours},
  "dailyTasks": [
    {
      "id": "claude_task_1",
      "title": "${examSubjects[0] || 'Subject'}: Practice Session",
      "subject": "${examSubjects[0] || 'Subject'}",
      "type": "study",
      "duration": ${typicalTaskDuration},
      "difficulty": "medium",
      "priority": "high",
      "description": "Detailed task description for ${examData.name} preparation",
      "date": "${today.toISOString().split('T')[0]}",
      "timeSlot": "${Object.values(scheduleData).flat()[0] || '09:00-10:00'}",
      "completed": false,
      "progress": 0,
      "resources": ["${examData.name} Study Guide", "Practice Materials"],
      "notes": "Focus on ${examData.name} specific strategies"
    }
  ],
  "weeklySchedule": {
    "week_1": [],
    "week_2": []
  },
  "subjectBreakdown": {
${subjectBreakdownJson}
  },
  "milestones": [
    {
      "date": "${new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
      "title": "Week 1 ${examData.name} Foundation",
      "description": "Complete foundational concepts for ${examData.name} preparation",
      "completed": false
    }
  ],
  "generatedAt": "${new Date().toISOString()}",
  "lastUpdated": "${new Date().toISOString()}"
}
\`\`\`

**GENERATE A COMPREHENSIVE ${daysUntilExam}-DAY STUDY PLAN WITH EXACT DAILY TASKS THAT TOTAL ${weeklyHours} HOURS PER WEEK AND PRIORITIZE SUBJECTS ACCORDING TO THE SPECIFIED INTENSITY LEVELS.**`;

  return prompt;
};

// Call Claude API to generate study program
const callClaudeAPI = async (prompt: string): Promise<any> => {
  try {
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
      throw new Error('Claude API key not configured. Please set ANTHROPIC_API_KEY environment variable.');
    }
    
    if (!anthropic) {
      throw new Error('Anthropic client not initialized. Please check your API key configuration.');
    }

    console.log('🧠 Calling Claude API to generate personalized study program...');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: "You are an expert AI study coach. Always respond with valid JSON objects following the exact format specified in the prompt. Be specific, practical, and considerate of the student's individual needs.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const textContent = content.text;
    const jsonMatch = textContent.match(/```json\s*(\{[\s\S]*?\})\s*```/) || textContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.warn('No JSON found in Claude response, trying to parse entire response as JSON');
      return JSON.parse(textContent.trim());
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const parsedResponse = JSON.parse(jsonString);

    console.log('✅ Successfully received and parsed Claude response');
    console.log(`📊 Generated ${parsedResponse.dailyTasks?.length || 0} daily tasks`);

    return parsedResponse;

  } catch (error) {
    console.error('❌ Error calling Claude API:', error);
    throw error;
  }
};

// Main function to generate study program using Claude
export const generateStudyProgram = async (onboardingData: OnboardingData): Promise<StudyProgram | null> => {
  try {
    console.log('🤖 Generating study program with Claude API...');
    
    const prompt = generateClaudePrompt(onboardingData);
    const response = await callClaudeAPI(prompt);
    return response as StudyProgram;
  } catch (error) {
    console.error('❌ Error generating study program with Claude:', error);
    return null;
  }
};

// Content generation interfaces - simplified for subject-only approach
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
  duration: number; // minutes
}

// Generate dynamic study content for sessions
export const generateStudyContent = async (params: ContentGenerationParams): Promise<ContentItem[]> => {
  try {
    console.log('🧠 Generating exam-specific content for:', params);
    
    const { examId, subject, sessionType, duration } = params;
    
    // Calculate number of content items based on duration
    const itemsCount = Math.max(3, Math.min(10, Math.ceil(duration / 15))); // 1 item per 15 minutes, 3-10 items
    
    // Generate exam-specific content based on subject only
    const content = generateExamSpecificContent({
      ...params,
      itemsCount
    });
    
    console.log(`✅ Generated ${content.length} ${examId.toUpperCase()} content items for ${subject}`);
    return content;
    
  } catch (error) {
    console.error('❌ Error generating study content:', error);
    return generateFallbackContent(params);
  }
};

// Generate fallback content when exam-specific generation fails
const generateFallbackContent = (params: ContentGenerationParams): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `What is an important concept to understand in ${params.subject}?`,
    options: [
      'Master the fundamentals first',
      'Skip basic concepts',
      'Focus only on advanced topics',
      'Avoid practice problems'
    ],
    correct: 0,
    explanation: 'Building a strong foundation is crucial for understanding any subject effectively.',
    difficulty: 'Medium',
    topic: 'General'
  }];
};

// Generate exam-specific content based on curriculum
const generateExamSpecificContent = (params: ContentGenerationParams & { 
  itemsCount: number 
}): ContentItem[] => {
  const { examId, subject, sessionType, itemsCount } = params;
  
  // Route to exam-specific generators
  switch (examId) {
    case 'sat':
      return generateSATContent(subject, sessionType, itemsCount);
    case 'gre':
      return generateGREContent(subject, sessionType, itemsCount);
    case 'toefl':
      return generateTOEFLContent(subject, sessionType, itemsCount);
    case 'ielts':
      return generateIELTSContent(subject, sessionType, itemsCount);
    case 'gmat':
      return generateGMATContent(subject, sessionType, itemsCount);
    case 'lsat':
      return generateLSATContent(subject, sessionType, itemsCount);
    default:
      return generateGenericContent(subject, sessionType, itemsCount);
  }
};

// Subject-focused content generators (no topic parameter)
const generateSATContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject.toLowerCase().includes('math')) {
      content.push({
        id: i + 1,
        type: 'question',
        question: `SAT Math: If 3x + 7 = ${19 + i * 3}, what is the value of x?`,
        options: [
          `${(19 + i * 3 - 7) / 3}`,
          `${(19 + i * 3 - 7) / 3 + 1}`,
          `${(19 + i * 3 - 7) / 3 - 1}`,
          `${(19 + i * 3 - 7) / 3 + 2}`
        ],
        correct: 0,
        explanation: `Subtract 7 from both sides, then divide by 3: x = ${(19 + i * 3 - 7) / 3}`,
        difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
        topic: 'Math'
      });
    } else if (subject.toLowerCase().includes('reading')) {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `SAT Reading Passage: The following passage discusses ${subject} concepts. Modern research in this field has shown that students who develop strong analytical skills tend to perform better on standardized tests. This improvement comes from their ability to identify key information quickly and draw logical conclusions.`,
        question: `Based on the passage, what contributes to better test performance?`,
        options: [
          'Strong analytical skills',
          'Memorizing facts only',
          'Speed reading techniques',
          'Avoiding practice tests'
        ],
        correct: 0,
        explanation: 'The passage states that strong analytical skills contribute to better performance.',
        topic: 'Reading'
      });
    } else {
      content.push({
        id: i + 1,
        type: 'question',
        question: `SAT ${subject}: Which approach is most effective for this subject?`,
        options: [
          'Systematic practice with official materials',
          'Memorization without understanding',
          'Skipping fundamentals',
          'Avoiding timed practice'
        ],
        correct: 0,
        explanation: 'Systematic practice with official SAT materials is the most effective approach.',
        difficulty: 'Medium',
        topic: subject
      });
    }
  }
  
  return content;
};

const generateGREContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject.toLowerCase().includes('quantitative')) {
      content.push({
        id: i + 1,
        type: 'question',
        question: `GRE Quantitative: In a data set, if the mean is ${50 + i * 5} and there are ${10 + i} values, what is the sum of all values?`,
        options: [
          `${(50 + i * 5) * (10 + i)}`,
          `${(50 + i * 5) * (10 + i) + 50}`,
          `${(50 + i * 5) + (10 + i)}`,
          `${(50 + i * 5) * (10 + i) / 2}`
        ],
        correct: 0,
        explanation: `Sum = Mean × Number of values = ${50 + i * 5} × ${10 + i} = ${(50 + i * 5) * (10 + i)}`,
        difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
        topic: 'Quantitative'
      });
    } else {
      content.push({
        id: i + 1,
        type: 'question',
        question: `GRE ${subject}: Which strategy is most effective for this subject?`,
        options: [
          'Systematic practice and skill building',
          'Random problem solving',
          'Avoiding difficult concepts',
          'Speed over accuracy'
        ],
        correct: 0,
        explanation: 'Systematic practice and skill building is the most effective approach.',
        difficulty: 'Medium',
        topic: subject
      });
    }
  }
  
  return content;
};

const generateTOEFLContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `TOEFL ${subject}: What is a key strategy for success in this section?`,
    options: [
      'Practice regularly with authentic materials',
      'Memorize vocabulary lists only',
      'Avoid timing yourself',
      'Focus on perfect grammar only'
    ],
    correct: 0,
    explanation: 'Regular practice with authentic TOEFL materials is essential for success.',
    difficulty: 'Medium',
    topic: subject
  }];
};

const generateIELTSContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `IELTS ${subject}: What approach leads to the best results?`,
    options: [
      'Balanced practice across all skill areas',
      'Focusing only on grammar',
      'Avoiding practice tests',
      'Memorizing sample answers'
    ],
    correct: 0,
    explanation: 'Balanced practice across all areas within the subject leads to optimal results.',
    difficulty: 'Medium',
    topic: subject
  }];
};

const generateGMATContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `GMAT ${subject}: Which method is most effective for improvement?`,
    options: [
      'Analyzing mistakes and practicing strategically',
      'Taking as many practice tests as possible',
      'Memorizing formulas without understanding',
      'Avoiding difficult problems'
    ],
    correct: 0,
    explanation: 'Analyzing mistakes and strategic practice leads to meaningful improvement.',
    difficulty: 'Hard',
    topic: subject
  }];
};

const generateLSATContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `LSAT ${subject}: What is the key to mastering this section?`,
    options: [
      'Understanding underlying logical patterns',
      'Speed reading techniques only',
      'Memorizing question types',
      'Avoiding complex problems'
    ],
    correct: 0,
    explanation: 'Understanding the underlying logical patterns is crucial for LSAT success.',
    difficulty: 'Hard',
    topic: subject
  }];
};

const generateGenericContent = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `What is an important aspect of ${subject}?`,
    options: [
      'Thorough understanding of core concepts',
      'Superficial memorization',
      'Avoiding practice',
      'Ignoring fundamentals'
    ],
    correct: 0,
    explanation: `Understanding core concepts is essential for mastering ${subject}.`,
    difficulty: 'Medium',
    topic: subject
  }];
};

// Get exam-specific curriculum
export const getExamCurriculum = (examId: string) => {
  return getCurriculumByExamId(examId);
};

// Get subjects for specific exam
export const getExamSubjects = (examId: string): string[] => {
  const curriculum = getExamCurriculum(examId);
  return curriculum ? curriculum.subjects.map(subject => subject.name) : [];
};
