import { ExamCurriculum } from './sat-curriculum';

export const toeflCurriculum: ExamCurriculum = {
  examId: 'toefl',
  examName: 'TOEFL',
  fullName: 'Test of English as a Foreign Language',
  description: 'English proficiency test for non-native speakers',
  duration: '3 hours',
  totalHours: 180,
  subjects: [
    {
      id: 'reading',
      name: 'Reading',
      description: 'Academic reading comprehension and analysis',
      totalHours: 50,
      proficiencyScale: {
        beginner: 'Struggles with basic academic texts and vocabulary',
        basic: 'Can understand simple texts but misses important details',
        intermediate: 'Good comprehension with some difficulty in complex passages',
        advanced: 'Strong reading skills with good analytical abilities',
        expert: 'Excellent comprehension of complex academic texts'
      },
      topics: [
        {
          id: 'main_ideas',
          name: 'Main Ideas and Details',
          description: 'Identifying central themes and supporting information',
          difficulty: 'easy',
          estimatedHours: 15,
          keyAreas: [
            'Topic identification',
            'Main idea recognition',
            'Supporting detail location',
            'Summary skills',
            'Essential vs. non-essential information'
          ]
        },
        {
          id: 'inference_vocabulary',
          name: 'Inference and Vocabulary',
          description: 'Understanding implied meanings and context clues',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Context clue usage',
            'Vocabulary in context',
            'Implied meaning inference',
            'Author purpose and attitude',
            'Tone recognition'
          ]
        },
        {
          id: 'text_structure',
          name: 'Text Structure and Organization',
          description: 'Understanding how academic texts are organized',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Rhetorical patterns',
            'Organizational structures',
            'Transition recognition',
            'Cause-effect relationships',
            'Compare-contrast analysis'
          ]
        }
      ]
    },
    {
      id: 'listening',
      name: 'Listening',
      description: 'Academic listening comprehension and note-taking',
      totalHours: 50,
      proficiencyScale: {
        beginner: 'Difficulty understanding basic spoken English',
        basic: 'Can follow simple conversations but misses details',
        intermediate: 'Good listening skills with some challenges in lectures',
        advanced: 'Strong listening abilities in academic contexts',
        expert: 'Excellent comprehension of complex academic discourse'
      },
      topics: [
        {
          id: 'basic_comprehension',
          name: 'Basic Comprehension',
          description: 'Understanding main ideas and important details in lectures',
          difficulty: 'easy',
          estimatedHours: 15,
          keyAreas: [
            'Main topic identification',
            'Key detail recognition',
            'Speaker purpose understanding',
            'Basic note-taking skills',
            'Information categorization'
          ]
        },
        {
          id: 'pragmatic_understanding',
          name: 'Pragmatic Understanding',
          description: 'Understanding speaker attitude, purpose, and implied meaning',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Speaker attitude recognition',
            'Purpose identification',
            'Implied meaning inference',
            'Emphasis and stress patterns',
            'Rhetorical function understanding'
          ]
        },
        {
          id: 'connecting_information',
          name: 'Connecting Information',
          description: 'Making connections and organizing information',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Information synthesis',
            'Relationship identification',
            'Classification skills',
            'Process understanding',
            'Advanced note-taking strategies'
          ]
        }
      ]
    },
    {
      id: 'speaking',
      name: 'Speaking',
      description: 'Oral communication in academic and everyday contexts',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Limited vocabulary and pronunciation issues',
        basic: 'Basic communication with noticeable language limitations',
        intermediate: 'Generally effective communication with minor errors',
        advanced: 'Clear and fluent speech with good organization',
        expert: 'Highly effective communication with natural fluency'
      },
      topics: [
        {
          id: 'independent_speaking',
          name: 'Independent Speaking',
          description: 'Expressing personal opinions and preferences',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Opinion expression',
            'Personal experience sharing',
            'Clear reasoning',
            'Organized responses',
            'Appropriate examples'
          ]
        },
        {
          id: 'integrated_speaking',
          name: 'Integrated Speaking',
          description: 'Combining information from reading and listening',
          difficulty: 'hard',
          estimatedHours: 20,
          keyAreas: [
            'Information synthesis',
            'Summarization skills',
            'Academic content delivery',
            'Reading-listening integration',
            'Clear explanations'
          ]
        }
      ]
    },
    {
      id: 'writing',
      name: 'Writing',
      description: 'Academic writing skills and essay composition',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Basic sentence structure with frequent errors',
        basic: 'Simple writing with adequate organization',
        intermediate: 'Clear writing with good organization and few errors',
        advanced: 'Well-developed writing with sophisticated language use',
        expert: 'Excellent writing with complex ideas and varied language'
      },
      topics: [
        {
          id: 'integrated_writing',
          name: 'Integrated Writing',
          description: 'Combining reading and listening information in writing',
          difficulty: 'hard',
          estimatedHours: 20,
          keyAreas: [
            'Information synthesis',
            'Source integration',
            'Academic summarization',
            'Clear comparisons',
            'Objective reporting'
          ]
        },
        {
          id: 'independent_writing',
          name: 'Independent Writing',
          description: 'Writing essays based on personal knowledge and experience',
          difficulty: 'medium',
          estimatedHours: 20,
          keyAreas: [
            'Essay organization',
            'Thesis development',
            'Supporting evidence',
            'Clear examples',
            'Conclusion writing'
          ]
        }
      ]
    }
  ],
  proficiencyQuestions: {
    main_ideas: {
      question: 'How well can you identify main ideas and key details in academic texts?',
      levels: [
        'I struggle to understand the basic meaning of academic texts',
        'I can identify simple main ideas but miss important details',
        'I can find main ideas and most key details with some effort',
        'I\'m good at identifying main ideas and supporting information',
        'I excel at quickly identifying central themes and all key details'
      ]
    },
    inference_vocabulary: {
      question: 'How well can you understand vocabulary and implied meanings in context?',
      levels: [
        'I struggle with academic vocabulary and rarely understand implications',
        'I understand basic vocabulary but miss implied meanings',
        'I can guess vocabulary meaning and understand some implications',
        'I\'m good at using context clues and understanding implied meanings',
        'I excel at vocabulary comprehension and sophisticated inference'
      ]
    },
    text_structure: {
      question: 'How well do you understand how academic texts are organized?',
      levels: [
        'I have difficulty following the organization of texts',
        'I can follow simple text structures but struggle with complex ones',
        'I understand most organizational patterns with some difficulty',
        'I\'m good at recognizing different text structures and patterns',
        'I excel at understanding complex organizational structures and relationships'
      ]
    },
    basic_comprehension: {
      question: 'How well can you understand main ideas in academic lectures?',
      levels: [
        'I struggle to follow basic spoken English in academic contexts',
        'I can understand simple lectures but miss many details',
        'I can follow most lectures with some difficulty understanding details',
        'I\'m good at understanding lectures and taking effective notes',
        'I excel at comprehending complex academic discourse and detailed information'
      ]
    },
    pragmatic_understanding: {
      question: 'How well can you understand speaker attitudes and implied meanings?',
      levels: [
        'I have difficulty understanding anything beyond literal meaning',
        'I can understand basic attitudes but miss subtle implications',
        'I can identify most speaker attitudes and some implied meanings',
        'I\'m good at understanding speaker purpose and implied meanings',
        'I excel at understanding subtle attitudes and complex implications'
      ]
    },
    connecting_information: {
      question: 'How well can you organize and connect information from lectures?',
      levels: [
        'I struggle to organize information and see relationships',
        'I can organize basic information but miss complex connections',
        'I can make most connections with some difficulty organizing complex information',
        'I\'m good at synthesizing information and identifying relationships',
        'I excel at organizing complex information and making sophisticated connections'
      ]
    },
    independent_speaking: {
      question: 'How well can you express your opinions and ideas clearly in English?',
      levels: [
        'I struggle to express basic ideas clearly',
        'I can communicate simple ideas but with limited vocabulary and clarity',
        'I can express most ideas clearly with some language limitations',
        'I\'m good at expressing complex ideas with clear organization',
        'I excel at articulating sophisticated ideas with natural fluency'
      ]
    },
    integrated_speaking: {
      question: 'How well can you combine and present information from multiple sources?',
      levels: [
        'I have great difficulty synthesizing information from different sources',
        'I can combine basic information but struggle with complex synthesis',
        'I can synthesize most information with some organizational challenges',
        'I\'m good at integrating information and presenting it clearly',
        'I excel at sophisticated synthesis and clear academic presentation'
      ]
    },
    integrated_writing: {
      question: 'How well can you write essays that combine reading and listening information?',
      levels: [
        'I struggle to write coherent essays that combine sources',
        'I can write basic essays but have difficulty integrating sources effectively',
        'I can integrate sources with adequate organization and some language errors',
        'I\'m good at writing well-organized essays with effective source integration',
        'I excel at sophisticated synthesis writing with excellent language control'
      ]
    },
    independent_writing: {
      question: 'How well can you write organized essays expressing your own ideas?',
      levels: [
        'I struggle to organize my ideas in writing',
        'I can write simple essays with basic organization',
        'I can write organized essays with clear ideas and some language errors',
        'I\'m good at writing well-developed essays with strong organization',
        'I excel at writing sophisticated essays with complex ideas and excellent language'
      ]
    }
  }
}; 