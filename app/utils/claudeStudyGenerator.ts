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
  topic: string;
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
      topics: string[];
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
  const { examData, topicProficiency, goalsData, scheduleData, learningStyleData } = onboardingData;

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

  // Generate proficiency context
  const proficiencyContext = Object.entries(topicProficiency)
    .map(([topic, level]) => {
      const levelLabels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
      return `${topic}: ${levelLabels[level]} (${level}/4)`;
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
    
    examSubjects.forEach((subject, index) => {
      // Calculate priority based on proficiency (lower proficiency = higher priority)
      const subjectTopics = getSubjectTopics(examData.id, subject);
      const avgProficiency = subjectTopics.reduce((sum, topic) => {
        return sum + (topicProficiency[topic] || 2);
      }, 0) / subjectTopics.length;
      
      // Invert proficiency for priority (0-4 scale becomes 4-0 priority)
      const priority = Math.max(1, Math.round(4 - avgProficiency));
      
      // Distribute weekly hours based on priority
      const priorityWeight = (5 - priority) / totalSubjects; // Higher priority gets more weight
      const subjectWeeklyHours = Math.max(1, Math.round(weeklyHours * priorityWeight));
      
      breakdown[subject] = {
        totalHours: Math.round(subjectWeeklyHours * (daysUntilExam / 7)),
        weeklyHours: subjectWeeklyHours,
        topics: subjectTopics,
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

**PROFICIENCY ASSESSMENT (Lower scores = more focus needed):**
${proficiencyContext}

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

2. **PROFICIENCY-BASED PRIORITIZATION:**
   - Subjects with lower proficiency scores (0-1) should get 40-50% of total time
   - Medium proficiency (2) should get 30-35% of time  
   - High proficiency (3-4) should get 15-25% of time
   - Weak areas need more frequent review and practice

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
   - Balance all subjects weekly, but prioritize weak areas
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
      "title": "${examSubjects[0] || 'Subject'}: ${getSubjectTopics(examData.id, examSubjects[0] || '')[0] || 'Topic'}",
      "subject": "${examSubjects[0] || 'Subject'}",
      "topic": "${getSubjectTopics(examData.id, examSubjects[0] || '')[0] || 'Topic'}",
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
      "description": "Complete foundational topics for ${examData.name} preparation",
      "completed": false
    }
  ],
  "generatedAt": "${new Date().toISOString()}",
  "lastUpdated": "${new Date().toISOString()}"
}
\`\`\`

**GENERATE A COMPREHENSIVE ${daysUntilExam}-DAY STUDY PLAN WITH EXACT DAILY TASKS THAT TOTAL ${weeklyHours} HOURS PER WEEK AND PRIORITIZE SUBJECTS WITH LOWER PROFICIENCY SCORES.**`;

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



// Types for study session content
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
  topic: string;
  sessionType: 'Practice' | 'Study' | 'Review';
  duration: number; // minutes
}

// Generate dynamic study content for sessions
export const generateStudyContent = async (params: ContentGenerationParams): Promise<ContentItem[]> => {
  try {
    console.log('🧠 Generating exam-specific content for:', params);
    
    const { examId, subject, topic, sessionType, duration } = params;
    
    // Get exam-specific curriculum
    const curriculum = getExamCurriculum(examId);
    if (!curriculum) {
      console.warn(`No curriculum found for exam: ${examId}`);
      return generateFallbackContent(params);
    }
    
    // Calculate number of content items based on duration
    const itemsCount = Math.max(3, Math.min(10, Math.ceil(duration / 15))); // 1 item per 15 minutes, 3-10 items
    
    // Generate exam-specific content
    const content = generateExamSpecificContent({
      ...params,
      curriculum,
      itemsCount
    });
    
    console.log(`✅ Generated ${content.length} ${examId.toUpperCase()} content items for ${subject} - ${topic}`);
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
    question: `What is an important concept to understand in ${params.topic}?`,
    options: [
      'Master the fundamentals first',
      'Skip basic concepts',
      'Focus only on advanced topics',
      'Avoid practice problems'
    ],
    correct: 0,
    explanation: 'Building a strong foundation is crucial for understanding any topic effectively.',
    difficulty: 'Medium',
    topic: params.topic
  }];
};

