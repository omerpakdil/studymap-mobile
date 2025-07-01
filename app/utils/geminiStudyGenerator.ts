import { getCurriculumByExamId } from '@/app/data';
import { GoogleGenAI } from '@google/genai';
import { OnboardingData } from './onboardingData';

// API Key from environment variables with validation
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

// Validate API key
if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your-google-api-key-here') {
  console.warn('⚠️ Google API key not configured properly. Please set EXPO_PUBLIC_GOOGLE_API_KEY in your .env file');
  console.warn('💡 Get your API key from: https://aistudio.google.com/app/apikey');
}

// Initialize Google GenAI client with error handling
let genAI: GoogleGenAI | null = null;
try {
  if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'your-google-api-key-here') {
    genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  }
} catch (error) {
  console.error('❌ Failed to initialize Google GenAI:', error);
}

// Study program data types (same as Claude implementation)
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

// Generate intelligent prompt from onboarding data (same logic as Claude)
const generateGeminiPrompt = (onboardingData: OnboardingData): string => {
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
    const daysInWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let totalWeeklySlots = 0;
    
    daysInWeek.forEach(day => {
      const daySlots = scheduleData[day] || [];
      totalWeeklySlots += daySlots.length;
    });

    const baseHoursPerSlot = 1;
    let baseWeeklyHours = totalWeeklySlots * baseHoursPerSlot;

    const intensityMultiplier = {
      'relaxed': 0.7,
      'moderate': 0.85,
      'intensive': 1.0,
      'extreme': 1.2
    };

    const multiplier = intensityMultiplier[goalsData.studyIntensity as keyof typeof intensityMultiplier] || 0.85;
    const calculatedHours = Math.round(baseWeeklyHours * multiplier);

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

  const calculateTaskDuration = (): number => {
    const allSlots = Object.values(scheduleData).flat();
    if (allSlots.length === 0) return 60;
    
    const sessionLengthMultiplier = {
      'Short': 0.75,
      'Medium': 1.0,
      'Long': 1.5
    };
    
    const baseMinutes = 60;
    const multiplier = sessionLengthMultiplier[learningStyleData?.preferences?.sessionLength as keyof typeof sessionLengthMultiplier] || 1.0;
    return Math.round(baseMinutes * multiplier);
  };

  const typicalTaskDuration = calculateTaskDuration();

  // Get exam-specific subjects and create dynamic subject breakdown
  const examSubjects = getExamSubjects(examData.id);
  console.log('📚 Exam subjects for', examData.id, ':', examSubjects);
  const createSubjectBreakdown = () => {
    const breakdown: Record<string, any> = {};
    const totalSubjects = examSubjects.length;
    
    examSubjects.forEach((subject, index) => {
      const subjectTopics = getSubjectTopics(examData.id, subject);
      const avgProficiency = subjectTopics.reduce((sum, topic) => {
        return sum + (topicProficiency[topic] || 2);
      }, 0) / subjectTopics.length;
      
      const priority = Math.max(1, Math.round(4 - avgProficiency));
      const priorityWeight = (5 - priority) / totalSubjects;
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

  const subjectBreakdown = createSubjectBreakdown();

  // Calculate daily study time distribution - only for selected days
  const dailyHoursDistribution = Object.entries(scheduleData).reduce((acc, [day, slots]) => {
    if (slots && slots.length > 0) {
      acc[day] = slots.length; // Each slot = 1 hour
    }
    return acc;
  }, {} as Record<string, number>);

  const studyDays = Object.keys(dailyHoursDistribution);
  const totalWeeklySlots = Object.values(dailyHoursDistribution).reduce((sum, hours) => sum + hours, 0);
  
  console.log(`📅 Selected study days: ${studyDays.join(', ')}`);
  console.log(`⏰ Total weekly slots: ${totalWeeklySlots}, Weekly hours: ${weeklyHours}`);

  // Generate comprehensive prompt for Gemini
  const prompt = `
You are an expert educational AI that creates highly personalized study programs. Generate a comprehensive study program based on this user profile:

**USER PROFILE:**
- Exam: ${examData.name} (${examData.id})
- Target Score: ${goalsData.targetScore}
- Current Date: ${today.toISOString().split('T')[0]}
- Program Start Date: ${getNextStudyDay(scheduleData, today).toISOString().split('T')[0]}
- Exam Date: ${goalsData.examDate}
- Days Until Exam: ${daysUntilExam}
- Study Intensity: ${goalsData.studyIntensity}
- Total Weekly Hours: ${weeklyHours}
- Learning Style: ${learningStyleData?.primaryStyle || 'Visual'}

**STUDY SCHEDULE (Only selected days):**
${Object.entries(dailyHoursDistribution).map(([day, hours]) => 
  `${day}: ${hours} hours available (${scheduleData[day]?.join(', ')})`
).join('\n')}
${studyDays.length < 7 ? `\nNOTE: Study only on selected days: ${studyDays.join(', ')}. Other days = NO TASKS!` : ''}

**PROFICIENCY ASSESSMENT (Lower scores = more focus needed):**
${proficiencyContext}

**INTELLIGENT SUBJECT ALLOCATION:**
${JSON.stringify(subjectBreakdown, null, 2)}

**CRITICAL REQUIREMENTS:**

1. **DAILY TASK DISTRIBUTION:**
   - Generate tasks ONLY for selected study days: ${studyDays.join(', ')}
   - For 3-4 hour intensity, create ${Math.max(2, Math.floor(weeklyHours / studyDays.length / (typicalTaskDuration/60)))} tasks per study day
   - Fill ALL available time slots with appropriate tasks
   - Generate tasks for ${daysUntilExam} days total, but distribute across ${studyDays.length} study days per week
   - Non-study days (${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter(d => !studyDays.includes(d)).join(', ')}) should have NO tasks
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

**EXACT OUTPUT FORMAT (Return ONLY valid JSON):**

{
  "id": "study_program_${Date.now()}",
  "examType": "${examData.name}",
  "examDate": "${goalsData.examDate}",
  "startDate": "${getNextStudyDay(scheduleData, today).toISOString().split('T')[0]}",
  "endDate": "${examDate?.toISOString().split('T')[0]}",
  "totalDays": ${daysUntilExam},
  "weeklyHours": ${weeklyHours},
  "dailyTasks": [
    {
      "id": "task_1",
      "title": "Mathematics: Algebra - Day 1",
      "subject": "Mathematics", 
      "topic": "Algebra",
      "type": "study",
      "duration": ${typicalTaskDuration},
      "difficulty": "medium",
      "priority": "high",
      "description": "Detailed description of what to study for ${examData.name} preparation",
      "date": "${getNextStudyDay(scheduleData, today).toISOString().split('T')[0]}",
      "timeSlot": "${Object.values(scheduleData).flat()[0] || '09:00-10:00'}",
      "completed": false,
      "progress": 0,
      "resources": ["${examData.name} Study Guide", "Practice Materials"],
      "notes": ""
    }
  ],
  "weeklySchedule": {
    "week_1": [],
    "week_2": []
  },
  "subjectBreakdown": ${JSON.stringify(subjectBreakdown)},
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

**GENERATE ${Math.min(daysUntilExam, 14)} DAYS OF STUDY TASKS (FIRST 2 WEEKS):**

Create daily tasks for ${Math.min(daysUntilExam, 14)} days starting from ${getNextStudyDay(scheduleData, today).toISOString().split('T')[0]}. 

**TASK NAMING:** Use format "[Subject]: [Topic]" (e.g., "Mathematics: Algebra", "Reading: Comprehension")

**AVAILABLE SUBJECTS:** ${examSubjects.join(', ')}

**DISTRIBUTE ${Math.max(2, Math.floor(weeklyHours / studyDays.length / (typicalTaskDuration/60)))} TASKS PER STUDY DAY (only on ${studyDays.join(', ')}).**
`;

  return prompt;
};

// Validate and fix subject names in AI response
const validateAndFixSubjects = (response: any, examType?: string): any => {
  if (!response.dailyTasks || !Array.isArray(response.dailyTasks)) {
    return response;
  }

  // Define valid exam subjects mapping
  const subjectMapping: { [key: string]: string[] } = {
    'SAT': ['Mathematics', 'Reading', 'Writing'],
    'GRE': ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'],
    'TOEFL': ['Reading', 'Listening', 'Speaking', 'Writing'],
    'IELTS': ['Reading', 'Listening', 'Speaking', 'Writing'],
    'GMAT': ['Verbal', 'Quantitative', 'Analytical Writing', 'Integrated Reasoning'],
    'LSAT': ['Logical Reasoning', 'Reading Comprehension', 'Analytical Reasoning']
  };

  // Extract exam type from response or use fallback
  const responseExamType = examType || response.examType || 'SAT';
  const validSubjects = subjectMapping[responseExamType] || subjectMapping['SAT'];
  
  console.log(`🔍 Validating subjects for ${responseExamType}. Valid subjects:`, validSubjects);

  // Fix each task's subject
  response.dailyTasks = response.dailyTasks.map((task: any, index: number) => {
    const originalSubject = task.subject;
    
    // Check if subject is numeric or invalid
    if (!originalSubject || 
        /^\d+$/.test(originalSubject.toString()) || 
        !validSubjects.includes(originalSubject)) {
      
      console.log(`⚠️ Invalid subject detected: "${originalSubject}" at task ${index}`);
      
      // Assign subjects in round-robin fashion
      const fixedSubject = validSubjects[index % validSubjects.length];
      
      // Also fix the title if it contains the invalid subject
      let fixedTitle = task.title;
      if (fixedTitle && (fixedTitle.startsWith(originalSubject) || /^\d+:/.test(fixedTitle))) {
        // Extract topic after the colon or use generic topic
        const colonIndex = fixedTitle.indexOf(':');
        const topic = colonIndex > 0 ? fixedTitle.substring(colonIndex + 1).trim() : task.topic || 'Study Session';
        fixedTitle = `${fixedSubject}: ${topic}`;
      }
      
      console.log(`✅ Fixed subject: "${originalSubject}" → "${fixedSubject}"`);
      console.log(`✅ Fixed title: "${task.title}" → "${fixedTitle}"`);
      
      return {
        ...task,
        subject: fixedSubject,
        title: fixedTitle
      };
    }
    
    return task;
  });

  console.log('✅ Subject validation completed');
  return response;
};

// Call Gemini API with optional exam type for validation
const callGeminiAPI = async (prompt: string, examType?: string): Promise<any> => {
  try {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your-google-api-key-here') {
      throw new Error('Google API key not configured. Please set GOOGLE_API_KEY environment variable.');
    }
    
    if (!genAI) {
      throw new Error('Google GenAI client not initialized. Please check your API key configuration.');
    }
    
    console.log('🤖 Calling Gemini API for study program generation...');
    
    const model = genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 16384, // Balanced for comprehensive study plans
      }
    });

    const response = await model;
    
    if (response && response.text) {
      try {
        console.log('📝 Raw Gemini response length:', response.text.length);
        
        // Extract JSON from response text - try multiple patterns
        let jsonMatch = response.text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        } else {
          // Try finding JSON without code blocks but ensure it's complete
          jsonMatch = response.text.match(/\{[\s\S]*\}/);
          
          // Check if JSON seems complete (ends with closing brace)
          if (jsonMatch && !jsonMatch[0].trim().endsWith('}')) {
            console.log('⚠️ JSON appears incomplete, trying to fix...');
            // Try to find the last complete object
            const lastClosingBrace = jsonMatch[0].lastIndexOf('}');
            if (lastClosingBrace > 0) {
              jsonMatch[0] = jsonMatch[0].substring(0, lastClosingBrace + 1);
            }
          }
        }
        
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Debug the parsed response
          console.log('✅ Gemini API call successful');
          console.log('📊 Generated tasks:', parsedResponse.dailyTasks?.length || 0);
          console.log('📅 Date range:', parsedResponse.startDate, 'to', parsedResponse.endDate);
          console.log('🏆 Total days:', parsedResponse.totalDays);
          
          // Validate response structure
          if (!parsedResponse.dailyTasks || !Array.isArray(parsedResponse.dailyTasks)) {
            throw new Error('Invalid response: missing or invalid dailyTasks array');
          }
          
          // CRITICAL SUBJECT VALIDATION - Fix numeric subjects
          const validatedResponse = validateAndFixSubjects(parsedResponse, examType);
          
          return validatedResponse;
        } else {
          console.log('❌ No JSON found in response. First 500 chars:', response.text.substring(0, 500));
          throw new Error('No valid JSON found in Gemini response');
        }
      } catch (parseError) {
        console.error('❌ Error parsing Gemini JSON response:', parseError);
        console.log('🔍 Response preview:', response.text.substring(0, 1000));
        throw new Error('Invalid JSON response from Gemini API');
      }
    } else {
      throw new Error('Empty response from Gemini API');
    }
  } catch (error) {
    console.error('❌ Gemini API call failed:', error);
    throw error;
  }
};

