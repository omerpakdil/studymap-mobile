import { ExamCurriculum } from './sat-curriculum';

export const lsatCurriculum: ExamCurriculum = {
  examId: 'lsat',
  examName: 'LSAT',
  fullName: 'Law School Admission Test',
  description: 'Law school admission test focusing on logical reasoning and analysis',
  duration: '3 hours 35 minutes',
  totalHours: 280,
  subjects: [
    {
      id: 'logical_reasoning',
      name: 'Logical Reasoning',
      description: 'Critical analysis of arguments and logical structures',
      totalHours: 140,
      proficiencyScale: {
        beginner: 'Difficulty recognizing basic argument structures and logical patterns',
        basic: 'Can identify simple arguments but struggles with complex logical reasoning',
        intermediate: 'Good logical analysis with some challenges in sophisticated reasoning',
        advanced: 'Strong logical reasoning with effective argument evaluation',
        expert: 'Exceptional logical analysis with sophisticated reasoning abilities'
      },
      topics: [
        {
          id: 'assumption_questions',
          name: 'Assumption Questions',
          description: 'Identifying unstated assumptions that arguments depend on',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Necessary assumption identification',
            'Sufficient assumption recognition',
            'Assumption vs. inference distinction',
            'Logical gap analysis',
            'Argument foundation understanding'
          ]
        },
        {
          id: 'strengthen_weaken',
          name: 'Strengthen/Weaken Questions',
          description: 'Finding evidence that supports or undermines arguments',
          difficulty: 'medium',
          estimatedHours: 25,
          keyAreas: [
            'Evidence evaluation',
            'Argument support identification',
            'Counterevidence recognition',
            'Logical impact assessment',
            'Reasoning reinforcement'
          ]
        },
        {
          id: 'flaw_questions',
          name: 'Flaw Questions',
          description: 'Identifying logical errors and reasoning mistakes',
          difficulty: 'hard',
          estimatedHours: 25,
          keyAreas: [
            'Logical fallacy recognition',
            'Reasoning error identification',
            'Argument structure flaws',
            'Invalid inference detection',
            'Logical mistake categorization'
          ]
        },
        {
          id: 'inference_questions',
          name: 'Inference Questions',
          description: 'Drawing logical conclusions from given information',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Valid conclusion drawing',
            'Logical deduction',
            'Information synthesis',
            'Certainty vs. possibility',
            'Logical consequence identification'
          ]
        }
      ]
    },
    {
      id: 'reading_comprehension',
      name: 'Reading Comprehension',
      description: 'Understanding and analyzing complex legal and academic texts',
      totalHours: 70,
      proficiencyScale: {
        beginner: 'Struggles with complex texts and misses important details',
        basic: 'Can understand basic content but has difficulty with analysis',
        intermediate: 'Good comprehension with some challenges in complex analysis',
        advanced: 'Strong reading skills with effective analytical abilities',
        expert: 'Exceptional comprehension with sophisticated analytical reasoning'
      },
      topics: [
        {
          id: 'main_point_questions',
          name: 'Main Point Questions',
          description: 'Identifying central themes and primary arguments',
          difficulty: 'easy',
          estimatedHours: 20,
          keyAreas: [
            'Central argument identification',
            'Primary purpose recognition',
            'Main thesis understanding',
            'Overall message comprehension',
            'Author\'s primary claim'
          ]
        },
        {
          id: 'detail_questions',
          name: 'Detail Questions',
          description: 'Locating and understanding specific information in passages',
          difficulty: 'easy',
          estimatedHours: 15,
          keyAreas: [
            'Specific information location',
            'Detail comprehension',
            'Factual accuracy',
            'Precise reading',
            'Information retrieval'
          ]
        },
        {
          id: 'inference_questions_rc',
          name: 'Inference Questions',
          description: 'Drawing logical conclusions from passage information',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Implicit meaning understanding',
            'Logical deduction from text',
            'Unstated conclusion drawing',
            'Reading between the lines',
            'Implied information recognition'
          ]
        },
        {
          id: 'structure_questions',
          name: 'Structure Questions',
          description: 'Understanding how passages are organized and function',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Passage organization analysis',
            'Argumentative structure',
            'Rhetorical function understanding',
            'Paragraph relationship',
            'Organizational pattern recognition'
          ]
        }
      ]
    },
    {
      id: 'analytical_reasoning',
      name: 'Analytical Reasoning (Logic Games)',
      description: 'Logical puzzle solving and rule-based reasoning',
      totalHours: 70,
      proficiencyScale: {
        beginner: 'Difficulty understanding game setup and basic rule application',
        basic: 'Can handle simple games but struggles with complex rule interactions',
        intermediate: 'Good game analysis with some challenges in difficult scenarios',
        advanced: 'Strong analytical skills with effective systematic approaches',
        expert: 'Exceptional logical reasoning with sophisticated game mastery'
      },
      topics: [
        {
          id: 'sequencing_games',
          name: 'Sequencing Games',
          description: 'Ordering elements according to given constraints',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Linear ordering',
            'Relative positioning',
            'Sequential constraints',
            'Ordering rules application',
            'Position determination'
          ]
        },
        {
          id: 'grouping_games',
          name: 'Grouping Games',
          description: 'Dividing elements into groups based on rules',
          difficulty: 'medium',
          estimatedHours: 25,
          keyAreas: [
            'Group formation',
            'Selection criteria',
            'Inclusion/exclusion rules',
            'Group composition',
            'Assignment logic'
          ]
        },
        {
          id: 'matching_games',
          name: 'Matching Games',
          description: 'Pairing elements according to specified relationships',
          difficulty: 'medium',
          estimatedHours: 15,
          keyAreas: [
            'Element pairing',
            'Relationship mapping',
            'Correspondence rules',
            'Matching constraints',
            'Association logic'
          ]
        },
        {
          id: 'hybrid_games',
          name: 'Hybrid Games',
          description: 'Complex games combining multiple game types',
          difficulty: 'hard',
          estimatedHours: 10,
          keyAreas: [
            'Multi-dimensional analysis',
            'Complex rule interaction',
            'Combined constraint handling',
            'Integrated logical reasoning',
            'Advanced problem solving'
          ]
        }
      ]
    }
  ],
  proficiencyQuestions: {
    assumption_questions: {
      question: 'How well can you identify unstated assumptions in logical arguments?',
      levels: [
        'I struggle to understand what assumptions are and how to find them',
        'I can identify basic assumptions but miss complex logical gaps',
        'I can find most assumptions with some difficulty in complex arguments',
        'I\'m good at identifying both necessary and sufficient assumptions',
        'I excel at sophisticated assumption analysis and logical gap recognition'
      ]
    },
    strengthen_weaken: {
      question: 'How well can you identify evidence that strengthens or weakens arguments?',
      levels: [
        'I have difficulty understanding how evidence affects arguments',
        'I can identify obvious supporting/opposing evidence but miss subtle impacts',
        'I can evaluate most evidence with some uncertainty about logical impact',
        'I\'m good at assessing how evidence affects argument strength',
        'I excel at sophisticated evidence evaluation and argument impact analysis'
      ]
    },
    flaw_questions: {
      question: 'How well can you identify logical errors and reasoning mistakes?',
      levels: [
        'I struggle to recognize basic logical errors in arguments',
        'I can identify obvious flaws but miss subtle reasoning mistakes',
        'I can spot most logical errors with some difficulty in complex cases',
        'I\'m good at recognizing various types of logical fallacies',
        'I excel at identifying sophisticated reasoning errors and logical flaws'
      ]
    },
    inference_questions: {
      question: 'How well can you draw valid logical conclusions from given information?',
      levels: [
        'I have difficulty drawing logical conclusions from premises',
        'I can make basic inferences but struggle with complex logical deduction',
        'I can draw most valid conclusions with some uncertainty',
        'I\'m good at logical deduction and inference making',
        'I excel at sophisticated logical reasoning and conclusion drawing'
      ]
    },
    main_point_questions: {
      question: 'How well can you identify main ideas and central arguments in complex texts?',
      levels: [
        'I struggle to identify the main point in complex passages',
        'I can find basic main ideas but miss subtle central arguments',
        'I can identify most main points with some difficulty in complex texts',
        'I\'m good at recognizing central themes and primary arguments',
        'I excel at sophisticated main point identification and argument analysis'
      ]
    },
    detail_questions: {
      question: 'How well can you locate and understand specific information in passages?',
      levels: [
        'I have difficulty finding specific details in complex texts',
        'I can locate basic information but sometimes miss important details',
        'I can find most specific information with careful reading',
        'I\'m good at precise information retrieval and detail comprehension',
        'I excel at efficient detail location and comprehensive understanding'
      ]
    },
    inference_questions_rc: {
      question: 'How well can you draw conclusions from reading passage information?',
      levels: [
        'I struggle to make valid inferences from passage content',
        'I can make basic inferences but miss subtle implied meanings',
        'I can draw most valid conclusions with some uncertainty',
        'I\'m good at reading between the lines and making logical inferences',
        'I excel at sophisticated inference making and implicit meaning recognition'
      ]
    },
    structure_questions: {
      question: 'How well can you understand how passages are organized and function?',
      levels: [
        'I have difficulty understanding passage organization and structure',
        'I can recognize basic organizational patterns but miss complex structures',
        'I can analyze most passage structures with some effort',
        'I\'m good at understanding rhetorical organization and argument structure',
        'I excel at sophisticated structural analysis and organizational pattern recognition'
      ]
    },
    sequencing_games: {
      question: 'How well can you solve logic games involving ordering and sequencing?',
      levels: [
        'I struggle with basic sequencing and ordering concepts',
        'I can handle simple linear games but struggle with complex constraints',
        'I can solve most sequencing games with some difficulty',
        'I\'m good at systematic sequencing analysis and constraint application',
        'I excel at complex sequencing games with sophisticated rule interactions'
      ]
    },
    grouping_games: {
      question: 'How well can you solve logic games involving group formation and selection?',
      levels: [
        'I have difficulty understanding grouping rules and constraints',
        'I can handle basic grouping but struggle with complex selection criteria',
        'I can solve most grouping games with some effort',
        'I\'m good at systematic group analysis and rule application',
        'I excel at complex grouping games with sophisticated constraint handling'
      ]
    },
    matching_games: {
      question: 'How well can you solve logic games involving pairing and correspondence?',
      levels: [
        'I struggle with basic matching and pairing concepts',
        'I can handle simple matching but struggle with complex relationships',
        'I can solve most matching games with some difficulty',
        'I\'m good at systematic matching analysis and relationship mapping',
        'I excel at complex matching games with sophisticated correspondence rules'
      ]
    },
    hybrid_games: {
      question: 'How well can you solve complex logic games combining multiple game types?',
      levels: [
        'I struggle with basic logic games and cannot handle hybrid complexity',
        'I can solve simple games but find hybrid games overwhelming',
        'I can handle some hybrid games but struggle with complex combinations',
        'I\'m good at analyzing multi-dimensional games with integrated constraints',
        'I excel at sophisticated hybrid games with complex rule interactions'
      ]
    }
  }
}; 