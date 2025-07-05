import OpenAI from "openai";
import { Question, AnswerOption, QuizAttempt, QuizResponse } from "@shared/schema";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface ValidationResult {
  issues: string[];
  suggestions: string[];
  confidenceScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  comments: string;
}

export async function validateQuestion(question: Question, answerOptions: AnswerOption[]): Promise<ValidationResult> {
  try {
    const prompt = `
      COMPREHENSIVE EDUCATIONAL QUESTION VALIDATION
      
      As a PhD-level educational assessment specialist, analyze this question using evidence-based standards from CRESST, Kansas Curriculum Center, UC Riverside School of Medicine, and Assessment Systems research:

      **QUESTION DETAILS:**
      Text: "${question.questionText}"
      Type: ${question.questionType}
      Difficulty Level: ${question.difficultyScore}/10
      Bloom's Taxonomy: ${question.bloomsLevel}
      Points: ${question.points}

      **ANSWER OPTIONS:**
      ${answerOptions.map((option, index) => 
        `${String.fromCharCode(65 + index)}. ${option.answerText} ${option.isCorrect ? '✓ CORRECT' : ''}`
      ).join('\n')}

      **COMPREHENSIVE VALIDATION CRITERIA:**

      **1. Question Stem Quality (Research-Based Standards):**
      - Clarity: One-reading comprehension without ambiguity
      - Language: Direct questions preferred over incomplete statements
      - Negatives: Avoid unnecessary NOT, EXCEPT constructions
      - Bias: Cultural, gender, socioeconomic neutrality
      - Relevance: Focus on learning objectives, not trivial details
      - Vocabulary: Age and education-level appropriate
      - Cognitive Load: Balanced complexity for target difficulty

      **2. Multiple Choice Excellence:**
      - Distractors: 3-5 plausible options representing common misconceptions
      - Parallelism: Grammatically consistent and similar length options
      - Exclusivity: Mutually exclusive choices, one clearly correct answer
      - Realism: Distractors based on actual student errors
      - Homogeneity: Options of similar complexity and abstraction level

      **3. Cognitive Alignment:**
      - Bloom's Level Accuracy: Does cognitive demand match stated level?
      - Difficulty Calibration: Is 1-10 rating appropriate for complexity?
      - Skill Assessment: Does question measure intended learning outcome?
      - Depth vs. Breadth: Appropriate focus for assessment goals

      **4. Psychometric Quality:**
      - Discrimination: Can question differentiate between ability levels?
      - Item Response Theory: Optimal difficulty for target population
      - Construct Validity: Measures what it claims to measure
      - Face Validity: Appears relevant to domain experts

      **5. Accessibility & Fairness:**
      - Universal Design: Accessible to diverse learning needs
      - Language Barriers: Clear for English language learners
      - Cultural Sensitivity: Avoids cultural assumptions
      - Format Clarity: Visual layout supports comprehension

      **6. Educational Value:**
      - Learning Promotion: Encourages deep understanding
      - Feedback Potential: Errors provide diagnostic information
      - Curriculum Alignment: Matches educational standards
      - Transfer Potential: Knowledge applicable beyond test context
      - Similar length and complexity across options
      - Avoidance of "all/none of the above"
      - Realistic, educationally meaningful distractors

      **Cognitive Assessment:**
      - Difficulty alignment with stated 1-10 scale
      - Proper Bloom's taxonomy cognitive level testing
      - Testing knowledge/skills, not test-taking ability
      - Appropriate cognitive load for target audience

      **Educational Value:**
      - Alignment with curriculum standards and learning objectives
      - Promotion of meaningful learning assessment
      - Support for formative/summative evaluation goals
      - Connection to real-world application when appropriate

      **Accessibility & Fairness:**
      - Inclusive language and diverse examples
      - Reading level appropriate for target audience
      - Visual/auditory accessibility considerations
      - Cultural neutrality and bias prevention

      Return JSON with detailed analysis:
      {
        "technicalIssues": ["specific construction problems"],
        "contentIssues": ["subject matter accuracy problems"],
        "biasIssues": ["accessibility and fairness concerns"],
        "cognitiveIssues": ["difficulty/Bloom's alignment problems"],
        "suggestions": ["specific, actionable improvements"],
        "confidenceScore": 0.95,
        "status": "approved|needs_review|rejected",
        "educationalValue": "assessment of learning effectiveness",
        "researchAlignment": "alignment with assessment best practices"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessment validator. Provide detailed, constructive feedback on educational questions and assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const validation = JSON.parse(response.choices[0].message.content || "{}");
    
    // Combine all issue categories from research-based analysis
    const allIssues = [
      ...(validation.technicalIssues || []),
      ...(validation.contentIssues || []),
      ...(validation.biasIssues || []),
      ...(validation.cognitiveIssues || []),
      ...(validation.issues || [])
    ];

    return {
      issues: allIssues,
      suggestions: validation.suggestions || [],
      confidenceScore: Math.max(0, Math.min(1, validation.confidenceScore || 0.5)),
      status: validation.status || 'needs_review',
      comments: [
        validation.educationalValue || '',
        validation.researchAlignment || '',
        validation.comments || 'Research-based validation completed'
      ].filter(Boolean).join(' | '),
    };
  } catch (error) {
    console.error("Error validating question:", error);
    return {
      issues: ["AI validation failed"],
      suggestions: ["Please review manually"],
      confidenceScore: 0,
      status: 'needs_review',
      comments: 'AI validation service unavailable',
    };
  }
}

export async function generateStudyGuide(title: string, studyType: string, quizId: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `Study aid content for ${title}\n\nThis is a ${studyType} to help you review and study.\n\nPlease review your quiz materials and create your own study notes.`;
  }

  try {
    // Get quiz and question information for context
    const quiz = await storage.getQuiz(quizId);
    const questions = quiz ? await storage.getQuestionsByQuiz(quizId) : [];
    
    const studyTypePrompts: Record<string, string> = {
      summary: "Create a comprehensive summary that highlights key concepts, main topics, and important facts",
      flashcards: "Generate flashcard-style content with questions on one side and answers on the other",
      practice_questions: "Create practice questions similar to the quiz with detailed explanations",
      concept_map: "Design a concept map showing relationships between key topics and concepts",
      study_guide: "Develop a structured study guide with organized sections and learning objectives"
    };

    const prompt = `
      Create a ${studyType} titled "${title}" based on the following quiz content:
      
      Quiz Title: ${quiz?.title || 'Quiz'}
      Number of Questions: ${questions.length}
      
      Sample Questions for Context:
      ${questions.slice(0, 5).map((q: Question, i: number) => `${i + 1}. ${q.questionText}`).join('\n')}
      
      Instructions: ${studyTypePrompts[studyType] || studyTypePrompts.study_guide}
      
      Requirements:
      - Make it comprehensive and educational
      - Include specific examples and explanations
      - Format in clear, readable markdown
      - Focus on understanding, not just memorization
      - Make it engaging and student-friendly
      
      Generate the ${studyType} content now:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create comprehensive, engaging study materials that help students learn effectively.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || `Study aid content for ${title}\n\nThis is a ${studyType} to help you review and study.`;
  } catch (error) {
    console.error("Error generating study guide:", error);
    return `Study aid content for ${title}\n\nThis is a ${studyType} to help you review and study.\n\nPlease review your quiz materials and create your own study notes.`;
  }
}