// Generate study program using Gemini with chunked approach
export const generateStudyProgramWithGemini = async (
  onboardingData: OnboardingData, 
  onProgress?: (status: string, current: number, total: number) => void
): Promise<StudyProgram | null> => {
  try {
    const { examData, goalsData, scheduleData } = onboardingData;
    
    if (!examData || !goalsData) {
      throw new Error('Missing required onboarding data');
    }

    const examDate = parseExamDate(goalsData.examDate);
    if (!examDate) {
      throw new Error('Invalid exam date format');
    }

    const today = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`📅 Planning for ${daysUntilExam} days until exam`);

    if (daysUntilExam <= 14) {
      // Short term: Generate all days at once
      console.log('🔄 Using single-shot generation for short timeline');
      const prompt = generateGeminiPrompt(onboardingData);
      const response = await callGeminiAPI(prompt, examData.name);
      return response as StudyProgram;
    } else {
      // Long term: Use chunked generation
      console.log('🔄 Using chunked generation for long timeline');
      return await generateChunkedStudyProgram(onboardingData, daysUntilExam, onProgress);
    }
  } catch (error) {
    console.error('❌ Error generating study program with Gemini:', error);
    return null;
  }
};

// Generate long-term study program with full AI support
const generateChunkedStudyProgram = async (
  onboardingData: OnboardingData, 
  totalDays: number,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<StudyProgram | null> => {
  try {
    console.log(`🧩 Generating AI-powered program for ${totalDays} days`);
    
    // Strategy selection based on total days
    if (totalDays <= 28) {
      return await generateMultiChunkAI(onboardingData, totalDays, onProgress);
    } else {
      return await generateHybridAI(onboardingData, totalDays, onProgress);
    }

  } catch (error) {
    console.error('❌ Error in chunked generation:', error);
    return null;
  }
};

// Multi-chunk AI generation with weekly progression
const generateMultiChunkAI = async (
  onboardingData: OnboardingData, 
  totalDays: number,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<StudyProgram | null> => {
  try {
    console.log(`🤖 Using weekly-chunk AI for ${totalDays} days`);
    
    const chunkSize = 7; // Weekly chunks
    const chunks: any[] = [];
    const allPreviousTasks: StudyTask[] = [];
    let startDay = 0;
    
    // Calculate total number of weeks for progress tracking
    const totalWeeks = Math.ceil(totalDays / chunkSize);
    let currentWeek = 0;
    
    while (startDay < totalDays) {
      const remainingDays = totalDays - startDay;
      const currentChunkSize = Math.min(chunkSize, remainingDays);
      currentWeek++;
      
      console.log(`📅 Generating week ${currentWeek}: days ${startDay + 1}-${startDay + currentChunkSize}`);
      
      // Update progress
      if (onProgress) {
        onProgress(`Generating Week ${currentWeek}...`, currentWeek - 1, totalWeeks);
      }
      
      // Create context-aware prompt for this chunk
      const chunkPrompt = generateContextualChunkPrompt(
        onboardingData, 
        startDay, 
        currentChunkSize, 
        totalDays,
        allPreviousTasks
      );
      
      const chunkResult = await callGeminiAPI(chunkPrompt, onboardingData.examData?.name);
      
      if (chunkResult && chunkResult.dailyTasks) {
        chunks.push(chunkResult);
        allPreviousTasks.push(...chunkResult.dailyTasks);
        console.log(`✅ Week ${currentWeek}: ${chunkResult.dailyTasks.length} tasks (Total: ${allPreviousTasks.length})`);
        
        // Update progress - completed this week
        if (onProgress) {
          onProgress(`Week ${currentWeek} completed!`, currentWeek, totalWeeks);
        }
      } else {
        console.warn(`⚠️ Failed to generate week starting at day ${startDay}`);
        if (onProgress) {
          onProgress(`Week ${currentWeek} failed, retrying...`, currentWeek - 1, totalWeeks);
        }
      }
      
      startDay += currentChunkSize;
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Final progress update
    if (onProgress) {
      onProgress('Finalizing program...', totalWeeks, totalWeeks);
    }
    
    // Merge all chunks
    return mergeChunks(chunks, onboardingData, totalDays);
    
  } catch (error) {
    console.error('❌ Error in multi-chunk AI generation:', error);
    return null;
  }
};

// Hybrid AI generation for long-term plans (29+ days)
const generateHybridAI = async (
  onboardingData: OnboardingData, 
  totalDays: number,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<StudyProgram | null> => {
  try {
    console.log(`🔬 Using hybrid AI approach for ${totalDays} days`);
    
    // Calculate phases for progress tracking
    const phase1Days = Math.min(28, totalDays);
    const phase1Weeks = Math.ceil(phase1Days / 7);
    const remainingDays = totalDays - phase1Days;
    const phase2Weeks = remainingDays > 0 ? Math.ceil(remainingDays / 7) : 0;
    const totalWeeks = phase1Weeks + phase2Weeks;
    
    // Phase 1: Generate detailed first month (AI) - Now using weekly chunks
    if (onProgress) {
      onProgress('Starting Phase 1: Foundation Building...', 0, totalWeeks);
    }
    
    const phase1Result = await generateMultiChunkAI(onboardingData, phase1Days, (status, current, total) => {
      // Relay Phase 1 progress with proper scaling
      if (onProgress) {
        onProgress(`Phase 1: ${status}`, current, totalWeeks);
      }
    });
    
    if (!phase1Result) {
      throw new Error('Failed to generate Phase 1');
    }
    
    if (remainingDays <= 0) {
      if (onProgress) {
        onProgress('Program complete!', totalWeeks, totalWeeks);
      }
      return phase1Result;
    }
    
    console.log(`📊 Phase 1 complete: ${phase1Days} days with ${phase1Result.dailyTasks.length} tasks. Generating ${remainingDays} more days...`);
    
    // Phase 2: Generate strategic weekly plans with full context of Phase 1
    if (onProgress) {
      onProgress('Starting Phase 2: Advanced Planning...', phase1Weeks, totalWeeks);
    }
    
    const phase2Tasks = await generateStrategicWeeksWithContext(
      onboardingData, 
      remainingDays, 
      phase1Days,
      phase1Result.dailyTasks,
      (status, current, total) => {
        // Relay Phase 2 progress with proper offset
        if (onProgress) {
          onProgress(`Phase 2: ${status}`, phase1Weeks + current, totalWeeks);
        }
      }
    );
    
    // Combine phases
    const allTasks = [...phase1Result.dailyTasks, ...phase2Tasks];
    
    console.log(`🎯 Hybrid AI complete: Phase 1 (${phase1Result.dailyTasks.length}) + Phase 2 (${phase2Tasks.length}) = Total ${allTasks.length} tasks`);
    
    if (onProgress) {
      onProgress('Program complete!', totalWeeks, totalWeeks);
    }
    
    return {
      ...phase1Result,
      totalDays: totalDays,
      dailyTasks: allTasks,
      weeklySchedule: organizeTasksByWeek(allTasks),
      milestones: generateProgressiveMilestones(onboardingData, totalDays)
    };
    
  } catch (error) {
    console.error('❌ Error in hybrid AI generation:', error);
    return null;
  }
};

// Enhanced strategic weeks generation with Phase 1 context
const generateStrategicWeeksWithContext = async (
  onboardingData: OnboardingData, 
  remainingDays: number, 
  startDay: number,
  phase1Tasks: StudyTask[],
  onProgress?: (status: string, current: number, total: number) => void
): Promise<StudyTask[]> => {
  const tasks: StudyTask[] = [];
  const weekSize = 7;
  let currentStart = startDay;
  
  console.log(`🔄 Starting Phase 2 with ${phase1Tasks.length} Phase 1 tasks as context`);
  
  // Calculate total weeks for progress tracking
  const totalWeeks = Math.ceil(remainingDays / weekSize);
  let currentWeek = 0;
  
  while (currentStart < startDay + remainingDays) {
    const chunkSize = Math.min(weekSize, remainingDays - (currentStart - startDay));
    
    if (chunkSize >= 7) { // Only generate AI chunks for full weeks
      currentWeek++;
      const overallWeekNumber = Math.floor(currentStart / 7) + 1;
      
      console.log(`🎯 Generating strategic week ${overallWeekNumber}: days ${currentStart + 1}-${currentStart + chunkSize}`);
      
      if (onProgress) {
        onProgress(`Generating Week ${overallWeekNumber}...`, currentWeek - 1, totalWeeks);
      }
      
      // Use Phase 1 tasks + all current strategic phase tasks as context
      const allPreviousTasks = [...phase1Tasks, ...tasks];
      
      const weekPrompt = generateContextualChunkPrompt(
        onboardingData, 
        currentStart, 
        chunkSize, 
        startDay + remainingDays,
        allPreviousTasks
      );
      
      const weekResult = await callGeminiAPI(weekPrompt, onboardingData.examData?.name);
      
      if (weekResult && weekResult.dailyTasks) {
        tasks.push(...weekResult.dailyTasks);
        console.log(`✅ Strategic week ${overallWeekNumber}: ${weekResult.dailyTasks.length} tasks added (Phase 2 total: ${tasks.length})`);
        
        if (onProgress) {
          onProgress(`Week ${overallWeekNumber} completed!`, currentWeek, totalWeeks);
        }
      } else {
        console.warn(`⚠️ Failed to generate week ${overallWeekNumber}`);
        if (onProgress) {
          onProgress(`Week ${overallWeekNumber} failed, retrying...`, currentWeek - 1, totalWeeks);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limiting
    }
    
    currentStart += chunkSize;
  }
  
  return tasks;
};

// Generate context-aware chunk prompt with previous tasks knowledge
const generateContextualChunkPrompt = (
  onboardingData: OnboardingData, 
  startDay: number, 
  chunkDays: number, 
  totalDays: number,
  previousTasks: StudyTask[] = []
): string => {
  const { examData, goalsData, scheduleData, topicProficiency, learningStyleData } = onboardingData;
  
  if (!examData || !goalsData) {
    throw new Error('Missing required data for chunk prompt');
  }

  const today = new Date();
  const chunkStartDate = new Date(today);
  chunkStartDate.setDate(today.getDate() + startDay);
  
  const chunkEndDate = new Date(today);
  chunkEndDate.setDate(today.getDate() + startDay + chunkDays - 1);
  
  const examDate = parseExamDate(goalsData.examDate);
  const daysUntilExam = examDate ? Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : totalDays;
  
  // Calculate weekly hours with proper day mapping
  const calculateWeeklyHours = (): number => {
    let totalWeeklySlots = 0;
    
    Object.entries(scheduleData).forEach(([dayKey, slots]) => {
      if (slots && slots.length > 0) {
        totalWeeklySlots += slots.length;
      }
    });

    const intensityMultiplier = {
      'relaxed': 0.7,
      'moderate': 0.85,
      'intensive': 1.0,
      'extreme': 1.2
    };

    const multiplier = intensityMultiplier[goalsData.studyIntensity as keyof typeof intensityMultiplier] || 0.85;
    const calculatedHours = Math.round(totalWeeklySlots * multiplier);
    return Math.max(5, Math.min(40, calculatedHours));
  };

  const weeklyHours = calculateWeeklyHours();
  const examSubjects = getExamSubjects(examData.id);
  
  // Current week and phase analysis
  const currentWeek = Math.floor(startDay / 7) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  
  let phaseDescription = '';
  if (currentWeek <= 2) {
    phaseDescription = 'FOUNDATION PHASE - Focus on fundamental concepts and assessment';
  } else if (currentWeek <= totalWeeks * 0.6) {
    phaseDescription = 'BUILDING PHASE - Practice and skill development';
  } else if (currentWeek <= totalWeeks * 0.8) {
    phaseDescription = 'MASTERY PHASE - Advanced practice and weak area focus';
  } else {
    phaseDescription = 'FINAL PREP PHASE - Full practice tests and exam strategies';
  }

  // Analyze previous tasks for continuity
  let previousContext = '';
  if (previousTasks.length > 0) {
    const subjectCoverage = examSubjects.map(subject => {
      const subjectTasks = previousTasks.filter(task => task.subject === subject);
      const topicsCovered = [...new Set(subjectTasks.map(task => task.topic))];
      return `${subject}: ${topicsCovered.length} topics covered (${topicsCovered.slice(0, 3).join(', ')}${topicsCovered.length > 3 ? '...' : ''})`;
    });

    const lastWeekTasks = previousTasks.slice(-7);
    const recentTopics = [...new Set(lastWeekTasks.map(task => `${task.subject}: ${task.topic}`))];

    // Get sample tasks from previous weeks to show proper format
    const samplePreviousTasks = previousTasks.slice(0, 3).map(task => ({
      title: task.title,
      subject: task.subject,
      topic: task.topic
    }));

    previousContext = `
**PREVIOUS PROGRESS SUMMARY:**
- Total tasks completed: ${previousTasks.length}
- Weeks completed: ${Math.floor(previousTasks.length / 7)}
- Subject coverage so far:
${subjectCoverage.join('\n')}
- Recent topics from last week:
${recentTopics.slice(0, 5).join(', ')}

**SUCCESSFUL TASK FORMAT EXAMPLES FROM PREVIOUS WEEKS:**
${samplePreviousTasks.map(task => `- Title: "${task.title}", Subject: "${task.subject}", Topic: "${task.topic}"`).join('\n')}

**CRITICAL FORMAT REQUIREMENTS:**
- Subject field must ALWAYS be a clear subject name like "${examSubjects[0]}", "${examSubjects[1] || examSubjects[0]}", etc.
- NEVER use numbers (0, 1, 2, 3) as subject names
- Subject must match one of the valid exam subjects: ${examSubjects.join(', ')}
- Use the EXACT same format as the successful examples above
- Title should be "Subject: Topic" format (e.g., "Mathematics: Algebra")

**CONTINUITY REQUIREMENTS:**
- Build upon previous topics without exact repetition
- Progress to more advanced concepts in covered subjects  
- Address any subjects that have been underrepresented
- Increase difficulty gradually from previous weeks`;
  } else {
    previousContext = `
**FIRST WEEK REQUIREMENTS:**
- Start with fundamentals and assessment
- Cover all exam subjects at basic level
- Focus on identifying student's actual proficiency levels`;
  }

  return `
You are creating Week ${currentWeek} (Days ${startDay + 1}-${startDay + chunkDays}) of a ${totalDays}-day ${examData.name} exam preparation program.

**PROGRAM CONTEXT:**
- Current Phase: ${phaseDescription}
- Week ${currentWeek} of ${totalWeeks} total weeks
- Date Range: ${chunkStartDate.toISOString().split('T')[0]} to ${chunkEndDate.toISOString().split('T')[0]}
- Days until exam: ${daysUntilExam}
- Weekly study hours: ${weeklyHours}

**EXAM SUBJECTS:** ${examSubjects.join(', ')}

**STUDENT PROFICIENCY (Initial Assessment):**
${Object.entries(topicProficiency)
  .map(([topic, level]) => `${topic}: ${level}/4`)
  .join(', ')}

${previousContext}

**SCHEDULE CONSTRAINTS (Study Days Only):**
${Object.entries(scheduleData)
  .filter(([day, slots]) => slots && slots.length > 0)
  .map(([day, slots]) => `${day}: ${(slots as string[]).join(', ')}`)
  .join('\n')}

**CRITICAL DATE REQUIREMENTS:**
- Generate tasks ONLY for these study days: ${Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).join(', ')}
- When generating dates, ensure they correspond to the correct calendar days (Monday, Tuesday, etc.)
- Start from the specified start date and only create tasks for study days
- Skip non-study days completely - NO TASKS on other days!
- Double-check date alignment to prevent day shifting issues

**THIS WEEK'S OBJECTIVES:**
1. Generate tasks for ${chunkDays} days, but ONLY for study days: ${Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).join(', ')}
2. For 3-4 hour intensity, create ${Math.max(2, Math.ceil(weeklyHours / Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).length / (60/60)))} tasks per study day
3. Each task must have: id, title (Subject: Topic), subject, topic, type, duration, difficulty, priority, description, date, timeSlot
4. Week ${currentWeek} difficulty level: ${currentWeek <= 2 ? 'beginner-intermediate' : currentWeek <= totalWeeks * 0.6 ? 'intermediate' : currentWeek <= totalWeeks * 0.8 ? 'intermediate-advanced' : 'advanced-expert'}
5. Ensure logical progression from previous tasks
6. Focus on weak subjects (proficiency 0-1) more than strong ones (3-4)
7. Use clear task titles: "Mathematics: Algebra", "Reading: Critical Analysis"
8. Vary task types: study, practice, review, quiz, mock_test
9. Fill all available time slots for selected days

**MANDATORY SUBJECT VALIDATION:**
- Valid subjects for ${examData.name}: ${examSubjects.join(', ')}
- Each task's "subject" field MUST be one of these exact strings
- NEVER use numbers, indices, or abbreviations as subject names
- Double-check every task has a valid subject name before responding

**OUTPUT FORMAT:** Return ONLY valid JSON with dailyTasks array containing exactly ${chunkDays} tasks.

{
  "id": "week_${currentWeek}_${Date.now()}",
  "dailyTasks": [
    {
      "id": "task_w${currentWeek}_d1",
      "title": "${examSubjects[0]}: Foundational Concepts",
      "subject": "${examSubjects[0]}",
      "topic": "Foundational Concepts", 
      "type": "study",
      "duration": 60,
      "difficulty": "medium",
      "priority": "high",
      "description": "Study ${examSubjects[0].toLowerCase()} concepts building on previous work",
      "date": "${chunkStartDate.toISOString().split('T')[0]}",
      "timeSlot": "09:00-10:00",
      "completed": false,
      "progress": 0,
      "resources": ["${examData.name} Study Guide"],
      "notes": ""
    }
  ]
}

**FINAL VALIDATION CHECKLIST:**
✓ All subjects are from the valid list: ${examSubjects.join(', ')}
✓ No numeric subjects (0, 1, 2, 3)
✓ Title format is "Subject: Topic"
✓ Tasks only on study days: ${Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).join(', ')}`;
};

// Legacy chunk prompt for compatibility
const generateChunkPrompt = (onboardingData: OnboardingData, startDay: number, chunkDays: number, totalDays: number): string => {
  const { examData, goalsData, scheduleData, topicProficiency, learningStyleData } = onboardingData;
  
  if (!examData || !goalsData) {
    throw new Error('Missing required data for chunk prompt');
  }

  const today = new Date();
  const chunkStartDate = new Date(today);
  chunkStartDate.setDate(today.getDate() + startDay);
  
  const chunkEndDate = new Date(today);
  chunkEndDate.setDate(today.getDate() + startDay + chunkDays - 1);
  
  const examDate = parseExamDate(goalsData.examDate);
  const daysUntilExam = examDate ? Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : totalDays;
  
  // Calculate weekly hours (same logic as main prompt)
  const calculateWeeklyHours = (): number => {
    const daysInWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let totalWeeklySlots = 0;
    
    daysInWeek.forEach(day => {
      const daySlots = scheduleData[day] || [];
      totalWeeklySlots += daySlots.length;
    });

    const intensityMultiplier = {
      'relaxed': 0.7,
      'moderate': 0.85,
      'intensive': 1.0,
      'extreme': 1.2
    };

    const multiplier = intensityMultiplier[goalsData.studyIntensity as keyof typeof intensityMultiplier] || 0.85;
    const calculatedHours = Math.round(totalWeeklySlots * multiplier);
    return Math.max(5, Math.min(40, calculatedHours));
  };

  const weeklyHours = calculateWeeklyHours();
  const examSubjects = getExamSubjects(examData.id);
  
  // Phase classification
  let phaseDescription = '';
  const totalWeeks = Math.ceil(totalDays / 7);
  const currentWeek = Math.ceil((startDay + 1) / 7);
  
  if (currentWeek <= 2) {
    phaseDescription = 'FOUNDATION PHASE - Focus on fundamental concepts and assessment';
  } else if (currentWeek <= totalWeeks * 0.6) {
    phaseDescription = 'BUILDING PHASE - Practice and skill development';
  } else if (currentWeek <= totalWeeks * 0.8) {
    phaseDescription = 'MASTERY PHASE - Advanced practice and weak area focus';
  } else {
    phaseDescription = 'FINAL PREP PHASE - Full practice tests and exam strategies';
  }

  return `
You are creating a ${chunkDays}-day study plan segment for ${examData.name} exam preparation.

**CONTEXT:**
- This is Days ${startDay + 1}-${startDay + chunkDays} of a ${totalDays}-day program
- Current Phase: ${phaseDescription}
- Date Range: ${chunkStartDate.toISOString().split('T')[0]} to ${chunkEndDate.toISOString().split('T')[0]}
- Days until exam: ${daysUntilExam}
- Weekly study hours: ${weeklyHours}

**SUBJECTS:** ${examSubjects.join(', ')}

**STUDENT PROFICIENCY:**
${Object.entries(topicProficiency)
  .map(([topic, level]) => `${topic}: ${level}/4`)
  .join(', ')}

**SCHEDULE:**
${Object.entries(scheduleData)
  .map(([day, slots]) => `${day}: ${(slots as string[]).join(', ')}`)
  .filter(entry => !entry.endsWith(': '))
  .join('\n')}

**REQUIREMENTS:**
1. Generate exactly ${chunkDays} days of tasks
2. Each task needs: id, title (Subject: Topic), subject, topic, type, duration, difficulty, priority, description, date, timeSlot
3. Progressive difficulty: Week ${currentWeek} should be ${currentWeek <= 2 ? 'easy-medium' : currentWeek <= totalWeeks * 0.6 ? 'medium' : 'medium-hard'}
4. Focus on weak subjects (proficiency 0-1) more than strong ones (3-4)
5. Use realistic task titles like "${examSubjects[0]}: Advanced Topics", "${examSubjects[1] || examSubjects[0]}: Practice Problems"

**MANDATORY SUBJECT VALIDATION:**
- Valid subjects for ${examData.name}: ${examSubjects.join(', ')}
- Each task's "subject" field MUST be one of these exact strings
- NEVER use numbers, indices, or abbreviations as subject names
- Double-check every task has a valid subject name before responding

**OUTPUT:** Return ONLY valid JSON with dailyTasks array containing ${chunkDays} days of study tasks.

{
  "id": "chunk_${startDay}_${Date.now()}",
  "dailyTasks": [
    {
      "id": "task_${startDay}_1",
      "title": "${examSubjects[0]}: Advanced Topics",
      "subject": "${examSubjects[0]}",
      "topic": "Advanced Topics", 
      "type": "study",
      "duration": 60,
      "difficulty": "medium",
      "priority": "high",
      "description": "Study ${examSubjects[0].toLowerCase()} concepts and applications",
      "date": "${chunkStartDate.toISOString().split('T')[0]}",
      "timeSlot": "09:00-10:00",
      "completed": false,
      "progress": 0,
      "resources": ["${examData.name} Study Guide"],
      "notes": ""
    }
  ]
}

**FINAL VALIDATION CHECKLIST:**
✓ All subjects are from the valid list: ${examSubjects.join(', ')}
✓ No numeric subjects (0, 1, 2, 3)
✓ Title format is "Subject: Topic"`;
};

// Strategic weekly generation for very long plans with full context
const generateStrategicMonths = async (onboardingData: OnboardingData, remainingDays: number, startDay: number): Promise<StudyTask[]> => {
  const tasks: StudyTask[] = [];
  const weekSize = 7; // Weekly chunks for consistency
  let currentStart = startDay;
  
  // Get the first 28 days as baseline context (from phase 1)
  const phase1Tasks: StudyTask[] = [];
  
  while (currentStart < startDay + remainingDays) {
    const chunkSize = Math.min(weekSize, remainingDays - (currentStart - startDay));
    
    if (chunkSize >= 7) { // Only generate AI chunks for full weeks
      const weekNumber = Math.floor(currentStart / 7) + 1;
      console.log(`🎯 Generating strategic week ${weekNumber}: days ${currentStart + 1}-${currentStart + chunkSize}`);
      
      // Use all previous tasks (phase 1 + current strategic phase tasks)
      const allPreviousTasks = [...phase1Tasks, ...tasks];
      
      const weekPrompt = generateContextualChunkPrompt(
        onboardingData, 
        currentStart, 
        chunkSize, 
        startDay + remainingDays,
        allPreviousTasks
      );
      
      const weekResult = await callGeminiAPI(weekPrompt, onboardingData.examData?.name);
      
      if (weekResult && weekResult.dailyTasks) {
        tasks.push(...weekResult.dailyTasks);
        console.log(`✅ Strategic week ${weekNumber}: ${weekResult.dailyTasks.length} tasks added (Total strategic: ${tasks.length})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limiting
    }
    
    currentStart += chunkSize;
  }
  
  return tasks;
};

// Merge multiple chunks into single program
const mergeChunks = (chunks: any[], onboardingData: OnboardingData, totalDays: number): StudyProgram => {
  const { examData, goalsData } = onboardingData;
  const today = new Date();
  const examDate = parseExamDate(goalsData!.examDate);
  
  const allTasks: StudyTask[] = [];
  chunks.forEach(chunk => {
    if (chunk.dailyTasks) {
      allTasks.push(...chunk.dailyTasks);
    }
  });
  
  return {
    id: `ai_program_${Date.now()}`,
    examType: examData!.name,
    examDate: goalsData!.examDate,
    startDate: today.toISOString().split('T')[0],
    endDate: examDate?.toISOString().split('T')[0] || today.toISOString().split('T')[0],
    totalDays: totalDays,
    weeklyHours: chunks[0]?.weeklyHours || 10,
    dailyTasks: allTasks,
    weeklySchedule: organizeTasksByWeek(allTasks),
    subjectBreakdown: chunks[0]?.subjectBreakdown || {},
    milestones: generateProgressiveMilestones(onboardingData, totalDays),
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
};

// Extract weekly pattern from first 14 days
const extractWeeklyPattern = (firstTasks: StudyTask[]): WeeklyPattern => {
  const pattern: WeeklyPattern = {
    subjects: [],
    types: [],
    durations: [],
    difficulties: []
  };

  // Group tasks by day of week
  const tasksByDay: { [key: number]: StudyTask[] } = {};
  
  firstTasks.forEach(task => {
    const taskDate = new Date(task.date);
    const dayOfWeek = taskDate.getDay();
    if (!tasksByDay[dayOfWeek]) {
      tasksByDay[dayOfWeek] = [];
    }
    tasksByDay[dayOfWeek].push(task);
  });

  // Extract patterns
  Object.values(tasksByDay).forEach(dayTasks => {
    dayTasks.forEach(task => {
      if (!pattern.subjects.includes(task.subject)) {
        pattern.subjects.push(task.subject);
      }
      pattern.types.push(task.type);
      pattern.durations.push(task.duration);
      pattern.difficulties.push(task.difficulty);
    });
  });

  return pattern;
};

// Generate tasks using the extracted pattern
const generateTasksFromPattern = (
  onboardingData: OnboardingData, 
  pattern: WeeklyPattern, 
  remainingDays: number, 
  startDay: number
): StudyTask[] => {
  const { examData, scheduleData, topicProficiency } = onboardingData;
  
  if (!examData) {
    return [];
  }
  
  const tasks: StudyTask[] = [];
  const examSubjects = getExamSubjects(examData.id);
  
  const today = new Date();
  
  console.log(`🔄 Generating pattern tasks for ${remainingDays} days starting from day ${startDay}`);
  console.log('👥 Available subjects:', examSubjects);
  console.log('📅 Schedule data:', scheduleData);
  
  for (let day = 0; day < remainingDays; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + startDay + day);
    const dateString = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    
    // Get available time slots for this day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    const availableSlots = scheduleData[dayName] || [];
    
    console.log(`📅 Day ${startDay + day} (${dateString}, ${dayName}): ${availableSlots.length} slots available`, availableSlots);
    
    if (availableSlots.length === 0) {
      console.log(`⏭️ Skipping ${dayName} - no study time scheduled`);
      continue; // Skip days with no study time
    }
    
    // Generate tasks for this day based on pattern
    const tasksForDay = Math.min(availableSlots.length, 2); // Max 2 tasks per day
    
    console.log(`📝 Creating ${tasksForDay} tasks for day ${startDay + day}`);
    
    for (let taskIndex = 0; taskIndex < tasksForDay; taskIndex++) {
      const subjectIndex = (day + taskIndex) % examSubjects.length;
      const subject = examSubjects[subjectIndex];
      const topics = getSubjectTopics(examData.id, subject);
      const topic = topics[(day + taskIndex) % topics.length] || 'General Review';
      
      console.log(`  📚 Task ${taskIndex}: ${subject} - ${topic}`);
      
      // Progressive difficulty and type
      const weekNumber = Math.floor((startDay + day) / 7) + 1;
      const type = getProgressiveTaskType(weekNumber);
      const difficulty = getProgressiveDifficulty(weekNumber);
      
      const task: StudyTask = {
        id: `generated_task_${startDay + day}_${taskIndex}_${Date.now()}`,
        title: `${subject}: ${topic}`,
        subject: subject,
        topic: topic,
        type: type,
        duration: pattern.durations[taskIndex % pattern.durations.length] || 60,
        difficulty: difficulty,
        priority: getTopicPriority(topic, topicProficiency),
        description: `Study ${topic} in ${subject} - ${type} session`,
        date: dateString,
        timeSlot: availableSlots[taskIndex] || availableSlots[0],
        completed: false,
        progress: 0,
        resources: [`${examData.name} ${subject} Materials`],
        notes: `Week ${weekNumber} - Progressive ${type} session`
      };
      
      tasks.push(task);
      console.log(`  ✅ Created task: ${task.title} for ${task.date}`);
    }
  }
  
  console.log(`🎯 Pattern generation complete: ${tasks.length} tasks created`);
  return tasks;
};

// Helper functions for pattern generation
interface WeeklyPattern {
  subjects: string[];
  types: ('study' | 'practice' | 'review' | 'quiz')[];
  durations: number[];
  difficulties: ('easy' | 'medium' | 'hard')[];
}

const getProgressiveTaskType = (weekNumber: number): 'study' | 'practice' | 'review' | 'quiz' => {
  if (weekNumber <= 2) return 'study';
  if (weekNumber <= 4) return 'practice';
  if (weekNumber <= 6) return 'review';
  return 'quiz';
};

const getProgressiveDifficulty = (weekNumber: number): 'easy' | 'medium' | 'hard' => {
  if (weekNumber <= 3) return 'easy';
  if (weekNumber <= 6) return 'medium';
  return 'hard';
};

const getTopicPriority = (topic: string, proficiency: any): 'high' | 'medium' | 'low' => {
  const level = proficiency[topic] || 2;
  if (level <= 1) return 'high';
  if (level <= 2) return 'medium';
  return 'low';
};

// Organize tasks by week for weekly schedule
const organizeTasksByWeek = (tasks: StudyTask[]): { [week: string]: StudyTask[] } => {
  const weeks: { [week: string]: StudyTask[] } = {};
  
  tasks.forEach(task => {
    const taskDate = new Date(task.date);
    const startDate = new Date(tasks[0].date);
    const daysDiff = Math.floor((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    const weekKey = `week_${weekNumber}`;
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(task);
  });
  
  return weeks;
};

// Generate progressive milestones for long-term planning
const generateProgressiveMilestones = (onboardingData: OnboardingData, totalDays: number) => {
  const { examData } = onboardingData;
  
  if (!examData) {
    return [];
  }
  
  const milestones = [];
  const today = new Date();
  
  const totalWeeks = Math.ceil(totalDays / 7);
  
  for (let week = 1; week <= totalWeeks; week += 2) { // Every 2 weeks
    const milestoneDate = new Date(today);
    milestoneDate.setDate(today.getDate() + (week * 7));
    
    let title = `Week ${week} Checkpoint`;
    let description = `Complete foundational review`;
    
    if (week <= 2) {
      title = `Foundation Phase Complete`;
      description = `Master basic concepts in all ${examData.name} subjects`;
    } else if (week <= 4) {
      title = `Practice Phase Complete`;
      description = `Regular practice sessions and skill building`;
    } else if (week <= 6) {
      title = `Review Phase Complete`;
      description = `Comprehensive review and weak area focus`;
    } else {
      title = `Final Prep Phase`;
      description = `Full practice tests and exam strategies`;
    }
    
    milestones.push({
      date: milestoneDate.toISOString().split('T')[0],
      title: title,
      description: description,
      completed: false
    });
  }
  
  return milestones;
};

// Helper function to map between different day formats and handle schedule alignment
const getDayMapping = () => ({
  'monday': 'Monday',
  'tuesday': 'Tuesday', 
  'wednesday': 'Wednesday',
  'thursday': 'Thursday',
  'friday': 'Friday',
  'saturday': 'Saturday',
  'sunday': 'Sunday',
  'Monday': 'monday',
  'Tuesday': 'tuesday',
  'Wednesday': 'wednesday', 
  'Thursday': 'thursday',
  'Friday': 'friday',
  'Saturday': 'saturday',
  'Sunday': 'sunday'
});

// Get study days from schedule data
const getStudyDays = (scheduleData: any): string[] => {
  return Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0);
};

// Get next study day starting from today
const getNextStudyDay = (scheduleData: any, startDate: Date = new Date()): Date => {
  const studyDays = getStudyDays(scheduleData);
  const dayMapping = getDayMapping();
  
  // Convert schedule day keys to day names for checking
  const studyDayNames = studyDays.map(day => dayMapping[day as keyof typeof dayMapping] || day);
  
  const currentDate = new Date(startDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Check if today is a study day
  const todayName = dayNames[currentDate.getDay()];
  if (studyDayNames.includes(todayName)) {
    console.log(`📅 Today (${todayName}) is a study day, starting from today`);
    return currentDate;
  }
  
  // Find next study day
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + i);
    const nextDayName = dayNames[nextDate.getDay()];
    
    if (studyDayNames.includes(nextDayName)) {
      console.log(`📅 Next study day: ${nextDayName} (${i} days from today)`);
      return nextDate;
    }
  }
  
  // Fallback to today if no study days found
  console.warn('⚠️ No study days found in schedule, starting from today');
  return currentDate;
};

// Check if a given date falls on a study day
const isStudyDay = (date: Date, scheduleData: any): boolean => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  const dayMapping = getDayMapping();
  const scheduleKey = dayMapping[dayName as keyof typeof dayMapping];
  
  return scheduleKey && scheduleData[scheduleKey] && scheduleData[scheduleKey].length > 0;
};

// Content generation types (same as Claude)
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

// Generate study content using Gemini
export const generateStudyContentWithGemini = async (params: ContentGenerationParams): Promise<ContentItem[]> => {
  try {
    console.log('🤖 Generating study content with Gemini for:', params);

    // Try to get curriculum data for context
    const curriculum = getCurriculumByExamId(params.examId);
    const itemsCount = Math.max(3, Math.min(8, Math.floor(params.duration / 10)));

    // Create Gemini prompt for content generation
    const contentPrompt = `
You are an expert educational content creator specializing in ${params.examId} exam preparation.

**REQUEST:**
Generate ${itemsCount} study content items for:
- Subject: ${params.subject}
- Topic: ${params.topic}
- Session Type: ${params.sessionType}
- Duration: ${params.duration} minutes

**CONTENT TYPES TO INCLUDE:**
1. Multiple choice questions with 4 options
2. Reading comprehension passages with questions
3. Writing prompts with sample answers

**OUTPUT FORMAT:**
Return a JSON array of content items in this exact format:

[
  {
    "id": 1,
    "type": "question",
    "question": "Clear, exam-style question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Detailed explanation of the correct answer",
    "difficulty": "Medium",
    "topic": "${params.topic}"
  },
  {
    "id": 2,
    "type": "passage",
    "passage": "Reading passage text...",
    "question": "Question about the passage",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
    "explanation": "Explanation referencing the passage",
    "topic": "${params.topic}"
  },
  {
    "id": 3,
    "type": "prompt",
    "prompt": "Writing prompt or task",
    "sampleAnswer": "Example response",
    "tips": ["Tip 1", "Tip 2", "Tip 3"],
    "topic": "${params.topic}"
  }
]

**REQUIREMENTS:**
- Questions must be relevant to ${params.examId} exam format
- Include variety in difficulty: Easy, Medium, Hard
- Explanations should be educational and detailed
- Content should be appropriate for ${params.sessionType} session type
- Focus on ${params.topic} within ${params.subject}

Generate high-quality, exam-appropriate content:
`;

    try {
      if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your-google-api-key-here') {
        console.log('⚠️ Google API key not configured, using fallback content generation');
        return generateFallbackContentWithGemini(params);
      }
      
      if (!genAI) {
        console.log('⚠️ Google GenAI client not initialized, using fallback content generation');
        return generateFallbackContentWithGemini(params);
      }

      const model = genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: contentPrompt,
        config: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
        }
      });

      const response = await model;
      
      if (response && response.text) {
        // Extract JSON from response
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const content = JSON.parse(jsonMatch[0]);
          console.log('✅ Gemini content generation successful');
          return content;
        }
      }
    } catch (apiError) {
      console.log('⚠️ Gemini API call failed, using fallback content');
    }

    // Fallback to exam-specific content generation
    return generateExamSpecificContentWithGemini({ ...params, curriculum, itemsCount });

  } catch (error) {
    console.error('❌ Error generating content with Gemini:', error);
    return generateFallbackContentWithGemini(params);
  }
};

// Generate exam-specific content when API fails
const generateExamSpecificContentWithGemini = (params: ContentGenerationParams & { 
  curriculum: any, 
  itemsCount: number 
}): ContentItem[] => {
  const { examId, subject, topic, sessionType, itemsCount } = params;

  console.log(`🎯 Generating ${examId}-specific content with Gemini structure`);

  switch (examId.toLowerCase()) {
    case 'sat':
      return generateSATContentWithGemini(subject, topic, sessionType, itemsCount);
    case 'gre':
      return generateGREContentWithGemini(subject, topic, sessionType, itemsCount);
    case 'toefl':
      return generateTOEFLContentWithGemini(subject, topic, sessionType, itemsCount);
    case 'ielts':
      return generateIELTSContentWithGemini(subject, topic, sessionType, itemsCount);
    case 'gmat':
      return generateGMATContentWithGemini(subject, topic, sessionType, itemsCount);
    case 'lsat':
      return generateLSATContentWithGemini(subject, topic, sessionType, itemsCount);
    default:
      return generateGenericContentWithGemini(subject, topic, sessionType, itemsCount);
  }
};

// Fallback content generation
const generateFallbackContentWithGemini = (params: ContentGenerationParams): ContentItem[] => {
  const { subject, topic, sessionType } = params;
  
  return [
    {
      id: 1,
      type: 'question',
      question: `Which concept is fundamental to understanding ${topic} in ${subject}?`,
      options: [
        'Basic principles and foundational knowledge',
        'Advanced theoretical applications only',
        'Memorization without understanding',
        'Random facts and figures'
      ],
      correct: 0,
      explanation: `Understanding fundamental principles of ${topic} is essential for building comprehensive knowledge in ${subject}. This forms the foundation for more advanced concepts.`,
      difficulty: 'Medium',
      topic: topic
    },
    {
      id: 2,
      type: 'prompt',
      prompt: `Explain the key concepts of ${topic} and their practical applications in ${subject}.`,
      sampleAnswer: `${topic} involves several key principles that are essential for understanding ${subject}. These concepts include fundamental theories, practical applications, and real-world examples.`,
      tips: [
        `Focus on core principles of ${topic}`,
        `Provide specific examples from ${subject}`,
        'Connect theory to practical applications',
        'Use clear and concise explanations'
      ],
      topic: topic
    }
  ];
};

// SAT content generation with Gemini structure
const generateSATContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject.toLowerCase().includes('math')) {
      content.push({
        id: i + 1,
        type: 'question',
        question: `SAT Math (${topic}): Which expression is equivalent to (x + 3)² - 9?`,
        options: ['x²', 'x² + 6x', 'x² + 6x + 9', 'x² - 9'],
        correct: 1,
        explanation: 'Expanding (x + 3)² gives x² + 6x + 9. Subtracting 9 gives x² + 6x.',
        difficulty: 'Medium',
        topic: topic
      });
    } else {
      content.push({
        id: i + 1,
        type: 'passage',
        passage: `The concept of ${topic} has evolved significantly over time, influenced by various cultural and historical factors...`,
        question: `Based on the passage, what can be inferred about ${topic}?`,
        options: [
          'It has remained constant throughout history',
          'It has been influenced by cultural factors',
          'It only affects modern society',
          'It has no historical significance'
        ],
        correct: 1,
        explanation: 'The passage explicitly mentions that the concept has been influenced by cultural and historical factors.',
        topic: topic
      });
    }
  }
  
  return content;
};

// GRE content generation with Gemini structure
const generateGREContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  const content: ContentItem[] = [];
  
  for (let i = 0; i < count; i++) {
    if (subject.toLowerCase().includes('verbal')) {
      content.push({
        id: i + 1,
        type: 'question',
        question: `GRE Verbal (${topic}): The professor's lecture was so _____ that even the most attentive students found it difficult to follow.`,
        options: ['lucid', 'abstruse', 'elementary', 'coherent'],
        correct: 1,
        explanation: 'Abstruse means difficult to understand, which fits the context of students finding the lecture hard to follow.',
        difficulty: 'Hard',
        topic: topic
      });
    } else {
      content.push({
        id: i + 1,
        type: 'question',
        question: `GRE Quantitative (${topic}): If x > 0 and x² = 16, what is the value of x?`,
        options: ['2', '4', '8', '16'],
        correct: 1,
        explanation: 'Since x > 0 and x² = 16, taking the positive square root gives x = 4.',
        difficulty: 'Easy',
        topic: topic
      });
    }
  }
  
  return content;
};

// Additional exam-specific generators
const generateTOEFLContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'prompt',
    prompt: `TOEFL Speaking (${topic}): Describe your opinion about ${topic} and provide specific examples to support your view.`,
    sampleAnswer: `I believe that ${topic} is important because it affects many aspects of our daily lives. For example...`,
    tips: [
      'Speak clearly and at an appropriate pace',
      'Provide specific examples',
      'Organize your response with clear structure',
      'Use transitional phrases'
    ],
    topic: topic
  }];
};

const generateIELTSContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'passage',
    passage: `Research into ${topic} has revealed fascinating insights into its impact on society...`,
    question: `According to the passage, what is the main focus of research into ${topic}?`,
    options: [
      'Its historical development',
      'Its impact on society',
      'Its technical aspects',
      'Its future potential'
    ],
    correct: 1,
    explanation: 'The passage states that research has revealed insights into the impact on society.',
    topic: topic
  }];
};

const generateGMATContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `GMAT Critical Reasoning (${topic}): Which of the following assumptions underlies the argument about ${topic}?`,
    options: [
      'The data is completely accurate',
      'All variables have been considered',
      'The conclusion follows logically',
      'Alternative explanations are unlikely'
    ],
    correct: 3,
    explanation: 'Critical reasoning questions often test whether alternative explanations have been properly ruled out.',
    difficulty: 'Hard',
    topic: topic
  }];
};

const generateLSATContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `LSAT Logical Reasoning (${topic}): If the premises are true, which conclusion must also be true regarding ${topic}?`,
    options: [
      'The argument is completely valid',
      'Additional evidence is needed',
      'The conclusion follows necessarily',
      'The premises are insufficient'
    ],
    correct: 2,
    explanation: 'In logical reasoning, if premises are true and the logic is valid, the conclusion must follow necessarily.',
    difficulty: 'Hard',
    topic: topic
  }];
};

const generateGenericContentWithGemini = (subject: string, topic: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `What is the most important aspect of ${topic} in ${subject}?`,
    options: [
      'Understanding fundamental principles',
      'Memorizing all details',
      'Speed over accuracy',
      'Ignoring practical applications'
    ],
    correct: 0,
    explanation: `Understanding fundamental principles of ${topic} is crucial for mastering ${subject}.`,
    difficulty: 'Medium',
    topic: topic
  }];
};

// Helper functions (same as Claude implementation)
export const getExamCurriculum = (examId: string) => {
  return getCurriculumByExamId(examId);
};

export const getExamSubjects = (examId: string): string[] => {
  const curriculum = getCurriculumByExamId(examId);
  return curriculum ? Object.keys(curriculum.subjects) : [];
};

export const getSubjectTopics = (examId: string, subject: string): string[] => {
  const curriculum = getCurriculumByExamId(examId);
  if (curriculum?.subjects && Object.prototype.hasOwnProperty.call(curriculum.subjects, subject)) {
    const subjectData = (curriculum.subjects as any)[subject];
    if (subjectData?.topics) {
      return Object.keys(subjectData.topics);
    }
  }
  return [];
}; 