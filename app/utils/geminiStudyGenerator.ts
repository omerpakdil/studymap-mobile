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

// Generate intelligent prompt from onboarding data (same logic as Claude)
const generateGeminiPrompt = (onboardingData: OnboardingData): string => {
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

**SUBJECT INTENSITY PREFERENCES (Study focus allocation):**
${intensityContext}

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
      "title": "Mathematics: Study Session - Day 1",
c      "subject": "Mathematics",
      "type": "study",
      "duration": ${typicalTaskDuration},
      "difficulty": "medium",
      "priority": "high",
      "description": "Study ${examSubjects[0]} fundamentals and core concepts",
      "date": "${(() => {
        const startDate = getNextStudyDay(scheduleData, today);
        const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
        for (let i = 0; i < Math.min(daysUntilExam, 14); i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dayNumber = currentDate.getDay();
          if (studyDayNumbers.includes(dayNumber)) {
            return currentDate.toISOString().split('T')[0];
          }
        }
        return startDate.toISOString().split('T')[0];
      })()}",
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
      "description": "Complete foundational concepts for ${examData.name} preparation",
      "completed": false
    }
  ],
  "generatedAt": "${new Date().toISOString()}",
  "lastUpdated": "${new Date().toISOString()}"
}

**GENERATE ${Math.min(daysUntilExam, 14)} DAYS OF STUDY TASKS (FIRST 2 WEEKS):**

**MANDATORY TASK CREATION RULES:**
1. Create tasks ONLY for the exact dates listed below
2. Use the EXACT date strings provided - do NOT modify them
3. Each task must have the exact date from the list below
4. Do NOT calculate or change any dates

**EXACT TASK DATES (USE THESE EXACTLY):**
${(() => {
  const startDate = getNextStudyDay(scheduleData, today);
  const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
  let taskDates = '';
  let taskCount = 0;
  
  console.log(`🔍 Debug: Generating exact task dates from ${startDate.toISOString().split('T')[0]}`);
  console.log(`🔍 Debug: Study day numbers: ${studyDayNumbers.join(', ')}`);
  
  for (let i = 0; i < Math.min(daysUntilExam, 14); i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dayNumber = currentDate.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNumber];
    const dateString = currentDate.toISOString().split('T')[0];
    
    console.log(`🔍 Debug: Day ${i}: ${dateString} (${dayName}, day ${dayNumber}) - is study day: ${studyDayNumbers.includes(dayNumber)}`);
    
    if (studyDayNumbers.includes(dayNumber)) {
      taskCount++;
      taskDates += `Task ${taskCount}: ${dateString} (${dayName})\n`;
    }
  }
  console.log(`🔍 Debug: Generated ${taskCount} task dates`);
  console.log(`🔍 Debug: Final task dates list:\n${taskDates}`);
  return taskDates;
})()}

**CRITICAL:** Create exactly ${(() => {
  const startDate = getNextStudyDay(scheduleData, today);
  const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
  let count = 0;
  for (let i = 0; i < Math.min(daysUntilExam, 14); i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dayNumber = currentDate.getDay();
    if (studyDayNumbers.includes(dayNumber)) {
      count++;
    }
  }
  return count;
})()} tasks using the exact dates above. Do NOT add extra days or change dates.

**ABSOLUTE REQUIREMENT:** Each task's "date" field MUST be one of the exact dates listed above. Do NOT calculate dates yourself. Copy the exact date strings from the list above.

**FINAL WARNING:** If you create tasks with dates that are NOT in the exact list above, the program will fail. You MUST use only the dates provided in the "EXACT TASK DATES" section above.

**CRITICAL VALIDATION:** Before responding, verify that every task's "date" field matches exactly one of the dates in the "EXACT TASK DATES" list above. If any task has a different date, you have made an error and must fix it.

**TASK NAMING:** Use format "[Subject]: [Session Type]" (e.g., "Mathematics: Practice Session", "Reading: Study Session")