// Generate exam-specific content based on curriculum
const generateExamSpecificContent = (params: ContentGenerationParams & { 
  curriculum: any, 
  itemsCount: number 
}): ContentItem[] => {
  const { examId, subject, topic, sessionType, curriculum, itemsCount } = params;
  
  // Route to exam-specific generators
  switch (examId) {
    case 'sat':
      return generateSATContent(subject, topic, sessionType, itemsCount);
    case 'gre':
      return generateGREContent(subject, topic, sessionType, itemsCount);
    case 'toefl':
      return generateTOEFLContent(subject, topic, sessionType, itemsCount);
    case 'ielts':
      return generateIELTSContent(subject, topic, sessionType, itemsCount);
    case 'gmat':
      return generateGMATContent(subject, topic, sessionType, itemsCount);
    case 'lsat':
      return generateLSATContent(subject, topic, sessionType, itemsCount);
    default:
      return generateGenericContent(subject, topic, sessionType, itemsCount);
  }
};

// SAT-specific content generation
const generateSATContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  if (subject === 'Math') {
    // SAT Math content
    for (let i = 0; i < count; i++) {
      if (topic.includes('Algebra')) {
        content.push({
          id: i + 1,
          type: 'question',
          question: `SAT Algebra: If 3x + 7 = ${19 + i * 3}, what is the value of x?`,
          options: [
            `${(19 + i * 3 - 7) / 3}`,
            `${(19 + i * 3 - 7) / 3 + 1}`,
            `${(19 + i * 3 - 7) / 3 - 1}`,
            `${(19 + i * 3 - 7) / 3 + 2}`
          ],
          correct: 0,
          explanation: `Subtract 7 from both sides, then divide by 3: x = ${(19 + i * 3 - 7) / 3}`,
          difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
          topic
        });
      } else {
        content.push({
          id: i + 1,
          type: 'question',
          question: `SAT ${topic}: Which approach is most effective for this topic?`,
          options: [
            'Systematic practice with official materials',
            'Memorization without understanding',
            'Skipping fundamentals',
            'Avoiding timed practice'
          ],
          correct: 0,
          explanation: 'Systematic practice with official SAT materials is the most effective approach.',
          difficulty: 'Medium',
          topic
        });
      }
    }
  } else if (subject === 'Reading') {
    // SAT Reading content
    for (let i = 0; i < count; i++) {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `SAT Reading Passage: The following passage discusses ${topic}. Modern research in this field has shown that students who develop strong analytical skills tend to perform better on standardized tests. This improvement comes from their ability to identify key information quickly and draw logical conclusions.`,
        question: `Based on the passage, what contributes to better test performance?`,
        options: [
          'Strong analytical skills',
          'Memorizing facts only',
          'Speed reading techniques',
          'Avoiding practice tests'
        ],
        correct: 0,
        explanation: 'The passage states that strong analytical skills contribute to better performance.',
        topic
      });
    }
  } else if (subject === 'Writing') {
    // SAT Writing content
    for (let i = 0; i < count; i++) {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `SAT Writing Practice: Improve this sentence related to ${topic}: "The student's essay was good because it had good ideas and good structure."`,
        sampleAnswer: 'The student\'s essay was compelling because it presented innovative ideas within a well-organized structure.',
        tips: [
          'Avoid repetitive word usage',
          'Use specific and varied vocabulary',
          'Maintain parallel structure',
          'Focus on clarity and concision'
        ],
        topic
      });
    }
  }
  
  return content;
};

// GRE-specific content generation
const generateGREContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  if (subject === 'Quantitative') {
    // GRE Quant content
    for (let i = 0; i < count; i++) {
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
        topic
      });
    }
  } else if (subject === 'Verbal') {
    // GRE Verbal content
    for (let i = 0; i < count; i++) {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `GRE Verbal Passage: The concept of ${topic} has evolved significantly in recent decades. Scholars now recognize that this field requires both analytical rigor and creative thinking. The complexity of modern problems demands innovative approaches that challenge traditional methodologies.`,
        question: 'What does the passage suggest about modern approaches to this field?',
        options: [
          'They require both analytical and creative thinking',
          'They rely solely on traditional methods',
          'They avoid complex problems',
          'They focus only on creativity'
        ],
        correct: 0,
        explanation: 'The passage states that the field requires both analytical rigor and creative thinking.',
        topic
      });
    }
  } else if (subject === 'Analytical Writing') {
    // GRE Writing content
    for (let i = 0; i < count; i++) {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `GRE Analytical Writing: Analyze the following argument about ${topic}: "The implementation of new policies always leads to immediate improvements in organizational efficiency."`,
        sampleAnswer: 'This argument makes several unfounded assumptions about policy implementation and organizational change, failing to consider implementation challenges and varying contextual factors.',
        tips: [
          'Identify logical fallacies',
          'Consider alternative explanations',
          'Evaluate evidence quality',
          'Provide specific examples'
        ],
        topic
      });
    }
  }
  
  return content;
};

