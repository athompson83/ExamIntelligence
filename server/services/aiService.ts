import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QuestionValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  difficultyScore: number;
  confidenceScore: number;
}

export interface StudyGuideContent {
  title: string;
  content: string;
  keyPoints: string[];
  practiceQuestions: string[];
}

export interface ImprovementPlanContent {
  weakAreas: string[];
  recommendations: string[];
  studyPlan: string[];
  resources: string[];
}

export class AIService {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  private readonly model = "gpt-4o";

  async validateQuestion(
    questionText: string,
    questionType: string,
    answerOptions?: any[]
  ): Promise<QuestionValidationResult> {
    try {
      const prompt = `
        Analyze the following educational question for quality, clarity, and educational value:

        Question Type: ${questionType}
        Question: ${questionText}
        ${answerOptions ? `Answer Options: ${JSON.stringify(answerOptions)}` : ''}

        Please evaluate:
        1. Grammatical correctness
        2. Clarity and ambiguity
        3. Educational appropriateness
        4. Difficulty level (1-10 scale)
        5. Answer quality (if applicable)

        Provide a JSON response with the following structure:
        {
          "isValid": boolean,
          "issues": ["list of specific issues found"],
          "suggestions": ["list of improvement suggestions"],
          "difficultyScore": number (1-10),
          "confidenceScore": number (0-1)
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert educational content validator. Analyze questions for quality and provide detailed feedback.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        isValid: result.isValid || false,
        issues: result.issues || [],
        suggestions: result.suggestions || [],
        difficultyScore: Math.max(1, Math.min(10, result.difficultyScore || 5)),
        confidenceScore: Math.max(0, Math.min(1, result.confidenceScore || 0.5)),
      };
    } catch (error) {
      console.error("AI validation error:", error);
      throw new Error("Failed to validate question with AI");
    }
  }

  async generateStudyGuide(
    topic: string,
    questions: any[],
    learningObjectives: string[] = []
  ): Promise<StudyGuideContent> {
    try {
      const prompt = `
        Create a comprehensive study guide for the following topic:

        Topic: ${topic}
        Learning Objectives: ${learningObjectives.join(", ")}
        Sample Questions: ${JSON.stringify(questions.slice(0, 5))}

        Generate a study guide that includes:
        1. Clear explanations of key concepts
        2. Important points to remember
        3. Practice questions
        4. Study tips

        Provide a JSON response with the following structure:
        {
          "title": "Study Guide Title",
          "content": "Detailed study guide content in markdown format",
          "keyPoints": ["list of key points"],
          "practiceQuestions": ["list of practice questions"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator. Generate comprehensive study guides that help students learn effectively.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        title: result.title || `Study Guide: ${topic}`,
        content: result.content || "",
        keyPoints: result.keyPoints || [],
        practiceQuestions: result.practiceQuestions || [],
      };
    } catch (error) {
      console.error("Study guide generation error:", error);
      throw new Error("Failed to generate study guide");
    }
  }

  async generateImprovementPlan(
    quizResults: any,
    incorrectAnswers: any[],
    studentPerformance: any
  ): Promise<ImprovementPlanContent> {
    try {
      const prompt = `
        Based on the following quiz performance data, create a personalized improvement plan:

        Quiz Score: ${quizResults.score}/${quizResults.totalPoints}
        Time Spent: ${quizResults.timeSpent} seconds
        Incorrect Answers: ${JSON.stringify(incorrectAnswers)}
        Overall Performance: ${JSON.stringify(studentPerformance)}

        Create an improvement plan that includes:
        1. Identification of weak areas
        2. Specific recommendations for improvement
        3. A structured study plan
        4. Additional resources

        Provide a JSON response with the following structure:
        {
          "weakAreas": ["list of topics that need improvement"],
          "recommendations": ["specific actionable recommendations"],
          "studyPlan": ["step-by-step study plan"],
          "resources": ["list of recommended resources"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert educational advisor. Create personalized improvement plans based on student performance data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        weakAreas: result.weakAreas || [],
        recommendations: result.recommendations || [],
        studyPlan: result.studyPlan || [],
        resources: result.resources || [],
      };
    } catch (error) {
      console.error("Improvement plan generation error:", error);
      throw new Error("Failed to generate improvement plan");
    }
  }

  async generateQuestions(
    topic: string,
    questionType: string,
    difficulty: number,
    count: number = 5
  ): Promise<any[]> {
    try {
      const prompt = `
        Generate ${count} high-quality educational questions about "${topic}".

        Requirements:
        - Question Type: ${questionType}
        - Difficulty Level: ${difficulty}/10
        - Include answer options for multiple choice questions
        - Ensure questions are educationally sound and appropriate

        Provide a JSON response with the following structure:
        {
          "questions": [
            {
              "questionText": "The question text",
              "questionType": "${questionType}",
              "answerOptions": [
                {"answerText": "Option A", "isCorrect": false},
                {"answerText": "Option B", "isCorrect": true},
                {"answerText": "Option C", "isCorrect": false},
                {"answerText": "Option D", "isCorrect": false}
              ],
              "explanation": "Why this answer is correct",
              "tags": ["relevant", "tags"],
              "difficultyScore": ${difficulty}
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert educational question generator. Create high-quality, pedagogically sound questions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.questions || [];
    } catch (error) {
      console.error("Question generation error:", error);
      throw new Error("Failed to generate questions");
    }
  }

  async analyzeProctoringAlert(
    alertDescription: string,
    studentBehavior: any,
    context: any
  ): Promise<{ severity: string; recommendation: string; autoFlag: boolean }> {
    try {
      const prompt = `
        Analyze the following proctoring alert and provide recommendations:

        Alert: ${alertDescription}
        Student Behavior: ${JSON.stringify(studentBehavior)}
        Context: ${JSON.stringify(context)}

        Evaluate the severity and provide recommendations for action.

        Provide a JSON response with the following structure:
        {
          "severity": "low|medium|high",
          "recommendation": "detailed recommendation for action",
          "autoFlag": boolean (whether to automatically flag for review)
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert in academic integrity and proctoring. Analyze alerts and provide balanced recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        severity: result.severity || "medium",
        recommendation: result.recommendation || "Review recommended",
        autoFlag: result.autoFlag || false,
      };
    } catch (error) {
      console.error("Proctoring analysis error:", error);
      throw new Error("Failed to analyze proctoring alert");
    }
  }
}

export const aiService = new AIService();