**DESCRIPTION RULES (CRITICAL - MUST FOLLOW EXACTLY):**
- Reading tasks: "Practice reading comprehension and analysis skills"
- Listening tasks: "Practice listening comprehension and note-taking skills"  
- Speaking tasks: "Practice speaking fluency and pronunciation skills"
- Writing tasks: "Practice writing structure and grammar skills"
- Mathematics tasks: "Practice mathematical problem-solving and concepts"
- Verbal Reasoning tasks: "Practice verbal reasoning and vocabulary skills"
- Quantitative Reasoning tasks: "Practice quantitative reasoning and math skills"
- Analytical Writing tasks: "Practice analytical writing and argumentation skills"
- Logical Reasoning tasks: "Practice logical reasoning and critical thinking skills"
- Reading Comprehension tasks: "Practice reading comprehension and analysis skills"
- Analytical Reasoning tasks: "Practice analytical reasoning and logic skills"

**ABSOLUTE REQUIREMENT:** Each task's "description" field MUST match the subject exactly:
- If subject is "Reading" → description MUST be "Practice reading comprehension and analysis skills"
- If subject is "Listening" → description MUST be "Practice listening comprehension and note-taking skills"
- If subject is "Speaking" → description MUST be "Practice speaking fluency and pronunciation skills"
- If subject is "Writing" → description MUST be "Practice writing structure and grammar skills"
- If subject is "Mathematics" → description MUST be "Practice mathematical problem-solving and concepts"

**FINAL WARNING:** If you create tasks with descriptions that don't match the subject, the program will fail. You MUST use the exact descriptions listed above.

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
        // Extract session type after the colon or use generic session type
        const colonIndex = fixedTitle.indexOf(':');
        const sessionType = colonIndex > 0 ? fixedTitle.substring(colonIndex + 1).trim() : 'Study Session';
        fixedTitle = `${fixedSubject}: ${sessionType}`;
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

// Generate study program using Gemini
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