export async function generateLearningPrescription(
  attempt: QuizAttempt, 
  responses: QuizResponse[], 
  questions: Question[], 
  showCorrectAnswers: boolean = false
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "Learning prescription service is currently unavailable. Please contact your instructor for personalized feedback.";
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Group questions by concepts/topics
    const conceptAnalysis = responses.map(response => {
      const question = questions.find(q => q.id === response.questionId);
      return {
        question: question?.questionText || 'Question not found',
        isCorrect: response.isCorrect,
        selectedAnswer: response.response, // Use response field instead of selectedAnswer
        tags: question?.tags || [],
        bloomsLevel: question?.bloomsLevel || 'unknown',
        difficultyScore: question?.difficultyScore || 0,
        correctFeedback: question?.correctFeedback || '',
        generalFeedback: question?.generalFeedback || '',
        questionReasoning: question?.questionReasoning || '',
        correctAnswerReasoning: question?.correctAnswerReasoning || ''
      };
    });

    const prompt = `You are an expert educational specialist creating a personalized learning prescription for a student who just completed a quiz.

QUIZ PERFORMANCE ANALYSIS:
- Overall Score: ${score.toFixed(1)}% (${correctAnswers}/${totalQuestions} correct)
- Questions Missed: ${incorrectResponses.length}
- Show Correct Answers: ${showCorrectAnswers ? 'YES' : 'NO'}

DETAILED QUESTION ANALYSIS:
${conceptAnalysis.map((item, index) => `
Question ${index + 1}: ${item.question}
- Result: ${item.isCorrect ? 'CORRECT' : 'INCORRECT'}
- Student Answer: ${item.selectedAnswer}
- Bloom's Level: ${item.bloomsLevel}
- Difficulty: ${item.difficultyScore}/10
- Topics/Tags: ${item.tags.join(', ')}
${item.questionReasoning ? `- Educational Purpose: ${item.questionReasoning}` : ''}
${item.correctAnswerReasoning ? `- Key Concepts: ${item.correctAnswerReasoning}` : ''}
`).join('\n')}

PRESCRIPTION REQUIREMENTS:

${showCorrectAnswers ? `
**FULL PRESCRIPTION MODE** (Correct answers are shown to student):
1. Provide detailed explanations of incorrect answers
2. Connect concepts across questions to show learning patterns
3. Include specific study strategies and resources
4. Offer practice recommendations for weak areas
5. Explain the reasoning behind correct answers for reinforcement
` : `
**CONCEPT-FOCUSED MODE** (Correct answers are hidden):
1. Focus on underlying concepts and knowledge gaps without revealing specific answers
2. Provide detailed explanations of key concepts the student needs to master
3. Offer study strategies and resources for concept mastery
4. Guide toward understanding principles rather than memorizing answers
5. Include high-yield learning tips for the subject area
`}

LEARNING PRESCRIPTION STRUCTURE:
1. **Performance Summary**: Brief overview of strengths and areas for improvement
2. **Key Concepts to Master**: Detailed explanations of fundamental concepts that need work
3. **Study Strategy**: Specific, actionable study recommendations
4. **Practice Recommendations**: Types of questions/activities to focus on
5. **Resources**: Suggested materials or methods for concept mastery
6. **Next Steps**: Clear action plan for improvement

Generate a comprehensive, encouraging, and actionable learning prescription that helps the student understand not just what they got wrong, but why these concepts matter and how to master them. Focus on deep learning rather than superficial memorization.

Format the response in clear, student-friendly markdown with headers and bullet points for easy reading.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educational specialist and learning coach with deep expertise in personalized learning, cognitive science, and effective study strategies. Create actionable, encouraging learning prescriptions that promote deep understanding and long-term retention.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to generate learning prescription. Please review your quiz results with your instructor.";
  } catch (error) {
    console.error("Error generating learning prescription:", error);
    return "Learning prescription service encountered an error. Please contact your instructor for personalized feedback on your quiz performance.";
  }
}

export async function generateImprovementPlan(attempt: QuizAttempt, responses: QuizResponse[]): Promise<string> {
  try {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;

    const prompt = `
      Create a personalized improvement plan for a student based on their quiz performance.
      
      Quiz Performance:
      - Total Questions: ${totalQuestions}
      - Correct Answers: ${correctAnswers}
      - Score: ${score.toFixed(1)}%
      - Incorrect Responses: ${incorrectResponses.length}
      
      Areas that need improvement:
      ${incorrectResponses.map(r => `- Question ID: ${r.questionId}`).join('\n')}
      
      Create a structured improvement plan that includes:
      1. Performance analysis
      2. Specific areas for improvement
      3. Recommended study strategies
      4. Practice recommendations
      5. Timeline for improvement
      6. Resources for additional learning
      
      Make it encouraging and actionable. Format in markdown.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational consultant. Create personalized, encouraging improvement plans that help students succeed.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content || "Improvement plan generation failed";
  } catch (error) {
    console.error("Error generating improvement plan:", error);
    return "Failed to generate improvement plan. Please try again later.";
  }
}

