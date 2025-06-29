import { ExamCurriculum } from './sat-curriculum';

export const greCurriculum: ExamCurriculum = {
  examId: 'gre',
  examName: 'GRE',
  fullName: 'Graduate Record Examinations',
  description: 'Graduate school admission test for advanced study programs',
  duration: '3 hours 45 minutes',
  totalHours: 250,
  subjects: [
    {
      id: 'verbal',
      name: 'Verbal Reasoning',
      description: 'Advanced vocabulary, reading comprehension, and critical reasoning',
      totalHours: 100,
      proficiencyScale: {
        beginner: 'Limited vocabulary and basic reading comprehension',
        basic: 'Adequate vocabulary but struggles with complex reasoning',
        intermediate: 'Good vocabulary and reading skills with some analytical gaps',
        advanced: 'Strong verbal skills with sophisticated analytical abilities',
        expert: 'Exceptional vocabulary and advanced critical reasoning skills'
      },
      topics: [
        {
          id: 'text_completion',
          name: 'Text Completion',
          description: 'Fill in blanks with appropriate vocabulary in complex sentences',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Advanced vocabulary in context',
            'Logical reasoning skills',
            'Understanding sentence structure',
            'Identifying key relationships',
            'Complex text analysis'
          ]
        },
        {
          id: 'sentence_equivalence',
          name: 'Sentence Equivalence',
          description: 'Select two words that complete a sentence with equivalent meaning',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Synonym recognition',
            'Contextual vocabulary',
            'Logical consistency',
            'Advanced word relationships',
            'Precise meaning identification'
          ]
        },
        {
          id: 'reading_comprehension',
          name: 'Reading Comprehension',
          description: 'Analyze complex academic texts from various disciplines',
          difficulty: 'hard',
          estimatedHours: 50,
          keyAreas: [
            'Main idea identification',
            'Author purpose and tone',
            'Inference and implication',
            'Supporting details',
            'Text structure analysis',
            'Multiple text comparison'
          ]
        }
      ]
    },
    {
      id: 'quantitative',
      name: 'Quantitative Reasoning',
      description: 'Mathematical problem solving and data interpretation',
      totalHours: 100,
      proficiencyScale: {
        beginner: 'Basic arithmetic with difficulty in problem solving',
        basic: 'Understands fundamental concepts but struggles with application',
        intermediate: 'Good mathematical skills with occasional complex problem difficulties',
        advanced: 'Strong quantitative reasoning with efficient problem solving',
        expert: 'Exceptional mathematical ability with advanced analytical skills'
      },
      topics: [
        {
          id: 'arithmetic',
          name: 'Arithmetic',
          description: 'Basic number properties, operations, and estimation',
          difficulty: 'easy',
          estimatedHours: 20,
          keyAreas: [
            'Integer properties',
            'Fractions and decimals',
            'Exponents and roots',
            'Estimation techniques',
            'Number line concepts'
          ]
        },
        {
          id: 'algebra',
          name: 'Algebra',
          description: 'Equations, inequalities, and algebraic expressions',
          difficulty: 'medium',
          estimatedHours: 30,
          keyAreas: [
            'Linear and quadratic equations',
            'Systems of equations',
            'Inequalities',
            'Functions and their graphs',
            'Coordinate geometry'
          ]
        },
        {
          id: 'geometry',
          name: 'Geometry',
          description: 'Plane geometry, coordinate geometry, and three-dimensional figures',
          difficulty: 'medium',
          estimatedHours: 25,
          keyAreas: [
            'Lines and angles',
            'Triangles and quadrilaterals',
            'Circles and polygons',
            'Area and perimeter',
            'Volume and surface area'
          ]
        },
        {
          id: 'data_analysis',
          name: 'Data Analysis',
          description: 'Statistics, probability, and data interpretation',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Descriptive statistics',
            'Probability distributions',
            'Data interpretation',
            'Graphs and charts',
            'Statistical reasoning'
          ]
        }
      ]
    },
    {
      id: 'analytical_writing',
      name: 'Analytical Writing',
      description: 'Critical thinking and analytical writing skills',
      totalHours: 50,
      proficiencyScale: {
        beginner: 'Basic writing with unclear arguments and poor organization',
        basic: 'Simple arguments with adequate organization but limited analysis',
        intermediate: 'Clear arguments with good organization and some analytical depth',
        advanced: 'Strong arguments with excellent organization and insightful analysis',
        expert: 'Sophisticated arguments with exceptional clarity and compelling analysis'
      },
      topics: [
        {
          id: 'analyze_issue',
          name: 'Analyze an Issue',
          description: 'Present and support your own view on a general issue',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Position development',
            'Supporting evidence',
            'Counterargument consideration',
            'Logical organization',
            'Clear expression'
          ]
        },
        {
          id: 'analyze_argument',
          name: 'Analyze an Argument',
          description: 'Critique the logical soundness of an argument',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Logical fallacy identification',
            'Evidence evaluation',
            'Assumption analysis',
            'Alternative explanations',
            'Argument structure'
          ]
        }
      ]
    }
  ],
  proficiencyQuestions: {
    text_completion: {
      question: 'How comfortable are you with advanced vocabulary and completing complex sentences?',
      levels: [
        'I struggle with sophisticated vocabulary and sentence structures',
        'I understand basic vocabulary but have difficulty with complex texts',
        'I can handle most vocabulary with some challenging words',
        'I\'m comfortable with advanced vocabulary and complex reasoning',
        'I excel at sophisticated vocabulary and nuanced text completion'
      ]
    },
    sentence_equivalence: {
      question: 'How well can you identify synonyms and equivalent meanings in context?',
      levels: [
        'I have difficulty recognizing word relationships',
        'I can identify basic synonyms but struggle with context',
        'I understand most word relationships with some uncertainty',
        'I\'m good at identifying equivalent meanings in context',
        'I excel at recognizing subtle word relationships and meanings'
      ]
    },
    reading_comprehension: {
      question: 'How well can you analyze and understand complex academic texts?',
      levels: [
        'I struggle with complex texts and miss main ideas',
        'I can understand basic content but miss deeper analysis',
        'I can analyze texts with some difficulty on complex passages',
        'I\'m comfortable analyzing complex academic texts',
        'I excel at sophisticated textual analysis and critical reasoning'
      ]
    },
    arithmetic: {
      question: 'How comfortable are you with basic mathematical operations and number properties?',
      levels: [
        'I struggle with basic arithmetic operations',
        'I understand fundamentals but make calculation errors',
        'I\'m comfortable with arithmetic but need practice with applications',
        'I have strong arithmetic skills and can solve problems efficiently',
        'I have mastery of arithmetic with advanced problem-solving abilities'
      ]
    },
    algebra: {
      question: 'How well do you understand algebraic concepts and equation solving?',
      levels: [
        'I have difficulty with basic algebraic concepts',
        'I understand simple algebra but struggle with complex problems',
        'I can solve most algebraic problems with some effort',
        'I\'m comfortable with algebraic reasoning and problem solving',
        'I have advanced algebraic skills and can handle complex problems'
      ]
    },
    geometry: {
      question: 'How comfortable are you with geometric concepts and spatial reasoning?',
      levels: [
        'I struggle with basic geometric concepts',
        'I understand simple geometry but have difficulty with applications',
        'I can solve most geometry problems with practice',
        'I\'m comfortable with geometric reasoning and problem solving',
        'I have strong geometric intuition and advanced spatial skills'
      ]
    },
    data_analysis: {
      question: 'How well can you interpret statistical data and solve probability problems?',
      levels: [
        'I have difficulty understanding basic statistics',
        'I can read simple data but struggle with analysis',
        'I can interpret most data with some uncertainty',
        'I\'m comfortable with statistical analysis and probability',
        'I excel at complex data interpretation and statistical reasoning'
      ]
    },
    analyze_issue: {
      question: 'How well can you develop and support your own arguments on complex issues?',
      levels: [
        'I struggle to form coherent arguments',
        'I can present basic positions but lack supporting evidence',
        'I can develop arguments with adequate support',
        'I\'m good at constructing well-supported arguments',
        'I excel at sophisticated argumentation with compelling evidence'
      ]
    },
    analyze_argument: {
      question: 'How well can you critically analyze the logic and structure of arguments?',
      levels: [
        'I have difficulty identifying argument components',
        'I can recognize basic argument structure but miss logical issues',
        'I can analyze arguments with some logical insight',
        'I\'m good at identifying logical flaws and evaluating evidence',
        'I excel at sophisticated logical analysis and critical evaluation'
      ]
    }
  }
}; 