// TOEFL-specific content generation
const generateTOEFLContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject === 'Reading') {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `TOEFL Reading: ${topic} is an important aspect of academic study. In university settings, students are expected to demonstrate comprehensive understanding of complex texts. This requires developing both vocabulary knowledge and reading strategies that enable efficient information processing.`,
        question: 'According to the passage, what is required for academic reading success?',
        options: [
          'Vocabulary knowledge and reading strategies',
          'Speed reading only',
          'Memorizing passages',
          'Avoiding complex texts'
        ],
        correct: 0,
        explanation: 'The passage mentions both vocabulary knowledge and reading strategies as requirements.',
        topic
      });
    } else if (subject === 'Listening') {
      content.push({
        id: i + 1,
        type: 'question',
        question: `TOEFL Listening Practice: What is a key strategy for ${topic}?`,
        options: [
          'Take organized notes and focus on main ideas',
          'Try to write down every word',
          'Ignore context clues',
          'Focus only on details'
        ],
        correct: 0,
        explanation: 'Taking organized notes and focusing on main ideas is essential for TOEFL listening success.',
        difficulty: 'Medium',
        topic
      });
    } else if (subject === 'Speaking') {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `TOEFL Speaking Task: Describe your experience with ${topic}. You have 45 seconds to prepare and 45 seconds to speak.`,
        sampleAnswer: `I have significant experience with ${topic}. For example, in my academic studies, I found this area particularly challenging but rewarding. The key was developing a systematic approach and practicing regularly.`,
        tips: [
          'Organize your response clearly',
          'Use specific examples',
          'Practice timing',
          'Speak clearly and confidently'
        ],
        topic
      });
    } else if (subject === 'Writing') {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `TOEFL Writing Task: Do you agree or disagree with the following statement: "${topic} is essential for academic success." Use specific reasons and examples to support your answer.`,
        sampleAnswer: `I strongly agree that ${topic} is essential for academic success. First, it provides foundational knowledge that supports advanced learning. Second, it develops critical thinking skills that are applicable across disciplines.`,
        tips: [
          'Take a clear position',
          'Provide specific examples',
          'Use connecting words',
          'Check grammar and vocabulary'
        ],
        topic
      });
    }
  }
  
  return content;
};

// IELTS-specific content generation
const generateIELTSContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject === 'Listening') {
      content.push({
        id: i + 1,
        type: 'question',
        question: `IELTS Listening: What strategy is most effective for ${topic}?`,
        options: [
          'Preview questions and predict answers',
          'Listen to every single word',
          'Focus only on the speaker\'s accent',
          'Ignore the question format'
        ],
        correct: 0,
        explanation: 'Previewing questions and predicting answers helps focus your listening effectively.',
        difficulty: 'Medium',
        topic
      });
    } else if (subject === 'Reading') {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `IELTS Reading: Research on ${topic} has shown remarkable developments in recent years. The implications of these findings extend far beyond academic circles, influencing policy decisions and practical applications in various sectors. Understanding these developments requires careful analysis of the evidence presented.`,
        question: 'What does the passage suggest about recent research?',
        options: [
          'It has broad implications beyond academia',
          'It is limited to academic circles only',
          'It has no practical applications',
          'It lacks sufficient evidence'
        ],
        correct: 0,
        explanation: 'The passage states that implications extend far beyond academic circles.',
        topic
      });
    } else if (subject === 'Writing') {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `IELTS Writing Task 2: Some people believe that ${topic} is crucial for modern society. Others argue it is overrated. Discuss both views and give your own opinion.`,
        sampleAnswer: `While some argue that ${topic} is essential for progress, others contend it receives disproportionate attention. Both perspectives have merit, but I believe a balanced approach considering multiple factors is most appropriate.`,
        tips: [
          'Address both viewpoints',
          'Provide clear examples',
          'State your opinion clearly',
          'Use formal academic language'
        ],
        topic
      });
    } else if (subject === 'Speaking') {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `IELTS Speaking Part 2: Describe a time when you encountered ${topic}. You should say: what happened, how you dealt with it, and what you learned from the experience.`,
        sampleAnswer: `I remember a significant experience with ${topic} during my studies. The situation required careful consideration and planning. I learned valuable lessons about preparation and adaptability.`,
        tips: [
          'Structure your response clearly',
          'Include personal details',
          'Use a range of vocabulary',
          'Maintain fluency over accuracy'
        ],
        topic
      });
    }
  }
  
  return content;
};

