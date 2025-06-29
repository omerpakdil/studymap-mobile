import { ExamCurriculum } from './sat-curriculum';

export const gmatCurriculum: ExamCurriculum = {
  examId: 'gmat',
  examName: 'GMAT',
  fullName: 'Graduate Management Admission Test',
  description: 'Business school admission test for MBA and management programs',
  duration: '3 hours 7 minutes',
  totalHours: 300,
  subjects: [
    {
      id: 'verbal',
      name: 'Verbal',
      description: 'Critical reasoning, reading comprehension, and sentence correction',
      totalHours: 90,
      proficiencyScale: {
        beginner: 'Basic understanding with frequent errors in complex reasoning',
        basic: 'Adequate comprehension but struggles with advanced reasoning',
        intermediate: 'Good verbal skills with occasional gaps in logic',
        advanced: 'Strong verbal reasoning with sophisticated analysis',
        expert: 'Exceptional verbal skills with advanced business reasoning'
      },
      topics: [
        {
          id: 'critical_reasoning',
          name: 'Critical Reasoning',
          description: 'Analyzing arguments and evaluating reasoning in business contexts',
          difficulty: 'hard',
          estimatedHours: 35,
          keyAreas: [
            'Argument structure analysis',
            'Assumption identification',
            'Strengthening and weakening arguments',
            'Drawing conclusions',
            'Evaluating plans and proposals'
          ]
        },
        {
          id: 'reading_comprehension',
          name: 'Reading Comprehension',
          description: 'Understanding complex business and academic texts',
          difficulty: 'medium',
          estimatedHours: 30,
          keyAreas: [
            'Main idea identification',
            'Specific detail location',
            'Inference and implication',
            'Author tone and purpose',
            'Application of concepts'
          ]
        },
        {
          id: 'sentence_correction',
          name: 'Sentence Correction',
          description: 'Grammar, style, and clarity in business writing',
          difficulty: 'medium',
          estimatedHours: 25,
          keyAreas: [
            'Grammar and usage',
            'Sentence structure',
            'Modification and parallelism',
            'Verb tense and agreement',
            'Idiomatic expressions'
          ]
        }
      ]
    },
    {
      id: 'quantitative',
      name: 'Quantitative',
      description: 'Mathematical problem solving in business contexts',
      totalHours: 90,
      proficiencyScale: {
        beginner: 'Basic arithmetic with difficulty in business applications',
        basic: 'Understands fundamentals but struggles with complex business problems',
        intermediate: 'Good mathematical skills with some advanced problem difficulties',
        advanced: 'Strong quantitative reasoning with efficient business problem solving',
        expert: 'Exceptional mathematical ability with sophisticated business analysis'
      },
      topics: [
        {
          id: 'problem_solving',
          name: 'Problem Solving',
          description: 'Quantitative reasoning and mathematical problem solving',
          difficulty: 'hard',
          estimatedHours: 45,
          keyAreas: [
            'Arithmetic and number properties',
            'Algebra and equations',
            'Geometry and coordinate geometry',
            'Word problems and applications',
            'Data interpretation'
          ]
        },
        {
          id: 'data_sufficiency',
          name: 'Data Sufficiency',
          description: 'Determining sufficiency of data to solve problems',
          difficulty: 'hard',
          estimatedHours: 45,
          keyAreas: [
            'Logical reasoning about data',
            'Statement analysis',
            'Sufficiency evaluation',
            'Mathematical relationships',
            'Strategic thinking'
          ]
        }
      ]
    },
    {
      id: 'integrated_reasoning',
      name: 'Integrated Reasoning',
      description: 'Multi-source reasoning and data interpretation',
      totalHours: 60,
      proficiencyScale: {
        beginner: 'Difficulty integrating information from multiple sources',
        basic: 'Can handle simple integration but struggles with complex data',
        intermediate: 'Good integration skills with some challenges in complex scenarios',
        advanced: 'Strong analytical skills with effective data synthesis',
        expert: 'Exceptional ability to synthesize complex multi-source information'
      },
      topics: [
        {
          id: 'multi_source_reasoning',
          name: 'Multi-Source Reasoning',
          description: 'Synthesizing information from multiple sources',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Information synthesis',
            'Source comparison',
            'Data integration',
            'Conflicting information analysis',
            'Comprehensive reasoning'
          ]
        },
        {
          id: 'table_analysis',
          name: 'Table Analysis',
          description: 'Analyzing data presented in tables',
          difficulty: 'medium',
          estimatedHours: 15,
          keyAreas: [
            'Data sorting and filtering',
            'Statistical analysis',
            'Trend identification',
            'Comparison techniques',
            'Logical deduction from data'
          ]
        },
        {
          id: 'graphics_interpretation',
          name: 'Graphics Interpretation',
          description: 'Interpreting information from graphs and charts',
          difficulty: 'medium',
          estimatedHours: 15,
          keyAreas: [
            'Chart and graph reading',
            'Data visualization interpretation',
            'Trend analysis',
            'Relationship identification',
            'Quantitative conclusions'
          ]
        },
        {
          id: 'two_part_analysis',
          name: 'Two-Part Analysis',
          description: 'Solving problems with interdependent components',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Component relationship analysis',
            'Interdependent problem solving',
            'Logical pairing',
            'Mathematical relationships',
            'Strategic reasoning'
          ]
        }
      ]
    },
    {
      id: 'analytical_writing',
      name: 'Analytical Writing Assessment',
      description: 'Critical analysis and communication skills',
      totalHours: 60,
      proficiencyScale: {
        beginner: 'Basic writing with unclear analysis and poor organization',
        basic: 'Simple analysis with adequate structure but limited insight',
        intermediate: 'Clear analysis with good organization and some depth',
        advanced: 'Strong analytical writing with excellent organization and insight',
        expert: 'Sophisticated analysis with exceptional clarity and compelling reasoning'
      },
      topics: [
        {
          id: 'analysis_of_argument',
          name: 'Analysis of an Argument',
          description: 'Critiquing the reasoning behind a given argument',
          difficulty: 'hard',
          estimatedHours: 60,
          keyAreas: [
            'Argument structure identification',
            'Assumption analysis',
            'Evidence evaluation',
            'Logical fallacy recognition',
            'Alternative explanation consideration',
            'Clear written communication'
          ]
        }
      ]
    }
  ],
  proficiencyQuestions: {
    critical_reasoning: {
      question: 'How well can you analyze business arguments and evaluate logical reasoning?',
      levels: [
        'I struggle to identify basic argument components',
        'I can recognize simple arguments but miss logical flaws',
        'I can analyze most arguments with some difficulty in complex reasoning',
        'I\'m good at identifying logical structures and evaluating arguments',
        'I excel at sophisticated argument analysis and logical evaluation'
      ]
    },
    reading_comprehension: {
      question: 'How well can you understand and analyze complex business texts?',
      levels: [
        'I struggle with complex business and academic texts',
        'I can understand basic content but miss deeper analysis',
        'I can comprehend most texts with some difficulty in complex passages',
        'I\'m good at understanding complex texts and drawing inferences',
        'I excel at sophisticated textual analysis and business reasoning'
      ]
    },
    sentence_correction: {
      question: 'How well do you understand grammar rules and effective business writing?',
      levels: [
        'I frequently make grammar errors and have unclear expression',
        'I understand basic grammar but struggle with complex structures',
        'I have good grammar skills with occasional errors in complex sentences',
        'I\'m proficient in grammar and can identify effective expression',
        'I have mastery of grammar and sophisticated writing principles'
      ]
    },
    problem_solving: {
      question: 'How well can you solve quantitative problems in business contexts?',
      levels: [
        'I struggle with basic mathematical operations and word problems',
        'I can solve simple problems but struggle with complex business applications',
        'I can handle most quantitative problems with some difficulty in advanced topics',
        'I\'m comfortable with quantitative reasoning and business problem solving',
        'I excel at complex mathematical reasoning and sophisticated business analysis'
      ]
    },
    data_sufficiency: {
      question: 'How well can you determine if given information is sufficient to solve problems?',
      levels: [
        'I have difficulty understanding the concept of data sufficiency',
        'I can handle simple sufficiency questions but struggle with complex logic',
        'I can evaluate sufficiency in most cases with some uncertainty',
        'I\'m good at logical reasoning about data sufficiency',
        'I excel at sophisticated sufficiency analysis and strategic thinking'
      ]
    },
    multi_source_reasoning: {
      question: 'How well can you synthesize information from multiple business sources?',
      levels: [
        'I struggle to integrate information from different sources',
        'I can combine basic information but miss complex relationships',
        'I can synthesize most information with some difficulty in complex scenarios',
        'I\'m good at integrating diverse information sources effectively',
        'I excel at sophisticated multi-source analysis and synthesis'
      ]
    },
    table_analysis: {
      question: 'How well can you analyze and interpret data presented in tables?',
      levels: [
        'I have difficulty reading and interpreting table data',
        'I can understand basic table information but struggle with analysis',
        'I can analyze most table data with some difficulty in complex interpretations',
        'I\'m comfortable with table analysis and data interpretation',
        'I excel at sophisticated table analysis and statistical reasoning'
      ]
    },
    graphics_interpretation: {
      question: 'How well can you interpret information from business charts and graphs?',
      levels: [
        'I struggle to read and understand basic charts and graphs',
        'I can interpret simple graphics but miss complex relationships',
        'I can understand most graphics with some difficulty in advanced analysis',
        'I\'m good at interpreting complex graphics and identifying trends',
        'I excel at sophisticated graphic interpretation and data visualization analysis'
      ]
    },
    two_part_analysis: {
      question: 'How well can you solve problems with interdependent components?',
      levels: [
        'I have difficulty understanding relationships between problem components',
        'I can handle simple two-part problems but struggle with complex relationships',
        'I can solve most two-part problems with some difficulty in complex logic',
        'I\'m good at analyzing interdependent relationships and solving complex problems',
        'I excel at sophisticated two-part analysis and strategic problem solving'
      ]
    },
    analysis_of_argument: {
      question: 'How well can you critically analyze and write about business arguments?',
      levels: [
        'I struggle to identify argument flaws and write clear analysis',
        'I can recognize basic argument issues but have difficulty expressing analysis clearly',
        'I can analyze arguments adequately with reasonably clear writing',
        'I\'m good at sophisticated argument analysis with clear written expression',
        'I excel at complex argument critique with exceptional analytical writing'
      ]
    }
  }
}; 