// Generate long-term study program with chunked approach
const generateChunkedStudyProgram = async (
  onboardingData: OnboardingData, 
  totalDays: number,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<StudyProgram | null> => {
  try {
    console.log(`🧩 Generating AI-powered program for ${totalDays} days`);
    
    const chunkSize = 7; // Weekly chunks
    const chunks: any[] = [];
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
        totalDays
      );
      
      const chunkResult = await callGeminiAPI(chunkPrompt, onboardingData.examData?.name);
      
      if (chunkResult && chunkResult.dailyTasks) {
        chunks.push(chunkResult);
        console.log(`✅ Week ${currentWeek}: ${chunkResult.dailyTasks.length} tasks`);
        
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
    console.error('❌ Error in chunked generation:', error);
    return null;
  }
};

// Generate context-aware chunk prompt
const generateContextualChunkPrompt = (
  onboardingData: OnboardingData, 
  startDay: number, 
  chunkDays: number, 
  totalDays: number
): string => {
  const { examData, goalsData, scheduleData, subjectIntensity, learningStyleData } = onboardingData;
  
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
  
  // Calculate weekly hours
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

  return `
You are creating Week ${currentWeek} (Days ${startDay + 1}-${startDay + chunkDays}) of a ${totalDays}-day ${examData.name} exam preparation program.

**PROGRAM CONTEXT:**
- Current Phase: ${phaseDescription}
- Week ${currentWeek} of ${totalWeeks} total weeks
- Date Range: ${chunkStartDate.toISOString().split('T')[0]} to ${chunkEndDate.toISOString().split('T')[0]}
- Days until exam: ${daysUntilExam}
- Weekly study hours: ${weeklyHours}

**EXAM SUBJECTS:** ${examSubjects.join(', ')}

**SUBJECT INTENSITY PREFERENCES:**
${Object.entries(subjectIntensity)
  .map(([subject, level]) => {
    const intensityLabels = ['Light', 'Moderate', 'High', 'Intensive'];
    return `${subject}: ${intensityLabels[level]} focus`;
  })
  .join(', ')}

**SCHEDULE CONSTRAINTS (Study Days Only):**
${Object.entries(scheduleData)
  .filter(([day, slots]) => slots && slots.length > 0)
  .map(([day, slots]) => `${day}: ${(slots as string[]).join(', ')}`)
  .join('\n')}

**THIS WEEK'S OBJECTIVES:**
1. Generate tasks for ${chunkDays} days, but ONLY for study days: ${Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).join(', ')}
2. Create ${Math.max(2, Math.ceil(weeklyHours / Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).length / (60/60)))} tasks per study day
3. Each task must have: id, title (Subject: Session Type), subject, type, duration, difficulty, priority, description, date, timeSlot
4. Week ${currentWeek} difficulty level: ${currentWeek <= 2 ? 'beginner-intermediate' : currentWeek <= totalWeeks * 0.6 ? 'intermediate' : currentWeek <= totalWeeks * 0.8 ? 'intermediate-advanced' : 'advanced-expert'}
5. Focus on high intensity subjects according to user preferences
6. Use clear task titles: "Mathematics: Practice Session", "Reading: Study Session"
7. Vary task types: study, practice, review, quiz
8. Fill all available time slots for selected days

**MANDATORY SUBJECT VALIDATION:**
- Valid subjects for ${examData.name}: ${examSubjects.join(', ')}
- Each task's "subject" field MUST be one of these exact strings
- NEVER use numbers, indices, or abbreviations as subject names
- Double-check every task has a valid subject name before responding

**MANDATORY TASK CREATION RULES:**
1. Create tasks ONLY for the exact dates listed below
2. Use the EXACT date strings provided - do NOT modify them
3. Each task must have the exact date from the list below
4. Do NOT calculate or change any dates

**EXACT TASK DATES FOR THIS CHUNK (USE THESE EXACTLY):**
${(() => {
  const studyDays = Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0);
  const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
  let taskDates = '';
  let taskCount = 0;
  
  console.log(`🔍 Debug: Chunk - Generating exact task dates from ${chunkStartDate.toISOString().split('T')[0]}`);
  console.log(`🔍 Debug: Chunk - Study day numbers: ${studyDayNumbers.join(', ')}`);
  
  for (let i = 0; i < chunkDays; i++) {
    const currentDate = new Date(chunkStartDate);
    currentDate.setDate(chunkStartDate.getDate() + i);
    const dayNumber = currentDate.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNumber];
    const dateString = currentDate.toISOString().split('T')[0];
    
    console.log(`🔍 Debug: Chunk - Day ${i}: ${dateString} (${dayName}, day ${dayNumber}) - is study day: ${studyDayNumbers.includes(dayNumber)}`);
    
    if (studyDayNumbers.includes(dayNumber)) {
      taskCount++;
      taskDates += `Task ${taskCount}: ${dateString} (${dayName})\n`;
    }
  }
  console.log(`🔍 Debug: Chunk - Generated ${taskCount} task dates`);
  return taskDates;
})()}

**CRITICAL:** Create exactly ${(() => {
  const studyDays = Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0);
  const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
  let count = 0;
  for (let i = 0; i < chunkDays; i++) {
    const currentDate = new Date(chunkStartDate);
    currentDate.setDate(chunkStartDate.getDate() + i);
    const dayNumber = currentDate.getDay();
    if (studyDayNumbers.includes(dayNumber)) {
      count++;
    }
  }
  return count;
})()} tasks using the exact dates above. Do NOT add extra days or change dates.

**ABSOLUTE REQUIREMENT:** Each task's "date" field MUST be one of the exact dates listed above. Do NOT calculate dates yourself. Copy the exact date strings from the list above.

**FINAL WARNING:** If you create tasks with dates that are NOT in the exact list above, the program will fail. You MUST use only the dates provided in the "EXACT TASK DATES FOR THIS CHUNK" section above.

**CRITICAL VALIDATION:** Before responding, verify that every task's "date" field matches exactly one of the dates in the "EXACT TASK DATES FOR THIS CHUNK" list above. If any task has a different date, you have made an error and must fix it.

**DESCRIPTION RULES (CRITICAL - MUST FOLLOW EXACTLY):**
- Reading tasks: "Practice reading comprehension and analysis skills"
- Listening tasks: "Practice listening comprehension and note-taking skills"  
- Speaking tasks: "Practice speaking fluency and pronunciation skills"
- Writing tasks: "Practice writing structure and grammar skills"
- Mathematics tasks: "Practice mathematical problem-solving and concepts"
- Verbal Reasoning tasks: "Practice verbal reasoning and vocabulary skills"
- Quantitative Reasoning tasks: "Practice quantitative reasoning and math skills"
- Analytical Writing tasks: "Practice analytical writing and argumentation skills"
- Logical Reasoning tasks: "Practice logical reasoning and critical thinking skills"
- Reading Comprehension tasks: "Practice reading comprehension and analysis skills"
- Analytical Reasoning tasks: "Practice analytical reasoning and logic skills"

**ABSOLUTE REQUIREMENT:** Each task's "description" field MUST match the subject exactly:
- If subject is "Reading" → description MUST be "Practice reading comprehension and analysis skills"
- If subject is "Listening" → description MUST be "Practice listening comprehension and note-taking skills"
- If subject is "Speaking" → description MUST be "Practice speaking fluency and pronunciation skills"
- If subject is "Writing" → description MUST be "Practice writing structure and grammar skills"
- If subject is "Mathematics" → description MUST be "Practice mathematical problem-solving and concepts"

**FINAL WARNING:** If you create tasks with descriptions that don't match the subject, the program will fail. You MUST use the exact descriptions listed above.

**OUTPUT FORMAT:** Return ONLY valid JSON with dailyTasks array containing exactly ${chunkDays} tasks.

{
  "id": "week_${currentWeek}_${Date.now()}",
  "dailyTasks": [
    {
      "id": "task_w${currentWeek}_d1",
      "title": "${examSubjects[0]}: Study Session",
      "subject": "${examSubjects[0]}",
      "type": "study",
      "duration": 60,
      "difficulty": "medium",
      "priority": "high",
      "description": "Study ${examSubjects[0]} fundamentals and core concepts",
      "date": "${(() => {
        const studyDays = Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0);
        const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
        for (let i = 0; i < chunkDays; i++) {
          const currentDate = new Date(chunkStartDate);
          currentDate.setDate(chunkStartDate.getDate() + i);
          const dayNumber = currentDate.getDay();
          if (studyDayNumbers.includes(dayNumber)) {
            return currentDate.toISOString().split('T')[0];
          }
        }
        return chunkStartDate.toISOString().split('T')[0];
      })()}",
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
✓ Title format is "Subject: Session Type"
✓ Tasks only on study days: ${Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0).join(', ')}`;
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
    id: `gemini_program_${Date.now()}`,
    examType: examData!.name,
    examDate: goalsData!.examDate,
    startDate: getNextStudyDay(onboardingData.scheduleData, today).toISOString().split('T')[0],
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

// Get study days from schedule data
const getStudyDays = (scheduleData: any): string[] => {
  return Object.keys(scheduleData).filter(day => scheduleData[day] && scheduleData[day].length > 0);
};

// Convert day name to day number (0=Sunday, 1=Monday, etc.)
const getDayNumber = (dayName: string): number => {
  const dayMap: { [key: string]: number } = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };
  return dayMap[dayName.toLowerCase()] ?? -1;
};

// Get next study day starting from today
const getNextStudyDay = (scheduleData: any, startDate: Date = new Date()): Date => {
  const studyDays = getStudyDays(scheduleData);
  console.log(`🔍 Debug: Study days from schedule: ${studyDays.join(', ')}`);
  
  // Convert study day names to day numbers
  const studyDayNumbers = studyDays.map(day => getDayNumber(day)).filter(num => num !== -1);
  console.log(`🔍 Debug: Study day numbers: ${studyDayNumbers.join(', ')}`);
  
  const currentDate = new Date(startDate);
  const todayDayNumber = currentDate.getDay();
  console.log(`🔍 Debug: Today is day ${todayDayNumber} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayDayNumber]})`);
  
  // Check if today is a study day
  if (studyDayNumbers.includes(todayDayNumber)) {
    console.log(`📅 Today is a study day, starting from today`);
    return currentDate;
  }
  
  // Find next study day
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + i);
    const nextDayNumber = nextDate.getDay();
    const nextDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextDayNumber];
    
    console.log(`🔍 Debug: Checking day ${i}: ${nextDayName} (day ${nextDayNumber})`);
    
    if (studyDayNumbers.includes(nextDayNumber)) {
      console.log(`📅 Next study day: ${nextDayName} (${i} days from today)`);
      return nextDate;
    }
  }
  
  // Fallback to today if no study days found
  console.warn('⚠️ No study days found in schedule, starting from today');
  return currentDate;
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