// GMAT-specific content generation  
const generateGMATContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject === 'Quantitative') {
      content.push({
        id: i + 1,
        type: 'question',
        question: `GMAT Quant: A company's profit increased by ${20 + i * 5}% from last year. If this year's profit is $${120 + i * 10}K, what was last year's profit?`,
        options: [
          `$${Math.round((120 + i * 10) / (1 + (20 + i * 5) / 100))}K`,
          `$${120 + i * 10 - (20 + i * 5)}K`,
          `$${(120 + i * 10) * (20 + i * 5) / 100}K`,
          `$${120 + i * 10 + (20 + i * 5)}K`
        ],
        correct: 0,
        explanation: `If x is last year's profit, then x × (1 + ${(20 + i * 5) / 100}) = ${120 + i * 10}`,
        difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
        topic
      });
    } else if (subject === 'Verbal') {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `GMAT Critical Reasoning: A business consultant argues that ${topic} is the primary factor determining organizational success. However, this conclusion may be premature given the limited scope of the data analyzed and the failure to consider alternative explanations for the observed outcomes.`,
        question: 'Which of the following best describes a weakness in the consultant\'s argument?',
        options: [
          'Limited data scope and failure to consider alternatives',
          'Overemphasis on statistical significance',
          'Lack of business experience',
          'Insufficient focus on the primary factor'
        ],
        correct: 0,
        explanation: 'The passage explicitly mentions limited data scope and failure to consider alternatives.',
        topic
      });
    } else if (subject === 'Integrated Reasoning') {
      content.push({
        id: i + 1,
        type: 'question',
        question: `GMAT IR: Given data about ${topic}, which two pieces of information together would be sufficient to determine the outcome?`,
        options: [
          'Market trends and historical performance',
          'Market trends only',
          'Historical performance only',
          'Neither piece alone or together'
        ],
        correct: 0,
        explanation: 'Both market trends and historical performance together provide sufficient information.',
        difficulty: 'Medium',
        topic
      });
    } else if (subject === 'AWA') {
      content.push({
        id: i + 1,
        type: 'prompt',
        prompt: `GMAT AWA: Analyze the following argument: "Companies that invest heavily in ${topic} always outperform their competitors in the long term."`,
        sampleAnswer: 'This argument contains several logical flaws, including overgeneralization and failure to consider confounding variables that may influence company performance.',
        tips: [
          'Identify assumptions',
          'Consider alternative explanations',
          'Evaluate evidence quality',
          'Suggest improvements'
        ],
        topic
      });
    }
  }
  
  return content;
};

// LSAT-specific content generation
const generateLSATContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject === 'Logical Reasoning') {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `LSAT Logical Reasoning: Attorney: "All cases involving ${topic} require extensive preparation. This case involves ${topic}. Therefore, this case requires extensive preparation."`,
        question: 'The attorney\'s reasoning follows which logical pattern?',
        options: [
          'All A are B; X is A; therefore X is B',
          'Some A are B; X is A; therefore X is B',
          'All A are B; X is B; therefore X is A',
          'No A are B; X is A; therefore X is not B'
        ],
        correct: 0,
        explanation: 'This follows the valid logical pattern: All A are B; X is A; therefore X is B.',
        topic
      });
    } else if (subject === 'Reading Comprehension') {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `LSAT Reading: The legal implications of ${topic} have been extensively debated in recent court cases. Legal scholars argue that current legislation fails to address the nuanced aspects of this issue, potentially leading to inconsistent judicial decisions. The author suggests that comprehensive reform is necessary.`,
        question: 'The author\'s primary purpose is to:',
        options: [
          'Advocate for comprehensive legal reform',
          'Criticize recent court cases',
          'Defend current legislation',
          'Analyze judicial decision-making'
        ],
        correct: 0,
        explanation: 'The author concludes by suggesting that comprehensive reform is necessary.',
        topic
      });
    } else if (subject === 'Analytical Reasoning') {
      content.push({
        id: i + 1,
        type: 'question',
        question: `LSAT Logic Games: In a sequence related to ${topic}, if condition X applies, then Y must come before Z. If Y comes after Z, what can we conclude?`,
        options: [
          'Condition X does not apply',
          'Condition X must apply',
          'Y and Z are unrelated',
          'The sequence is invalid'
        ],
        correct: 0,
        explanation: 'By contrapositive logic: if Y does not come before Z, then condition X does not apply.',
        difficulty: 'Hard',
        topic
      });
    }
  }
  
  return content;
};

