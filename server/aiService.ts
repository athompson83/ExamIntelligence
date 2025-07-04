import OpenAI from "openai";
import { Question, AnswerOption, QuizAttempt, QuizResponse } from "@shared/schema";

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
      
      Using evidence-based assessment standards from CRESST, Kansas Curriculum Center, UC Riverside School of Medicine, and Assessment Systems research, analyze this question:

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

      **VALIDATION CRITERIA (Research-Based):**

      **Question Stem Quality:**
      - Clear, unambiguous language (one-reading comprehension)
      - Direct questions vs. incomplete statements
      - Absence of unnecessary negative phrasing (NOT, EXCEPT)
      - Elimination of cultural/gender/socioeconomic bias
      - Focus on learning objectives, not trivial facts
      - Appropriate vocabulary for target audience

      **Multiple Choice Standards:**
      - 3-5 plausible distractors representing common misconceptions
      - Mutually exclusive and grammatically parallel options
      - Correct answer is fully correct, distractors fully incorrect
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

export async function generateStudyGuide(topic: string, sourceType: string, sourceId: string): Promise<string> {
  try {
    const prompt = `
      Create a comprehensive study guide for the topic: "${topic}".
      
      The study guide should include:
      1. Key concepts and definitions
      2. Important facts and figures
      3. Common misconceptions
      4. Study strategies
      5. Practice questions
      6. Additional resources
      
      Make it engaging, well-structured, and appropriate for the education level.
      Format the response in markdown for better readability.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create comprehensive, engaging study guides that help students learn effectively.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content || "Study guide generation failed";
  } catch (error) {
    console.error("Error generating study guide:", error);
    return "Failed to generate study guide. Please try again later.";
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
  questionStyle: string;
  includeImages: boolean;
  includeMultimedia: boolean;
  customInstructions?: string;
  testbankId: string;
}

export async function generateQuestionsWithAI(params: AIQuestionGenerationParams): Promise<any[]> {
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
      questionStyle,
      includeImages,
      includeMultimedia,
      customInstructions
    } = params;

    // Prepare reference material context
    let referenceContext = "";
    if (includeReferences && referenceLinks.length > 0) {
      referenceContext = `
        Reference Materials:
        ${referenceLinks.map((link, index) => `${index + 1}. ${link}`).join('\n')}
        
        Please incorporate information from these references where appropriate and include citations.
      `;
    }

    // Build comprehensive prompt
    const prompt = `
      Generate ${questionCount} high-quality educational questions about: "${topic}"
      
      GENERATION PARAMETERS:
      - Question Types: ${questionTypes.join(', ')}
      - Difficulty Range: ${difficultyRange[0]}-${difficultyRange[1]} (on a 1-10 scale)
      - Bloom's Taxonomy Levels: ${bloomsLevels.join(', ')}
      - Question Style: ${questionStyle}
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
      
      Return a JSON array with this exact structure:
      {
        "questions": [
          {
            "questionText": "Complete question text",
            "questionType": "multiple_choice|multiple_response|true_false|fill_blank|essay|matching",
            "points": 1,
            "difficultyScore": 5,
            "bloomsLevel": "understand|apply|analyze|evaluate|create|remember",
            "tags": ["tag1", "tag2"],
            "correctFeedback": "Feedback for correct answer",
            "incorrectFeedback": "Feedback for incorrect answer",
            "generalFeedback": "General explanation",
            "partialCredit": false,
            "answerOptions": [
              {
                "answerText": "Option text",
                "isCorrect": true,
                "displayOrder": 0
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

    const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
    const questions = result.questions || [];

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
        const hasCorrectAnswer = validatedAnswerOptions.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
          validatedAnswerOptions[0].isCorrect = true; // Default first option as correct
        }
      }

      return {
        questionText: question.questionText || `Generated question ${index + 1} for ${topic}`,
        questionType: question.questionType || 'multiple_choice',
        points: Math.max(1, question.points || 1),
        difficultyScore: Math.max(1, Math.min(10, question.difficultyScore || 5)),
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
        aiConfidenceScore: Math.min(0.95, confidenceScore), // Cap at 95%
        answerOptions: validatedAnswerOptions
      };
    });

    return processedQuestions;

  } catch (error) {
    console.error("Error generating questions with AI:", error);
    
    // Return fallback questions if AI fails
    return [
      {
        questionText: `What is the main concept of ${params.topic}?`,
        questionType: 'multiple_choice',
        points: 1,
        difficultyScore: 5,
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
        aiConfidenceScore: 0.3,
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
