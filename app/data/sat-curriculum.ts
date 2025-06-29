// SAT Curriculum Data
export interface TopicData {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
  prerequisites?: string[];
  keyAreas: string[];
}

export interface SubjectData {
  id: string;
  name: string;
  description: string;
  totalHours: number;
  topics: TopicData[];
  proficiencyScale: {
    beginner: string;
    basic: string;
    intermediate: string;
    advanced: string;
    expert: string;
  };
}

export interface ExamCurriculum {
  examId: string;
  examName: string;
  fullName: string;
  description: string;
  duration: string;
  totalHours: number;
  subjects: SubjectData[];
  proficiencyQuestions: {
    [topicId: string]: {
      question: string;
      levels: string[];
    };
  };
}

export const satCurriculum: ExamCurriculum = {
  examId: 'sat',
  examName: 'SAT',
  fullName: 'Scholastic Assessment Test',
  description: 'College admission test for US universities',
  duration: '3 hours',
  totalHours: 200,
  subjects: [
    {
      id: 'math',
      name: 'Math',
      description: 'Mathematics section covering algebra, geometry, and data analysis',
      totalHours: 100,
      proficiencyScale: {
        beginner: 'Struggles with basic arithmetic and algebraic concepts',
        basic: 'Understands fundamental operations but needs practice with complex problems',
        intermediate: 'Comfortable with most concepts, occasional errors in complex problems',
        advanced: 'Strong understanding, makes few errors, good problem-solving skills',
        expert: 'Mastery of all concepts, can solve complex problems efficiently'
      },
      topics: [
        {
          id: 'heart_of_algebra',
          name: 'Heart of Algebra',
          description: 'Linear equations, systems of equations, and algebraic expressions',
          difficulty: 'medium',
          estimatedHours: 35,
          keyAreas: [
            'Linear equations in one variable',
            'Linear equations in two variables',
            'Systems of linear equations',
            'Linear inequalities',
            'Algebraic expressions'
          ]
        },
        {
          id: 'problem_solving_data_analysis',
          name: 'Problem Solving and Data Analysis',
          description: 'Statistics, data interpretation, and quantitative reasoning',
          difficulty: 'medium',
          estimatedHours: 30,
          keyAreas: [
            'Ratios and proportions',
            'Percentages',
            'Unit conversions',
            'Statistics and probability',
            'Data interpretation'
          ]
        },
        {
          id: 'passport_advanced_math',
          name: 'Passport to Advanced Math',
          description: 'Complex equations, polynomial expressions, and advanced functions',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Quadratic equations',
            'Exponential functions',
            'Polynomial operations',
            'Radical equations',
            'Function notation'
          ]
        },
        {
          id: 'additional_topics',
          name: 'Additional Topics in Math',
          description: 'Geometry, trigonometry, and complex numbers',
          difficulty: 'medium',
          estimatedHours: 10,
          keyAreas: [
            'Area and volume',
            'Right triangle trigonometry',
            'Circle equations',
            'Complex numbers',
            'Coordinate geometry'
          ]
        }
      ]
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'Reading comprehension and analysis of various text types',
      totalHours: 60,
      proficiencyScale: {
        beginner: 'Difficulty understanding main ideas and basic details',
        basic: 'Can identify main ideas but struggles with inference and analysis',
        intermediate: 'Good comprehension with some difficulty in complex analysis',
        advanced: 'Strong reading skills with good analytical thinking',
        expert: 'Excellent comprehension and sophisticated analytical abilities'
      },
      topics: [
        {
          id: 'command_of_evidence',
          name: 'Command of Evidence',
          description: 'Finding and interpreting textual evidence',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Supporting claims with evidence',
            'Analyzing relationships between text and graphics',
            'Interpreting data in passages',
            'Understanding author\'s evidence'
          ]
        },
        {
          id: 'words_in_context',
          name: 'Words in Context',
          description: 'Understanding vocabulary and word meanings in context',
          difficulty: 'easy',
          estimatedHours: 10,
          keyAreas: [
            'Context clues',
            'Multiple meaning words',
            'Precision of language',
            'Rhetorical word choice'
          ]
        },
        {
          id: 'analysis_history_social_studies',
          name: 'Analysis in History/Social Studies',
          description: 'Analyzing historical and social science texts',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Historical context',
            'Analyzing arguments',
            'Understanding perspectives',
            'Interpreting historical data'
          ]
        },
        {
          id: 'analysis_science',
          name: 'Analysis in Science',
          description: 'Understanding and analyzing scientific texts and data',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Scientific method',
            'Hypothesis and conclusions',
            'Data interpretation',
            'Experimental design'
          ]
        }
      ]
    },
    {
      id: 'writing',
      name: 'Writing and Language',
      description: 'Grammar, usage, and rhetorical skills',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Frequent grammar errors and unclear expression',
        basic: 'Some grammar knowledge but inconsistent application',
        intermediate: 'Good grasp of most rules with occasional errors',
        advanced: 'Strong command of grammar and clear expression',
        expert: 'Excellent grammar skills and sophisticated expression'
      },
      topics: [
        {
          id: 'expression_of_ideas',
          name: 'Expression of Ideas',
          description: 'Organization, development, and effective language use',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Development and organization',
            'Effective language use',
            'Sentence structure',
            'Style and tone',
            'Logical sequence'
          ]
        },
        {
          id: 'standard_english_conventions',
          name: 'Standard English Conventions',
          description: 'Grammar, usage, and mechanics',
          difficulty: 'easy',
          estimatedHours: 20,
          keyAreas: [
            'Sentence formation',
            'Usage and agreement',
            'Punctuation',
            'Modifier placement',
            'Verb tense consistency'
          ]
        }
      ]
    }
  ],
  proficiencyQuestions: {
    heart_of_algebra: {
      question: 'How comfortable are you with solving linear equations and systems?',
      levels: [
        'I struggle with basic algebraic operations',
        'I can solve simple equations but struggle with complex ones',
        'I can solve most linear equations with some practice',
        'I\'m comfortable with linear equations and systems',
        'I can solve complex algebraic problems efficiently'
      ]
    },
    problem_solving_data_analysis: {
      question: 'How well can you interpret data and solve word problems?',
      levels: [
        'I have difficulty understanding basic data',
        'I can read simple charts but struggle with analysis',
        'I can interpret most data with some guidance',
        'I\'m good at data analysis and problem solving',
        'I excel at complex data interpretation and analysis'
      ]
    },
    passport_advanced_math: {
      question: 'How comfortable are you with advanced mathematical functions?',
      levels: [
        'I struggle with basic function concepts',
        'I understand simple functions but not complex ones',
        'I can work with most functions with practice',
        'I\'m comfortable with advanced mathematical functions',
        'I have mastery of complex functions and operations'
      ]
    },
    additional_topics: {
      question: 'How well do you understand geometry and trigonometry?',
      levels: [
        'I have difficulty with basic geometric concepts',
        'I understand simple shapes but struggle with complex problems',
        'I can solve most geometry problems with effort',
        'I\'m comfortable with geometry and basic trigonometry',
        'I have strong skills in geometry and trigonometry'
      ]
    },
    command_of_evidence: {
      question: 'How well can you find and interpret evidence in texts?',
      levels: [
        'I struggle to identify main ideas in text',
        'I can find basic information but miss important details',
        'I can identify evidence with some guidance',
        'I\'m good at finding and interpreting textual evidence',
        'I excel at analyzing complex textual relationships'
      ]
    },
    words_in_context: {
      question: 'How well do you understand vocabulary in context?',
      levels: [
        'I often don\'t understand unfamiliar words',
        'I can guess some word meanings from context',
        'I understand most vocabulary with context clues',
        'I\'m good at determining word meanings in context',
        'I have excellent vocabulary and context skills'
      ]
    },
    analysis_history_social_studies: {
      question: 'How comfortable are you analyzing historical and social texts?',
      levels: [
        'I have difficulty understanding historical texts',
        'I can read historical texts but miss deeper meanings',
        'I can analyze most historical texts with effort',
        'I\'m comfortable analyzing historical and social contexts',
        'I excel at complex historical and social analysis'
      ]
    },
    analysis_science: {
      question: 'How well can you understand and analyze scientific texts?',
      levels: [
        'I struggle with scientific concepts and data',
        'I understand basic science but struggle with analysis',
        'I can interpret most scientific texts with guidance',
        'I\'m comfortable with scientific analysis',
        'I excel at complex scientific reasoning and analysis'
      ]
    },
    expression_of_ideas: {
      question: 'How well can you organize and express ideas clearly?',
      levels: [
        'I struggle to organize my thoughts clearly',
        'I can express basic ideas but lack organization',
        'I can organize ideas with some structure',
        'I\'m good at expressing ideas clearly and logically',
        'I excel at sophisticated expression and organization'
      ]
    },
    standard_english_conventions: {
      question: 'How well do you know grammar rules and conventions?',
      levels: [
        'I make frequent grammar and punctuation errors',
        'I know basic grammar but make regular mistakes',
        'I understand most grammar rules with occasional errors',
        'I have strong grammar skills with few errors',
        'I have mastery of grammar and writing conventions'
      ]
    }
  }
}; 