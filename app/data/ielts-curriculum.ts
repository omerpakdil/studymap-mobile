import { ExamCurriculum } from './sat-curriculum';

export const ieltsCurriculum: ExamCurriculum = {
  examId: 'ielts',
  examName: 'IELTS',
  fullName: 'International English Language Testing System',
  description: 'English proficiency test for study, work, and migration',
  duration: '2 hours 45 minutes',
  totalHours: 160,
  subjects: [
    {
      id: 'listening',
      name: 'Listening',
      description: 'Understanding spoken English in various contexts',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Understands only familiar topics with repetition',
        basic: 'Follows simple conversations and clear speech',
        intermediate: 'Understands most everyday and some academic content',
        advanced: 'Comprehends complex discussions and lectures well',
        expert: 'Understands virtually all spoken English naturally'
      },
      topics: [
        {
          id: 'everyday_conversations',
          name: 'Everyday Conversations',
          description: 'Social situations and daily life interactions',
          difficulty: 'easy',
          estimatedHours: 10,
          keyAreas: [
            'Personal information exchange',
            'Shopping and services',
            'Social arrangements',
            'Travel and transportation',
            'Accommodation inquiries'
          ]
        },
        {
          id: 'academic_discussions',
          name: 'Academic Discussions',
          description: 'Educational contexts and study-related conversations',
          difficulty: 'medium',
          estimatedHours: 15,
          keyAreas: [
            'Course selection and enrollment',
            'Assignment discussions',
            'Tutorial sessions',
            'Study group planning',
            'Academic support services'
          ]
        },
        {
          id: 'lectures_talks',
          name: 'Lectures and Educational Talks',
          description: 'Formal presentations and academic lectures',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Academic lecture comprehension',
            'Conference presentations',
            'Training sessions',
            'Formal speeches',
            'Educational programs'
          ]
        }
      ]
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'Understanding written English from various sources',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Reads simple texts with basic vocabulary',
        basic: 'Understands straightforward texts on familiar topics',
        intermediate: 'Comprehends most general and some academic texts',
        advanced: 'Reads complex texts with good understanding',
        expert: 'Handles virtually all forms of written language'
      },
      topics: [
        {
          id: 'general_texts',
          name: 'General Interest Texts',
          description: 'Newspapers, magazines, and everyday materials',
          difficulty: 'easy',
          estimatedHours: 12,
          keyAreas: [
            'News articles',
            'Magazine features',
            'Advertisements',
            'Public notices',
            'Travel brochures'
          ]
        },
        {
          id: 'workplace_texts',
          name: 'Workplace Texts',
          description: 'Professional and training materials',
          difficulty: 'medium',
          estimatedHours: 14,
          keyAreas: [
            'Job descriptions',
            'Training materials',
            'Company policies',
            'Professional correspondence',
            'Technical instructions'
          ]
        },
        {
          id: 'academic_texts',
          name: 'Academic Texts',
          description: 'Educational and scholarly materials',
          difficulty: 'hard',
          estimatedHours: 14,
          keyAreas: [
            'Textbook excerpts',
            'Research articles',
            'Academic reports',
            'Course materials',
            'Educational resources'
          ]
        }
      ]
    },
    {
      id: 'writing',
      name: 'Writing',
      description: 'Written communication for different purposes and audiences',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Basic sentence construction with frequent errors',
        basic: 'Simple texts with adequate meaning but limited range',
        intermediate: 'Generally effective communication with good organization',
        advanced: 'Well-structured texts with wide range of language',
        expert: 'Sophisticated writing with natural and effective language use'
      },
      topics: [
        {
          id: 'task1_academic',
          name: 'Task 1 - Academic',
          description: 'Describing visual information (graphs, charts, diagrams)',
          difficulty: 'medium',
          estimatedHours: 15,
          keyAreas: [
            'Data description',
            'Chart interpretation',
            'Trend analysis',
            'Comparison techniques',
            'Process explanation'
          ]
        },
        {
          id: 'task1_general',
          name: 'Task 1 - General',
          description: 'Letter writing for various purposes',
          difficulty: 'easy',
          estimatedHours: 10,
          keyAreas: [
            'Formal letters',
            'Informal letters',
            'Complaint letters',
            'Request letters',
            'Invitation letters'
          ]
        },
        {
          id: 'task2_essay',
          name: 'Task 2 - Essay Writing',
          description: 'Discursive writing on various topics',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Opinion essays',
            'Discussion essays',
            'Problem-solution essays',
            'Advantage-disadvantage essays',
            'Two-part questions'
          ]
        }
      ]
    },
    {
      id: 'speaking',
      name: 'Speaking',
      description: 'Oral communication in face-to-face interview format',
      totalHours: 40,
      proficiencyScale: {
        beginner: 'Limited communication with frequent pauses and errors',
        basic: 'Basic communication on familiar topics with some hesitation',
        intermediate: 'Generally effective communication with occasional errors',
        advanced: 'Fluent and natural speech with wide range of language',
        expert: 'Highly articulate with sophisticated language use'
      },
      topics: [
        {
          id: 'part1_introduction',
          name: 'Part 1 - Introduction and Interview',
          description: 'Personal questions about familiar topics',
          difficulty: 'easy',
          estimatedHours: 10,
          keyAreas: [
            'Personal information',
            'Family and friends',
            'Hobbies and interests',
            'Daily routines',
            'Hometown description'
          ]
        },
        {
          id: 'part2_long_turn',
          name: 'Part 2 - Long Turn',
          description: 'Individual presentation on given topic',
          difficulty: 'medium',
          estimatedHours: 15,
          keyAreas: [
            'Topic development',
            'Sustained speech',
            'Descriptive language',
            'Personal experiences',
            'Organized presentation'
          ]
        },
        {
          id: 'part3_discussion',
          name: 'Part 3 - Discussion',
          description: 'Abstract discussion related to Part 2 topic',
          difficulty: 'hard',
          estimatedHours: 15,
          keyAreas: [
            'Abstract thinking',
            'Opinion justification',
            'Complex discussions',
            'Future predictions',
            'Hypothetical situations'
          ]
        }
      ]
    }
  ],
  proficiencyQuestions: {
    everyday_conversations: {
      question: 'How well can you understand everyday English conversations?',
      levels: [
        'I struggle to understand basic conversations',
        'I can follow simple conversations with repetition',
        'I understand most everyday conversations clearly',
        'I easily follow complex everyday discussions',
        'I understand all conversation nuances naturally'
      ]
    },
    academic_discussions: {
      question: 'How well can you follow academic and educational discussions?',
      levels: [
        'I have difficulty understanding academic contexts',
        'I can follow simple academic discussions with effort',
        'I understand most academic conversations adequately',
        'I easily follow complex academic discussions',
        'I understand sophisticated academic discourse naturally'
      ]
    },
    lectures_talks: {
      question: 'How well can you understand formal lectures and presentations?',
      levels: [
        'I struggle to follow formal presentations',
        'I can understand simple lectures with concentration',
        'I follow most lectures with good comprehension',
        'I easily understand complex academic lectures',
        'I comprehend all formal presentations effortlessly'
      ]
    },
    general_texts: {
      question: 'How well can you read general interest texts like newspapers and magazines?',
      levels: [
        'I struggle with general reading materials',
        'I can read simple texts with some difficulty',
        'I understand most general texts well',
        'I easily read complex general materials',
        'I comprehend all general texts naturally'
      ]
    },
    workplace_texts: {
      question: 'How well can you understand workplace and professional texts?',
      levels: [
        'I have difficulty with professional materials',
        'I can read simple workplace texts with effort',
        'I understand most professional texts adequately',
        'I easily comprehend complex workplace materials',
        'I handle all professional texts with complete understanding'
      ]
    },
    academic_texts: {
      question: 'How well can you read academic and scholarly texts?',
      levels: [
        'I struggle with academic reading materials',
        'I can read simple academic texts with difficulty',
        'I understand most academic texts with effort',
        'I easily comprehend complex academic materials',
        'I read all academic texts with sophisticated understanding'
      ]
    },
    task1_academic: {
      question: 'How well can you describe charts, graphs, and visual data in writing?',
      levels: [
        'I struggle to describe visual information clearly',
        'I can describe simple charts with basic language',
        'I adequately describe most visual data',
        'I clearly explain complex visual information',
        'I expertly analyze and describe sophisticated data'
      ]
    },
    task1_general: {
      question: 'How well can you write different types of letters?',
      levels: [
        'I have difficulty writing clear letters',
        'I can write simple letters with basic structure',
        'I write most letters with appropriate style',
        'I easily write effective letters for various purposes',
        'I expertly craft sophisticated correspondence'
      ]
    },
    task2_essay: {
      question: 'How well can you write essays discussing various topics and issues?',
      levels: [
        'I struggle to write organized essays',
        'I can write simple essays with basic arguments',
        'I write well-structured essays with clear ideas',
        'I easily compose sophisticated argumentative essays',
        'I expertly craft complex essays with advanced reasoning'
      ]
    },
    part1_introduction: {
      question: 'How well can you discuss personal topics and familiar subjects?',
      levels: [
        'I struggle to discuss even familiar topics clearly',
        'I can talk about personal topics with simple language',
        'I discuss familiar subjects with good fluency',
        'I easily talk about personal topics with rich language',
        'I expertly discuss any familiar topic with sophisticated expression'
      ]
    },
    part2_long_turn: {
      question: 'How well can you give a sustained presentation on a given topic?',
      levels: [
        'I have difficulty speaking continuously for 2 minutes',
        'I can give simple presentations with basic development',
        'I present topics with adequate development and fluency',
        'I easily give well-developed presentations with good language',
        'I expertly deliver sophisticated presentations with advanced language'
      ]
    },
    part3_discussion: {
      question: 'How well can you discuss abstract topics and complex issues?',
      levels: [
        'I struggle with abstract discussions',
        'I can discuss complex topics with simple language',
        'I handle abstract discussions with reasonable fluency',
        'I easily discuss complex issues with sophisticated language',
        'I expertly engage in abstract discussions with advanced reasoning'
      ]
    }
  }
}; 