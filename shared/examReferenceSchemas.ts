import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { examReferences } from "./schema";

// Exam References Schemas
export const insertExamReferenceSchema = createInsertSchema(examReferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExamReference = z.infer<typeof insertExamReferenceSchema>;
export type ExamReference = typeof examReferences.$inferSelect;

// Extended schemas for forms
export const examReferenceFormSchema = insertExamReferenceSchema.extend({
  topics: z.array(z.string()).optional(),
  examStructure: z.object({
    totalQuestions: z.number().min(1),
    timeLimit: z.number().min(1),
    passingScore: z.number().min(1).max(100),
    sections: z.array(z.object({
      name: z.string().min(1),
      description: z.string(),
      questionCount: z.number().min(1),
      percentage: z.number().min(1).max(100),
      difficultyRange: z.object({
        min: z.number().min(1).max(10),
        max: z.number().min(1).max(10),
      }),
    })),
  }).optional(),
  questionGuidelines: z.object({
    questionTypes: z.array(z.string()),
    difficultyDistribution: z.object({
      easy: z.number().min(0).max(100),
      medium: z.number().min(0).max(100),
      hard: z.number().min(0).max(100),
    }),
    scenarioBasedPercentage: z.number().min(0).max(100),
    bloomsTaxonomyLevels: z.array(z.string()),
    keyCompetencies: z.array(z.string()),
  }).optional(),
});

export type ExamReferenceForm = z.infer<typeof examReferenceFormSchema>;