// Generate math-specific content
const generateMathContent = (topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (topic.toLowerCase().includes('algebra')) {
      content.push({
        id: i + 1,
        type: 'question',
        question: `Solve for x: ${2 + i}x + ${3 + i} = ${15 + i * 2}`,
        options: [
          `x = ${Math.floor((15 + i * 2 - 3 - i) / (2 + i))}`,
          `x = ${Math.floor((15 + i * 2 - 3 - i) / (2 + i)) + 1}`,
          `x = ${Math.floor((15 + i * 2 - 3 - i) / (2 + i)) - 1}`,
          `x = ${Math.floor((15 + i * 2 - 3 - i) / (2 + i)) + 2}`
        ],
        correct: 0,
        explanation: `Subtract ${3 + i} from both sides, then divide by ${2 + i}`,
        difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
        topic
      });
    } else if (topic.toLowerCase().includes('geometry')) {
      content.push({
        id: i + 1,
        type: 'question',
        question: `What is the area of a circle with radius ${2 + i}?`,
        options: [
          `${(2 + i) * (2 + i)}π`,
          `${2 * (2 + i)}π`,
          `${(2 + i)}π`,
          `${(2 + i) * (2 + i) * 2}π`
        ],
        correct: 0,
        explanation: `Area = πr² = π(${2 + i})² = ${(2 + i) * (2 + i)}π`,
        difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
        topic
      });
    } else {
      content.push({
        id: i + 1,
        type: 'question',
        question: `What is a key principle in ${topic}?`,
        options: [
          'Understand the underlying concepts',
          'Memorize formulas without understanding',
          'Skip practice problems',
          'Avoid reviewing mistakes'
        ],
        correct: 0,
        explanation: 'Understanding concepts deeply leads to better problem-solving ability.',
        difficulty: 'Medium',
        topic
      });
    }
  }
  
  return content;
};

// Generate verbal/reading content
const generateVerbalContent = (topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (topic.toLowerCase().includes('reading')) {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `Sample passage about ${topic}: Research shows that effective reading comprehension involves multiple cognitive processes including decoding, vocabulary knowledge, and background knowledge integration. Students who practice active reading strategies tend to show significant improvement in their comprehension scores.`,
        question: 'According to the passage, what contributes to effective reading comprehension?',
        options: [
          'Multiple cognitive processes',
          'Only vocabulary knowledge',
          'Just decoding skills',
          'Background knowledge alone'
        ],
        correct: 0,
        explanation: 'The passage states that reading comprehension involves multiple cognitive processes.',
        topic
      });
    } else {
      content.push({
        id: i + 1,
        type: 'question',
        question: `Which strategy is most effective for ${topic}?`,
        options: [
          'Active engagement with the material',
          'Passive reading without notes',
          'Speed reading only',
          'Memorization without understanding'
        ],
        correct: 0,
        explanation: 'Active engagement helps improve comprehension and retention.',
        difficulty: 'Medium',
        topic
      });
    }
  }
  
  return content;
};

// Generate writing content
const generateWritingContent = (topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    content.push({
      id: i + 1,
      type: 'prompt',
      prompt: `Write a ${sessionType === 'Practice' ? 'practice' : 'study'} response for: "Discuss the importance of ${topic} in effective communication."`,
      sampleAnswer: `${topic} plays a crucial role in effective communication by ensuring clarity, coherence, and impact. When writers master ${topic}, they can better convey their ideas to their intended audience.`,
      tips: [
        `Focus on clarity in your ${topic}`,
        'Use specific examples',
        'Maintain consistent style',
        'Consider your audience'
      ],
      topic
    });
  }
  
  return content;
};

// Generate generic content for other subjects
const generateGenericContent = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    content.push({
      id: i + 1,
      type: 'question',
      question: `What is an important aspect of ${topic} in ${subject}?`,
      options: [
        'Thorough understanding of core concepts',
        'Superficial memorization',
        'Avoiding practice',
        'Ignoring fundamentals'
      ],
      correct: 0,
      explanation: `Understanding core concepts is essential for mastering ${topic} in ${subject}.`,
      difficulty: 'Medium',
      topic
    });
  }
  
  return content;
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

// Get topics for specific exam and subject
export const getSubjectTopics = (examId: string, subject: string): string[] => {
  const curriculum = getExamCurriculum(examId);
  if (!curriculum) return [];
  
  const subjectData = curriculum.subjects.find(s => s.name === subject);
  return subjectData ? subjectData.topics.map(topic => topic.name) : [];
}; 