// Generate study content using Gemini
export const generateStudyContentWithGemini = async (params: ContentGenerationParams): Promise<ContentItem[]> => {
  try {
    console.log('🤖 Generating study content with Gemini for:', params);

    const itemsCount = Math.max(3, Math.min(8, Math.floor(params.duration / 10)));

    // Fallback to exam-specific content generation
    return generateExamSpecificContentWithGemini({ ...params, itemsCount });

  } catch (error) {
    console.error('❌ Error generating content with Gemini:', error);
    return generateFallbackContentWithGemini(params);
  }
};

// Generate exam-specific content when API fails
const generateExamSpecificContentWithGemini = (params: ContentGenerationParams & { 
  itemsCount: number 
}): ContentItem[] => {
  const { examId, subject, sessionType, itemsCount } = params;

  console.log(`🎯 Generating ${examId}-specific content with Gemini structure`);

  switch (examId.toLowerCase()) {
    case 'sat':
      return generateSATContentWithGemini(subject, sessionType, itemsCount);
    case 'gre':
      return generateGREContentWithGemini(subject, sessionType, itemsCount);
    case 'toefl':
      return generateTOEFLContentWithGemini(subject, sessionType, itemsCount);
    case 'ielts':
      return generateIELTSContentWithGemini(subject, sessionType, itemsCount);
    case 'gmat':
      return generateGMATContentWithGemini(subject, sessionType, itemsCount);
    case 'lsat':
      return generateLSATContentWithGemini(subject, sessionType, itemsCount);
    default:
      return generateGenericContentWithGemini(subject, sessionType, itemsCount);
  }
};

