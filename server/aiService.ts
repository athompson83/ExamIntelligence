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
      Analyze the following educational question for quality, clarity, and educational value. 
      Return a JSON response with the following structure:
      {
        "issues": ["array of specific issues found"],
        "suggestions": ["array of improvement suggestions"],
        "confidenceScore": 0.95,
        "status": "approved|rejected|needs_review",
        "comments": "detailed feedback about the question"
      }

      Question Text: ${question.questionText}
      Question Type: ${question.questionType}
      Difficulty Level: ${question.difficultyScore}
      Bloom's Taxonomy Level: ${question.bloomsLevel}
      
      Answer Options:
      ${answerOptions.map((option, index) => `${index + 1}. ${option.answerText} (${option.isCorrect ? 'Correct' : 'Incorrect'})`).join('\n')}
      
      Please check for:
      - Grammar and spelling errors
      - Clarity and ambiguity
      - Educational appropriateness
      - Answer option quality
      - Correct answer accuracy
      - Difficulty level appropriateness
      - Bloom's taxonomy alignment
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
    
    return {
      issues: validation.issues || [],
      suggestions: validation.suggestions || [],
      confidenceScore: Math.max(0, Math.min(1, validation.confidenceScore || 0.5)),
      status: validation.status || 'needs_review',
      comments: validation.comments || 'AI validation completed',
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