export async function generateQuestionSuggestions(topic: string, questionType: string, difficultyLevel: string): Promise<string[]> {
  try {
    const prompt = `
      Generate 5 high-quality educational questions about "${topic}".
      
      Requirements:
      - Question Type: ${questionType}
      - Difficulty Level: ${difficultyLevel}
      - Include answer options for multiple choice questions
      - Ensure questions are educationally sound
      - Avoid ambiguous wording
      - Make questions relevant and engaging
      
      Return a JSON array of question objects with the following structure:
      [
        {
          "questionText": "Question text here",
          "answerOptions": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": "Option 1",
          "explanation": "Why this is the correct answer"
        }
      ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational question writer. Create high-quality, pedagogically sound questions for assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const suggestions = JSON.parse(response.choices[0].message.content || "[]");
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error("Error generating question suggestions:", error);
    return [];
  }
}

interface AIQuestionGenerationParams {
  topic: string;
  questionCount: number;
  questionTypes: string[];
  difficultyRange: [number, number];
  bloomsLevels: string[];
  includeReferences: boolean;
  referenceLinks: string[];
  targetAudience?: string;
  learningObjectives: string[];
  questionStyles: string[];
  includeImages: boolean;
  includeMultimedia: boolean;
  customInstructions?: string;
  testbankId: string;
}

// Enhanced AI functions for contextual question generation
export async function generateSimilarQuestionWithContext(
  originalQuestion: any,
  answerOptions: any[],
  testbankQuestions: any[],
  originalPrompt?: string
): Promise<any> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build context about existing questions
    const existingQuestionsContext = testbankQuestions
      .filter(q => q.id !== originalQuestion.id)
      .slice(0, 5) // Limit to 5 questions for context
      .map(q => `- ${q.questionText} (Type: ${q.questionType}, Difficulty: ${q.difficultyScore})`)
      .join('\n');

    const answerOptionsText = answerOptions
      .map(opt => `${opt.isCorrect ? '[CORRECT]' : '[INCORRECT]'} ${opt.answerText}`)
      .join('\n');

    const prompt = `You are an expert educational assessment specialist. Create a NEW question that shares the same STYLE and APPROACH as the original question but covers different specific content within the same topic area.

ORIGINAL QUESTION ANALYSIS:
Question: ${originalQuestion.questionText}
Type: ${originalQuestion.questionType}
Difficulty: ${originalQuestion.difficultyScore}/10
Bloom's Level: ${originalQuestion.bloomsLevel}
Answer Options:
${answerOptionsText}

CONTEXT - OTHER QUESTIONS IN THIS TESTBANK:
${existingQuestionsContext || 'No other questions in testbank yet.'}

${originalPrompt ? `ORIGINAL GENERATION INSTRUCTIONS: ${originalPrompt}` : ''}

REQUIREMENTS FOR SIMILAR STYLE QUESTION:
1. Use the same question FORMAT and STRUCTURE as the original
2. Target the same DIFFICULTY level (${originalQuestion.difficultyScore}/10) and Bloom's taxonomy level
3. Test related but DIFFERENT content within the same subject area
4. Use similar language patterns and question phrasing style
5. Maintain the same number of answer options with similar complexity
6. Create a question that feels like it belongs in the same assessment but isn't a duplicate
7. If the original uses scenarios, create a different scenario in the same context
8. If the original tests calculations, create a different calculation problem

Please respond with a JSON object containing the new question data in this format:
{
  "questionText": "Your new question here",
  "questionType": "${originalQuestion.questionType}",
  "points": "1",
  "difficultyScore": "${originalQuestion.difficultyScore}",
  "bloomsLevel": "${originalQuestion.bloomsLevel}",
  "tags": ["relevant", "tags"],
  "correctFeedback": "Feedback for correct answer",
  "incorrectFeedback": "Feedback for incorrect answer", 
  "generalFeedback": "General feedback about the question",
  "partialCredit": false,
  "imageUrl": "",
  "audioUrl": "",
  "videoUrl": "",
  "aiValidationStatus": "pending",
  "aiConfidenceScore": "0.85",
  "answerOptions": [
    {"answerText": "Option 1", "isCorrect": true, "displayOrder": 0},
    {"answerText": "Option 2", "isCorrect": false, "displayOrder": 1}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert educational assessment specialist with PhD-level expertise in psychometrics and item response theory." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;

  } catch (error) {
    console.error("Error generating similar question:", error);
    throw error;
  }
}

export async function generateQuestionVariationWithContext(
  originalQuestion: any,
  answerOptions: any[],
  testbankQuestions: any[],
  originalPrompt?: string
): Promise<any> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build context about existing questions
    const existingQuestionsContext = testbankQuestions
      .filter(q => q.id !== originalQuestion.id)
      .slice(0, 5) // Limit to 5 questions for context
      .map(q => `- ${q.questionText} (Type: ${q.questionType}, Difficulty: ${q.difficultyScore})`)
      .join('\n');

    const answerOptionsText = answerOptions
      .map(opt => `${opt.isCorrect ? '[CORRECT]' : '[INCORRECT]'} ${opt.answerText}`)
      .join('\n');

    const prompt = `You are an expert educational assessment specialist. I need you to create a REFRESHED VERSION of this question - improve its quality while maintaining the core learning objective.

CURRENT QUESTION DETAILS:
Question: ${originalQuestion.questionText}
Type: ${originalQuestion.questionType}
Difficulty: ${originalQuestion.difficultyScore}/10
Bloom's Level: ${originalQuestion.bloomsLevel}
Current Answer Options:
${answerOptionsText}

CONTEXT - OTHER QUESTIONS IN THIS TESTBANK:
${existingQuestionsContext || 'No other questions in testbank yet.'}

${originalPrompt ? `ORIGINAL GENERATION INSTRUCTIONS: ${originalPrompt}` : ''}

REQUIREMENTS:
1. Improve the question's clarity, precision, and educational value
2. Enhance answer options with more plausible distractors
3. Maintain the same learning objective and difficulty level
4. Ensure the improved question is distinct from other questions in the testbank
5. Follow evidence-based assessment practices
6. Fix any potential bias or accessibility issues

Please respond with a JSON object containing the improved question data in this format:
{
  "questionText": "Your improved question here",
  "questionType": "${originalQuestion.questionType}",
  "points": "1",
  "difficultyScore": "${originalQuestion.difficultyScore}",
  "bloomsLevel": "${originalQuestion.bloomsLevel}",
  "tags": ["relevant", "tags"],
  "correctFeedback": "Enhanced feedback for correct answer",
  "incorrectFeedback": "Enhanced feedback for incorrect answer", 
  "generalFeedback": "Enhanced general feedback about the question",
  "partialCredit": false,
  "imageUrl": "",
  "audioUrl": "",
  "videoUrl": "",
  "aiValidationStatus": "pending",
  "aiConfidenceScore": "0.85",
  "answerOptions": [
    {"answerText": "Improved option 1", "isCorrect": true, "displayOrder": 0},
    {"answerText": "Improved option 2", "isCorrect": false, "displayOrder": 1}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert educational assessment specialist with PhD-level expertise in psychometrics and item response theory." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;

  } catch (error) {
    console.error("Error generating question variation:", error);
    throw error;
  }
}

export async function generateNewAnswerOptionsWithContext(
  originalQuestion: any,
  currentAnswerOptions: any[],
  testbankQuestions: any[]
): Promise<any[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build context about existing questions
    const existingQuestionsContext = testbankQuestions
      .filter(q => q.id !== originalQuestion.id)
      .slice(0, 3) // Limit to 3 questions for context
      .map(q => `- ${q.questionText}`)
      .join('\n');

    const currentOptionsText = currentAnswerOptions
      .map(opt => `${opt.isCorrect ? '[CORRECT]' : '[INCORRECT]'} ${opt.answerText}`)
      .join('\n');

    const prompt = `You are an expert educational assessment specialist. I need you to create NEW answer options for this question that are more effective than the current ones.

QUESTION: ${originalQuestion.questionText}
Question Type: ${originalQuestion.questionType}
Difficulty: ${originalQuestion.difficultyScore}/10
Bloom's Level: ${originalQuestion.bloomsLevel}

CURRENT ANSWER OPTIONS:
${currentOptionsText}

CONTEXT - OTHER QUESTIONS IN TESTBANK:
${existingQuestionsContext || 'No other questions in testbank yet.'}

REQUIREMENTS:
1. Create new answer options that are more plausible and pedagogically effective
2. Ensure distractors are credible but clearly incorrect
3. Avoid answer options similar to those used in other testbank questions
4. Follow best practices for option writing (parallel structure, appropriate length)
5. For multiple choice: exactly 4 options (1 correct, 3 incorrect)
6. For true/false: exactly 2 options
7. Make sure options test the intended learning objective

Please respond with a JSON array of answer options in this format:
[
  {"answerText": "Correct answer", "isCorrect": true, "displayOrder": 0},
  {"answerText": "Plausible distractor 1", "isCorrect": false, "displayOrder": 1},
  {"answerText": "Plausible distractor 2", "isCorrect": false, "displayOrder": 2},
  {"answerText": "Plausible distractor 3", "isCorrect": false, "displayOrder": 3}
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert educational assessment specialist with PhD-level expertise in psychometrics and item response theory." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.answerOptions || result;

  } catch (error) {
    console.error("Error generating new answer options:", error);
    throw error;
  }
}

export async function generateQuestionsWithAI(params: AIQuestionGenerationParams, progressCallback?: (progress: { status: string; current: number; total: number }) => void): Promise<any[]> {
  try {
    const {
      topic,
      questionCount,
      questionTypes,
      difficultyRange,
      bloomsLevels,
      includeReferences,
      referenceLinks,
      targetAudience,
      learningObjectives,
      questionStyles,
      includeImages,
      includeMultimedia,
      customInstructions
    } = params;

    // Send initial progress
    progressCallback?.({ status: 'Preparing AI request...', current: 0, total: questionCount });

    // Prepare reference material context
    let referenceContext = "";
    if (includeReferences && referenceLinks.length > 0) {
      progressCallback?.({ status: 'Processing reference materials...', current: 1, total: questionCount });
      referenceContext = `
        Reference Materials:
        ${referenceLinks.map((link, index) => `${index + 1}. ${link}`).join('\n')}
        
        Please incorporate information from these references where appropriate and include citations.
      `;
    }

    // Build comprehensive prompt with multiple reinforcements
    const prompt = `
      **MANDATORY REQUIREMENT**: You MUST generate exactly ${questionCount} complete questions. 
      **COUNT REQUIREMENT**: ${questionCount} questions - not more, not less.
      **TOPIC**: "${topic}"
      
      IMPORTANT: Your response must contain exactly ${questionCount} questions in the JSON array. If you generate fewer than ${questionCount} questions, the system will fail.
      
      GENERATION PARAMETERS:
      - Question Types: ${questionTypes.join(', ')}
      - Difficulty Range: ${difficultyRange[0]}-${difficultyRange[1]} (on a 1-10 scale)
      - Bloom's Taxonomy Levels: ${bloomsLevels.join(', ')}
      - Question Styles: ${questionStyles.join(', ')}
      - Target Audience: ${targetAudience || 'General students'}
      
      ${learningObjectives.length > 0 ? `
      LEARNING OBJECTIVES TO ADDRESS:
      ${learningObjectives.map((obj, index) => `${index + 1}. ${obj}`).join('\n')}
      ` : ''}
      
      ${referenceContext}
      
      ${customInstructions ? `
      CUSTOM INSTRUCTIONS:
      ${customInstructions}
      ` : ''}
      
      EVIDENCE-BASED QUALITY STANDARDS (Research Guidelines):
      
      **Question Stem Requirements:**
      1. Write clear, unambiguous stems that can be understood in one reading
      2. Use direct questions rather than incomplete statements
      3. Avoid negative phrasing (NOT, EXCEPT) unless absolutely necessary
      4. Include context/scenario for higher-order thinking when appropriate
      5. Eliminate unnecessary verbiage and bias
      6. Focus on learning objectives, not trivial facts
      7. Test knowledge, not test-taking skills
      
      **Multiple Choice Standards:**
      - Use 4-5 plausible distractors that represent common misconceptions
      - Ensure all options are mutually exclusive and grammatically parallel
      - Make the correct answer fully correct, distractors fully incorrect
      - Avoid "all of the above" and "none of the above"
      - Make options similar in length and complexity
      - Use distractors that test understanding, not just guessing
      
      **Difficulty Calibration:**
      - Level 1-3 (Easy): Knowledge/Comprehension - recall facts, definitions
      - Level 4-6 (Medium): Application/Analysis - solve problems, analyze relationships
      - Level 7-10 (Hard): Synthesis/Evaluation - create solutions, make judgments
      
      **Bloom's Taxonomy Alignment:**
      - Remember: Recall specific information (Who, What, When, Where)
      - Understand: Explain concepts in own words (Describe, Explain, Summarize)
      - Apply: Use knowledge in new situations (Calculate, Solve, Demonstrate)
      - Analyze: Break down into components (Compare, Contrast, Categorize)
      - Evaluate: Make judgments based on criteria (Assess, Critique, Justify)
      - Create: Combine elements into new patterns (Design, Construct, Formulate)
      
      **Question Style Guidelines:**
      ${questionStyles.includes('formal') ? '- FORMAL ACADEMIC: Use precise, scholarly language with complete sentences and professional terminology' : ''}
      ${questionStyles.includes('conversational') ? '- CONVERSATIONAL: Use friendly, engaging language that feels like a discussion' : ''}
      ${questionStyles.includes('scenario') ? '- SCENARIO-BASED: Create realistic situations requiring application of knowledge' : ''}
      ${questionStyles.includes('problem_solving') ? '- PROBLEM SOLVING: Present challenges requiring analytical thinking and step-by-step solutions' : ''}
      ${questionStyles.includes('case_study') ? '- CASE STUDY: Provide complex, real-world situations for analysis' : ''}
      
      **Question Type Best Practices:**
      - Multiple Choice: Test comprehension and application, not just memorization
        * Use realistic scenarios and application-based questions
        * Create distractors based on common student errors
        * Ensure one clearly correct answer
      - True/False: Use only for absolute concepts, avoid complex nuances
        * Focus on fundamental principles and facts
        * Avoid ambiguous or trick statements
      - Essay: Test synthesis, analysis, and original thinking with clear rubrics
        * Provide specific scoring criteria and expectations
        * Use authentic, real-world scenarios
        * Include word count guidelines
      - Fill-in-blank: Use for key terms and specific facts, one correct answer
        * Test essential vocabulary and concepts
        * Provide sufficient context for understanding
      - Matching: Group related concepts with clear categories (5-10 items max)
        * Ensure all items belong to the same conceptual domain
        * Include more options than matches to prevent elimination
      - Multiple Response: Test comprehensive understanding of related concepts
        * Use when multiple correct answers enhance learning
        * Clearly indicate how many options to select
      - Hotspot: Test spatial understanding and visual comprehension
        * Use diagrams, maps, or images for location-based knowledge
        * Provide clear instructions for selection
      
      **Bias Prevention:**
      - Use inclusive language and diverse examples
      - Avoid cultural, gender, or socioeconomic bias
      - Test knowledge content, not reading comprehension
      - Ensure accessibility for different learning styles
      - Use familiar contexts when possible
      
      8. ${includeImages ? 'Suggest relevant images or diagrams that enhance understanding' : ''}
      9. ${includeMultimedia ? 'Include multimedia suggestions that support learning objectives' : ''}
      
      CRITICAL: Return exactly ${questionCount} questions. Your response must contain all ${questionCount} questions in this exact JSON structure:
      {
        "questions": [
          {
            "questionText": "Complete question text",
            "questionType": "multiple_choice|multiple_response|true_false|fill_blank|essay|matching",
            "points": 1,
            "difficultyScore": 5,
            "bloomsLevel": "understand|apply|analyze|evaluate|create|remember",
            "tags": ["tag1", "tag2"],
            "questionReasoning": "Detailed explanation of why this question is educationally valuable and what learning objectives it assesses",
            "correctAnswerReasoning": "High-yield explanation of the correct answer and underlying concepts students need to understand",
            "correctFeedback": "Positive reinforcement feedback shown when student answers correctly, explaining why their choice demonstrates understanding",
            "incorrectFeedback": "Constructive feedback shown when student answers incorrectly, guiding them toward correct understanding without giving away the answer",
            "generalFeedback": "Learning-focused explanation of key concepts this question tests, useful for study and review",
            "partialCredit": false,
            "answerOptions": [
              {
                "answerText": "Option text",
                "isCorrect": true,
                "displayOrder": 0,
                "reasoning": "Detailed explanation of why this answer is correct and what key concepts it demonstrates that students should understand"
              },
              {
                "answerText": "Distractor option",
                "isCorrect": false,
                "displayOrder": 1,
                "reasoning": "Explanation of why this answer is incorrect and what common misconception or error it represents"
              }
            ],
            "imageUrl": "",
            "audioUrl": "",
            "videoUrl": "",
            "references": ["citation1", "citation2"]
          }
        ]
      }
      
      QUALITY STANDARDS:
      - Each question must be clear, unambiguous, and educationally valuable
      - Answer options should be plausible and well-crafted
      - Feedback should be instructive and help learning
      - Questions should vary in approach and cognitive demands
      - Ensure proper grammar, spelling, and formatting
      - Include diverse question formats as specified
    `;

    // Send progress update before AI call
    progressCallback?.({ status: 'Sending request to AI...', current: 2, total: questionCount });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 16000, // Increase token limit for larger question sets
      messages: [
        {
          role: "system",
          content: `You are a PhD-level educational assessment specialist with expertise in:
          
          - Psychometric principles and item response theory
          - Bloom's taxonomy and cognitive complexity theory
          - Educational measurement standards (AERA, APA, NCME)
          - Question writing research from CRESST, ETS, and NCATE
          - Bias prevention and accessibility in assessments
          - Canvas LMS assessment best practices
          
          RESEARCH FOUNDATIONS:
          - Follow CRESST criteria: cognitive complexity, content quality, meaningfulness, language appropriateness, transfer/generalizability, fairness, and reliability
          - Apply Kansas Curriculum Center guidelines for effective test construction
          - Implement UC Riverside School of Medicine best practices for question writing
          - Use Assessment Systems' evidence-based item authoring standards
          
          COGNITIVE LOAD THEORY:
          - Structure questions to match working memory limitations
          - Provide clear, unambiguous language
          - Reduce extraneous cognitive load
          - Focus on essential information processing
          
          CANVAS LMS COMPATIBILITY:
          - Generate questions that work seamlessly with Canvas quiz tools
          - Follow Canvas-specific formatting and functionality standards
          - Ensure compatibility with Canvas gradebook and analytics
          - Support Canvas question types and multimedia integration
          - Support intrinsic cognitive load appropriate to difficulty level
          
          EDUCATIONAL MEASUREMENT PRINCIPLES:
          - Ensure content validity through curriculum alignment
          - Maintain construct validity by testing intended knowledge/skills
          - Apply reliability standards through consistent question quality
          - Prevent measurement bias across diverse student populations
          
          Generate questions that promote meaningful learning outcomes and accurate assessment of student knowledge. Always return valid JSON with the exact structure requested.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Send progress update after AI response
    progressCallback?.({ status: 'Processing AI response...', current: Math.floor(questionCount * 0.3), total: questionCount });

    const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
    const questions = result.questions || [];

    // Check if we got the expected number of questions
    if (questions.length < questionCount) {
      console.warn(`Warning: AI generated ${questions.length} questions instead of requested ${questionCount}`);
      console.log("Actual response:", response.choices[0].message.content?.substring(0, 1000));
      
      // Try to generate additional questions to reach the target
      const missingCount = questionCount - questions.length;
      console.log(`Attempting to generate ${missingCount} additional questions...`);
      
      try {
        // Send progress update during additional generation
        progressCallback?.({ status: `Generating ${missingCount} additional questions...`, current: questions.length, total: questionCount });

        const additionalPrompt = `
          **MANDATORY**: Generate exactly ${missingCount} MORE questions about "${topic}".
          
          You previously generated ${questions.length} questions. Now generate ${missingCount} additional questions to reach the total of ${questionCount}.
          
          Use the same requirements:
          - Question Types: ${questionTypes.join(', ')}
          - Difficulty Range: ${difficultyRange[0]} to ${difficultyRange[1]}
          - Bloom's Levels: ${bloomsLevels.join(', ')}
          - Target Audience: ${targetAudience}
          
          Return JSON with exactly ${missingCount} questions in the same format.
        `;
        
        const additionalResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are an expert educational assessment specialist with PhD-level expertise in psychometrics and item response theory." },
            { role: "user", content: additionalPrompt }
          ],
          max_tokens: 8000,
          temperature: 0.7,
          response_format: { type: "json_object" }
        });
        
        const additionalResult = JSON.parse(additionalResponse.choices[0].message.content || '{"questions": []}');
        const additionalQuestions = additionalResult.questions || [];
        
        if (additionalQuestions.length > 0) {
          questions.push(...additionalQuestions);
          console.log(`Successfully generated ${additionalQuestions.length} additional questions. Total: ${questions.length}`);
          // Update progress after additional questions
          progressCallback?.({ status: 'Additional questions generated', current: questions.length, total: questionCount });
        }
      } catch (error) {
        console.error('Failed to generate additional questions:', error);
      }
    }

    // Ensure exact question count by trimming if we have too many
    if (questions.length > questionCount) {
      console.log(`Trimming ${questions.length - questionCount} excess questions to match requested count of ${questionCount}`);
      questions.splice(questionCount);
    }

    // Send progress update for validation phase
    progressCallback?.({ status: 'Validating and processing questions...', current: Math.floor(questions.length * 0.7), total: questionCount });

    // Validate and process each question with enhanced quality checks
    const processedQuestions = questions.map((question: any, index: number) => {
      // Quality validation scoring
      let confidenceScore = 0.7; // Base score
      
      // Boost confidence for well-formed questions
      if (question.questionText && question.questionText.length > 20) confidenceScore += 0.1;
      if (question.correctFeedback && question.incorrectFeedback) confidenceScore += 0.1;
      if (Array.isArray(question.answerOptions) && question.answerOptions.length >= 3) confidenceScore += 0.1;
      
      // Validate question type specific requirements
      const validatedAnswerOptions = Array.isArray(question.answerOptions) ? 
        question.answerOptions.map((option: any, optIndex: number) => ({
          answerText: option.answerText || `Option ${optIndex + 1}`,
          isCorrect: Boolean(option.isCorrect),
          displayOrder: optIndex,
        })) : [];

      // Ensure at least one correct answer for multiple choice
      if (question.questionType === 'multiple_choice' && validatedAnswerOptions.length > 0) {
        const hasCorrectAnswer = validatedAnswerOptions.some((opt: any) => opt.isCorrect);
        if (!hasCorrectAnswer) {
          validatedAnswerOptions[0].isCorrect = true; // Default first option as correct
        }
      }

      return {
        questionText: question.questionText || `Generated question ${index + 1} for ${topic}`,
        questionType: question.questionType || 'multiple_choice',
        points: Math.max(1, question.points || 1).toString(),
        difficultyScore: Math.max(1, Math.min(10, question.difficultyScore || 5)).toString(),
        bloomsLevel: question.bloomsLevel || 'understand',
        tags: Array.isArray(question.tags) ? question.tags : [topic, 'ai-generated'],
        correctFeedback: question.correctFeedback || 'Excellent! You demonstrate strong understanding of this concept.',
        incorrectFeedback: question.incorrectFeedback || 'Not quite right. Consider reviewing the key concepts and try again.',
        generalFeedback: question.generalFeedback || `This question tests your understanding of ${topic}.`,
        partialCredit: Boolean(question.partialCredit),
        imageUrl: question.imageUrl || '',
        audioUrl: question.audioUrl || '',
        videoUrl: question.videoUrl || '',
        aiValidationStatus: confidenceScore > 0.8 ? 'approved' : 'needs_review',
        aiConfidenceScore: Math.min(0.95, confidenceScore).toString(), // Cap at 95%
        answerOptions: validatedAnswerOptions
      };
    });

    // Send final progress update
    progressCallback?.({ status: 'Questions generation completed!', current: processedQuestions.length, total: questionCount });

    return processedQuestions;

  } catch (error) {
    console.error("Error generating questions with AI:", error);
    
    // Return fallback questions if AI fails
    return [
      {
        questionText: `What is the main concept of ${params.topic}?`,
        questionType: 'multiple_choice',
        points: "1",
        difficultyScore: "5",
        bloomsLevel: 'understand',
        tags: [params.topic],
        correctFeedback: 'Correct! You understand the basic concept.',
        incorrectFeedback: 'Incorrect. Please review the material on this topic.',
        generalFeedback: 'This question tests basic understanding.',
        partialCredit: false,
        imageUrl: '',
        audioUrl: '',
        videoUrl: '',
        aiValidationStatus: 'needs_review',
        aiConfidenceScore: "0.3",
        answerOptions: [
          { answerText: 'Option A', isCorrect: true, displayOrder: 0 },
          { answerText: 'Option B', isCorrect: false, displayOrder: 1 },
          { answerText: 'Option C', isCorrect: false, displayOrder: 2 },
          { answerText: 'Option D', isCorrect: false, displayOrder: 3 }
        ]
      }
    ];
  }
}


