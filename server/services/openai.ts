import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface QuestionValidation {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  difficultyScore: number;
  confidenceScore: number;
}

export interface StudyGuideContent {
  title: string;
  sections: {
    title: string;
    content: string;
    keyPoints: string[];
  }[];
  practiceQuestions: {
    question: string;
    answer: string;
  }[];
}

export interface ImprovementPlan {
  weakAreas: string[];
  recommendations: {
    area: string;
    actions: string[];
    resources: string[];
  }[];
  studySchedule: {
    week: number;
    topics: string[];
    activities: string[];
  }[];
}

export async function validateQuestion(
  questionText: string,
  questionType: string,
  answerOptions?: any,
  correctAnswers?: any
): Promise<QuestionValidation> {
  try {
    const prompt = `
      Analyze the following exam question for quality, clarity, and educational value:

      Question Type: ${questionType}
      Question Text: ${questionText}
      ${answerOptions ? `Answer Options: ${JSON.stringify(answerOptions)}` : ''}
      ${correctAnswers ? `Correct Answers: ${JSON.stringify(correctAnswers)}` : ''}

      Please evaluate:
      1. Grammar and clarity
      2. Ambiguity or confusion
      3. Difficulty level (1-10 scale)
      4. Educational value
      5. Bias or fairness issues
      6. Question structure and format

      Respond with JSON in this format:
      {
        "isValid": boolean,
        "issues": ["list of specific issues found"],
        "suggestions": ["list of improvement suggestions"],
        "difficultyScore": number (1-10),
        "confidenceScore": number (0-1)
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessment analyst. Provide detailed, constructive feedback on exam questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      isValid: result.isValid,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      difficultyScore: Math.max(1, Math.min(10, result.difficultyScore || 5)),
      confidenceScore: Math.max(0, Math.min(1, result.confidenceScore || 0.5))
    };
  } catch (error) {
    console.error('OpenAI question validation error:', error);
    throw new Error('Failed to validate question: ' + error.message);
  }
}

export async function generateStudyGuide(
  topic: string,
  questions: any[],
  difficulty: string = 'intermediate'
): Promise<StudyGuideContent> {
  try {
    const prompt = `
      Create a comprehensive study guide for the topic: ${topic}
      
      Difficulty Level: ${difficulty}
      Based on ${questions.length} questions covering various aspects of this topic.
      
      Sample questions for context:
      ${questions.slice(0, 3).map(q => `- ${q.questionText}`).join('\n')}
      
      Create a study guide with:
      1. Clear learning objectives
      2. Key concepts and definitions
      3. Detailed explanations
      4. Practice questions with answers
      5. Study tips and strategies
      
      Respond with JSON in this format:
      {
        "title": "Study Guide Title",
        "sections": [
          {
            "title": "Section Title",
            "content": "Detailed content",
            "keyPoints": ["key point 1", "key point 2"]
          }
        ],
        "practiceQuestions": [
          {
            "question": "Practice question",
            "answer": "Detailed answer"
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create comprehensive, engaging study materials."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('OpenAI study guide generation error:', error);
    throw new Error('Failed to generate study guide: ' + error.message);
  }
}

export async function generateImprovementPlan(
  studentResponses: any[],
  quizData: any
): Promise<ImprovementPlan> {
  try {
    const correctAnswers = studentResponses.filter(r => r.isCorrect).length;
    const totalQuestions = studentResponses.length;
    const score = (correctAnswers / totalQuestions) * 100;

    const weakAreas = studentResponses
      .filter(r => !r.isCorrect)
      .map(r => r.question?.tags || [])
      .flat()
      .filter((tag, index, self) => self.indexOf(tag) === index);

    const prompt = `
      Create a personalized improvement plan for a student based on their exam performance:
      
      Quiz: ${quizData.title}
      Score: ${score.toFixed(1)}%
      Correct Answers: ${correctAnswers}/${totalQuestions}
      
      Areas needing improvement:
      ${weakAreas.join(', ')}
      
      Incorrect responses analysis:
      ${studentResponses
        .filter(r => !r.isCorrect)
        .map(r => `- ${r.question?.questionText}: Student answered incorrectly`)
        .join('\n')}
      
      Create a detailed improvement plan with:
      1. Identified weak areas
      2. Specific recommendations for each area
      3. Study schedule over 4 weeks
      4. Resources and activities
      
      Respond with JSON in this format:
      {
        "weakAreas": ["area1", "area2"],
        "recommendations": [
          {
            "area": "area name",
            "actions": ["action1", "action2"],
            "resources": ["resource1", "resource2"]
          }
        ],
        "studySchedule": [
          {
            "week": 1,
            "topics": ["topic1", "topic2"],
            "activities": ["activity1", "activity2"]
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational advisor. Create personalized, actionable improvement plans for students."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('OpenAI improvement plan generation error:', error);
    throw new Error('Failed to generate improvement plan: ' + error.message);
  }
}

export async function generateQuestions(
  topic: string,
  questionType: string,
  count: number,
  difficulty: string = 'intermediate'
): Promise<any[]> {
  try {
    const prompt = `
      Generate ${count} high-quality ${questionType} questions on the topic: ${topic}
      
      Difficulty Level: ${difficulty}
      Question Type: ${questionType}
      
      For each question, provide:
      1. Clear, well-written question text
      2. Appropriate answer options (if applicable)
      3. Correct answer(s)
      4. Explanation of the correct answer
      5. Relevant tags/categories
      
      Respond with JSON in this format:
      [
        {
          "questionText": "Question text here",
          "questionType": "${questionType}",
          "answerOptions": ["option1", "option2", "option3", "option4"],
          "correctAnswers": ["correct option"],
          "explanation": "Why this is correct",
          "tags": ["tag1", "tag2"],
          "difficultyScore": number (1-10)
        }
      ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert question writer for educational assessments. Create clear, fair, and educational questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions || [];
  } catch (error) {
    console.error('OpenAI question generation error:', error);
    throw new Error('Failed to generate questions: ' + error.message);
  }
}