// Fallback content generation
const generateFallbackContentWithGemini = (params: ContentGenerationParams): ContentItem[] => {
  const { subject, sessionType } = params;
  
  return [
    {
      id: 1,
      type: 'question',
      question: `Which concept is fundamental to understanding ${subject}?`,
      options: [
        'Basic principles and foundational knowledge',
        'Advanced theoretical applications only',
        'Memorization without understanding',
        'Random facts and figures'
      ],
      correct: 0,
      explanation: `Understanding fundamental principles of ${subject} is essential for building comprehensive knowledge. This forms the foundation for more advanced concepts.`,
      difficulty: 'Medium',
      topic: subject
    }
  ];
};

// Subject-focused content generators (no topic parameter)
const generateSATContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `SAT ${subject}: Which strategy is most effective for this subject?`,
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
  }];
};

const generateGREContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `GRE ${subject}: Which method leads to improvement?`,
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
  }];
};

const generateTOEFLContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `TOEFL ${subject}: What is a key strategy for success?`,
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

const generateIELTSContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
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

const generateGMATContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `GMAT ${subject}: Which method is most effective?`,
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

const generateLSATContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
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

const generateGenericContentWithGemini = (subject: string, sessionType: string, count: number): ContentItem[] => {
  return [{
    id: 1,
    type: 'question',
    question: `What is the most important aspect of ${subject}?`,
    options: [
      'Understanding fundamental principles',
      'Memorizing all details',
      'Speed over accuracy',
      'Ignoring practical applications'
    ],
    correct: 0,
    explanation: `Understanding fundamental principles of ${subject} is crucial for mastery.`,
    difficulty: 'Medium',
    topic: subject
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
