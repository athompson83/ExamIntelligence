// Export service for generating testbank exports in various LMS formats
import * as xml2js from 'xml2js';
import * as JSZip from 'jszip';

export interface ExportQuestion {
  id: string;
  questionText: string;
  questionType: string;
  difficultyLevel?: number;
  points?: number;
  explanation?: string;
  answerOptions: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export interface ExportTestbank {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  tags?: string[];
  learningObjectives?: string[];
}

// QTI 2.1 Export (IMS Question & Test Interoperability)
export function generateQTIExport(testbank: ExportTestbank, questions: ExportQuestion[]): Buffer {
  const zip = new JSZip();
  
  // Generate imsmanifest.xml
  const manifest = generateQTIManifest(testbank, questions);
  zip.file('imsmanifest.xml', manifest);
  
  // Generate assessment test XML
  const assessmentTest = generateQTIAssessmentTest(testbank, questions);
  zip.file(`${testbank.id}_test.xml`, assessmentTest);
  
  // Generate individual question items
  questions.forEach((question, index) => {
    const questionXML = generateQTIQuestion(question, index);
    zip.file(`question_${question.id}.xml`, questionXML);
  });
  
  return zip.generateSync({ type: 'nodebuffer' });
}

function generateQTIManifest(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const builder = new xml2js.Builder({ 
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  const manifest = {
    manifest: {
      $: {
        'xmlns': 'http://www.imsglobal.org/xsd/imscp_v1p1',
        'xmlns:imsmd': 'http://www.imsglobal.org/xsd/imsmd_v1p2',
        'xmlns:imsqti': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        'identifier': `MANIFEST_${testbank.id}`,
        'version': '1.0'
      },
      metadata: {
        schema: 'IMS Content',
        schemaversion: '1.1.2'
      },
      organizations: {
        $: { default: testbank.id },
        organization: {
          $: { identifier: testbank.id },
          title: testbank.title,
          item: questions.map((q, i) => ({
            $: { identifier: `item_${q.id}`, identifierref: `resource_${q.id}` },
            title: `Question ${i + 1}`
          }))
        }
      },
      resources: {
        resource: [
          {
            $: {
              identifier: `resource_test_${testbank.id}`,
              type: 'imsqti_test_xmlv2p1',
              href: `${testbank.id}_test.xml`
            },
            file: { $: { href: `${testbank.id}_test.xml` } }
          },
          ...questions.map(q => ({
            $: {
              identifier: `resource_${q.id}`,
              type: 'imsqti_item_xmlv2p1',
              href: `question_${q.id}.xml`
            },
            file: { $: { href: `question_${q.id}.xml` } }
          }))
        ]
      }
    }
  };

  return builder.buildObject(manifest);
}

function generateQTIAssessmentTest(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  const assessmentTest = {
    assessmentTest: {
      $: {
        'xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd',
        identifier: `test_${testbank.id}`,
        title: testbank.title
      },
      testPart: {
        $: { identifier: 'testPart1', navigationMode: 'linear', submissionMode: 'individual' },
        assessmentSection: {
          $: { identifier: 'section1', title: testbank.title, visible: 'true' },
          assessmentItemRef: questions.map(q => ({
            $: { identifier: `item_${q.id}`, href: `question_${q.id}.xml` }
          }))
        }
      }
    }
  };

  return builder.buildObject(assessmentTest);
}

function generateQTIQuestion(question: ExportQuestion, index: number): string {
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  const correctAnswers = question.answerOptions.filter(opt => opt.isCorrect);
  
  const assessmentItem = {
    assessmentItem: {
      $: {
        'xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd',
        identifier: question.id,
        title: `Question ${index + 1}`,
        adaptive: 'false',
        timeDependent: 'false'
      },
      responseDeclaration: {
        $: {
          identifier: 'RESPONSE',
          cardinality: question.questionType === 'multiple_select' ? 'multiple' : 'single',
          baseType: 'identifier'
        },
        correctResponse: {
          value: correctAnswers.map(opt => opt.id)
        }
      },
      outcomeDeclaration: {
        $: { identifier: 'SCORE', cardinality: 'single', baseType: 'float' },
        defaultValue: { value: '0' }
      },
      itemBody: {
        p: question.questionText,
        choiceInteraction: {
          $: {
            responseIdentifier: 'RESPONSE',
            shuffle: 'false',
            maxChoices: question.questionType === 'multiple_select' ? '0' : '1'
          },
          simpleChoice: question.answerOptions.map(opt => ({
            $: { identifier: opt.id },
            _: opt.optionText
          }))
        }
      },
      responseProcessing: {
        $: { template: 'http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct' }
      }
    }
  };

  return builder.buildObject(assessmentItem);
}

// CSV Export
export function generateCSVExport(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const headers = [
    'Question ID',
    'Question Text',
    'Question Type',
    'Difficulty Level',
    'Points',
    'Option A',
    'Option B', 
    'Option C',
    'Option D',
    'Option E',
    'Correct Answer(s)',
    'Explanation',
    'Tags',
    'Learning Objectives'
  ];

  const rows = questions.map(question => {
    const options = ['', '', '', '', '']; // 5 options max
    question.answerOptions.forEach((opt, idx) => {
      if (idx < 5) options[idx] = opt.optionText;
    });

    const correctAnswers = question.answerOptions
      .map((opt, idx) => opt.isCorrect ? String.fromCharCode(65 + idx) : null)
      .filter(Boolean)
      .join(', ');

    return [
      question.id,
      `"${question.questionText.replace(/"/g, '""')}"`,
      question.questionType,
      question.difficultyLevel || '',
      question.points || 1,
      `"${options[0].replace(/"/g, '""')}"`,
      `"${options[1].replace(/"/g, '""')}"`,
      `"${options[2].replace(/"/g, '""')}"`,
      `"${options[3].replace(/"/g, '""')}"`,
      `"${options[4].replace(/"/g, '""')}"`,
      correctAnswers,
      `"${(question.explanation || '').replace(/"/g, '""')}"`,
      `"${(testbank.tags || []).join('; ')}"`,
      `"${(testbank.learningObjectives || []).join('; ')}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// XML Export (Generic)
export function generateXMLExport(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  const xmlData = {
    testbank: {
      $: { id: testbank.id, version: '1.0' },
      metadata: {
        title: testbank.title,
        description: testbank.description || '',
        subject: testbank.subject || '',
        tags: { tag: testbank.tags || [] },
        learningObjectives: { objective: testbank.learningObjectives || [] },
        exportedAt: new Date().toISOString(),
        questionCount: questions.length
      },
      questions: {
        question: questions.map(q => ({
          $: { id: q.id, type: q.questionType },
          questionText: q.questionText,
          difficultyLevel: q.difficultyLevel || 1,
          points: q.points || 1,
          explanation: q.explanation || '',
          answerOptions: {
            option: q.answerOptions.map(opt => ({
              $: { id: opt.id, correct: opt.isCorrect },
              text: opt.optionText,
              explanation: opt.explanation || ''
            }))
          }
        }))
      }
    }
  };

  return builder.buildObject(xmlData);
}

// Canvas LMS Compatible Export
export function generateCanvasExport(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  const canvasData = {
    quiz: {
      $: { 
        'xmlns': 'http://canvas.instructure.com/xsd/cccv1p0',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        identifier: testbank.id
      },
      title: testbank.title,
      description: testbank.description || '',
      quiz_type: 'assignment',
      points_possible: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      allowed_attempts: 1,
      scoring_policy: 'keep_highest',
      access_code: '',
      ip_filter: '',
      shuffle_answers: false,
      time_limit: null,
      questions: {
        question: questions.map((q, index) => ({
          $: { id: q.id },
          question_type: mapToCanvasQuestionType(q.questionType),
          question_name: `Question ${index + 1}`,
          question_text: q.questionText,
          points_possible: q.points || 1,
          difficulty: q.difficultyLevel || 1,
          answers: {
            answer: q.answerOptions.map((opt, idx) => ({
              $: { id: opt.id },
              answer_text: opt.optionText,
              answer_weight: opt.isCorrect ? 100 : 0,
              answer_feedback: opt.explanation || ''
            }))
          }
        }))
      }
    }
  };

  return builder.buildObject(canvasData);
}

// Moodle XML Export
export function generateMoodleExport(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  const moodleData = {
    quiz: {
      question: questions.map(q => ({
        $: { type: mapToMoodleQuestionType(q.questionType) },
        name: { text: `Question ${q.id}` },
        questiontext: {
          $: { format: 'html' },
          text: `<![CDATA[${q.questionText}]]>`
        },
        defaultgrade: q.points || 1,
        penalty: 0.1,
        hidden: 0,
        answer: q.answerOptions.map((opt, idx) => ({
          $: { fraction: opt.isCorrect ? '100' : '0', format: 'html' },
          text: `<![CDATA[${opt.optionText}]]>`,
          feedback: {
            $: { format: 'html' },
            text: `<![CDATA[${opt.explanation || ''}]]>`
          }
        })),
        ...(q.explanation && {
          generalfeedback: {
            $: { format: 'html' },
            text: `<![CDATA[${q.explanation}]]>`
          }
        })
      }))
    }
  };

  return builder.buildObject(moodleData);
}

// Blackboard Export (Tab-delimited format)
export function generateBlackboardExport(testbank: ExportTestbank, questions: ExportQuestion[]): string {
  const lines = ['TYPE\tQUESTION\tANSWER\tFEEDBACK\tDIFFICULTY'];
  
  questions.forEach(question => {
    const questionType = mapToBlackboardQuestionType(question.questionType);
    const questionText = question.questionText.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    
    if (question.questionType === 'multiple_choice' || question.questionType === 'multiple_select') {
      const answers = question.answerOptions.map(opt => 
        `${opt.isCorrect ? 'correct' : 'incorrect'}\t${opt.optionText.replace(/\t/g, ' ')}`
      ).join('\t');
      
      lines.push(`${questionType}\t${questionText}\t${answers}\t${question.explanation || ''}\t${question.difficultyLevel || 1}`);
    } else {
      const correctAnswer = question.answerOptions.find(opt => opt.isCorrect);
      lines.push(`${questionType}\t${questionText}\t${correctAnswer?.optionText || ''}\t${question.explanation || ''}\t${question.difficultyLevel || 1}`);
    }
  });
  
  return lines.join('\n');
}

// Helper functions for question type mapping
function mapToCanvasQuestionType(type: string): string {
  const mapping: { [key: string]: string } = {
    'multiple_choice': 'multiple_choice_question',
    'multiple_select': 'multiple_answers_question',
    'true_false': 'true_false_question',
    'short_answer': 'short_answer_question',
    'essay': 'essay_question',
    'fill_in_blank': 'fill_in_multiple_blanks_question',
    'matching': 'matching_question',
    'numerical': 'numerical_question'
  };
  return mapping[type] || 'multiple_choice_question';
}

function mapToMoodleQuestionType(type: string): string {
  const mapping: { [key: string]: string } = {
    'multiple_choice': 'multichoice',
    'multiple_select': 'multichoice',
    'true_false': 'truefalse',
    'short_answer': 'shortanswer',
    'essay': 'essay',
    'fill_in_blank': 'cloze',
    'matching': 'matching',
    'numerical': 'numerical'
  };
  return mapping[type] || 'multichoice';
}

function mapToBlackboardQuestionType(type: string): string {
  const mapping: { [key: string]: string } = {
    'multiple_choice': 'MC',
    'multiple_select': 'MA',
    'true_false': 'TF',
    'short_answer': 'SA',
    'essay': 'ESS',
    'fill_in_blank': 'FIB',
    'matching': 'MAT',
    'numerical': 'NUM'
  };
  return mapping[type] || 'MC';
}