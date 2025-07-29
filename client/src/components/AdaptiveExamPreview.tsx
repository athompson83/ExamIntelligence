import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Brain, 
  Target, 
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause
} from 'lucide-react';

interface AdaptiveExamPreviewProps {
  examData: any;
  onStartExam?: () => void;
}

interface QuestionSimulation {
  id: string;
  questionText: string;
  difficulty: number;
  isCorrect: boolean | null;
  responseTime: number;
  abilityEstimate: number;
  standardError: number;
}

const AdaptiveExamPreview: React.FC<AdaptiveExamPreviewProps> = ({ 
  examData, 
  onStartExam 
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [simulationData, setSimulationData] = useState<QuestionSimulation[]>([]);
  const [currentAbility, setCurrentAbility] = useState(0);
  const [currentError, setCurrentError] = useState(1.0);

  // Simulate adaptive testing algorithm
  const generateSimulationData = () => {
    const questions: QuestionSimulation[] = [];
    let abilityEstimate = 0;
    let standardError = 1.0;
    const startingDifficulty = parseFloat(examData.startingDifficulty) || 5.0;
    const difficultyAdjustment = parseFloat(examData.difficultyAdjustment) || 0.5;
    
    // Simulate a typical student performance pattern
    const studentAbility = Math.random() * 6 + 2; // Random ability 2-8
    
    for (let i = 0; i < Math.min(examData.maxQuestions || 20, 15); i++) {
      let questionDifficulty;
      
      if (i === 0) {
        questionDifficulty = startingDifficulty;
      } else {
        // Adaptive difficulty based on previous performance
        const lastCorrect = questions[i - 1]?.isCorrect;
        if (lastCorrect) {
          questionDifficulty = Math.min(10, questions[i - 1].difficulty + difficultyAdjustment);
        } else {
          questionDifficulty = Math.max(1, questions[i - 1].difficulty - difficultyAdjustment);
        }
      }
      
      // Simulate student response based on question difficulty vs student ability
      const probability = 1 / (1 + Math.exp(-(studentAbility - questionDifficulty)));
      const isCorrect = Math.random() < probability;
      
      // Update ability estimate (simplified IRT)
      if (isCorrect) {
        abilityEstimate += 0.3 * (questionDifficulty - abilityEstimate) * standardError;
      } else {
        abilityEstimate -= 0.3 * (abilityEstimate - questionDifficulty) * standardError;
      }
      
      // Update standard error (decreases with more questions)
      standardError = Math.max(0.1, standardError * 0.9);
      
      questions.push({
        id: `sim_q_${i}`,
        questionText: generateSampleQuestion(questionDifficulty),
        difficulty: questionDifficulty,
        isCorrect: null, // Initially null, will be revealed during simulation
        responseTime: 15 + Math.random() * 45, // 15-60 seconds
        abilityEstimate,
        standardError
      });
    }
    
    return questions;
  };

  const generateSampleQuestion = (difficulty: number): string => {
    const templates = [
      { min: 1, max: 3, text: "What is the basic principle of..." },
      { min: 2, max: 4, text: "Which of the following correctly describes..." },
      { min: 3, max: 5, text: "How would you analyze the relationship between..." },
      { min: 4, max: 6, text: "Compare and contrast the effects of..." },
      { min: 5, max: 7, text: "Evaluate the complex interaction between..." },
      { min: 6, max: 8, text: "Synthesize multiple factors to determine..." },
      { min: 7, max: 9, text: "Design an optimal solution considering..." },
      { min: 8, max: 10, text: "Critically assess the theoretical framework..." }
    ];
    
    const suitable = templates.filter(t => difficulty >= t.min && difficulty <= t.max);
    const template = suitable[Math.floor(Math.random() * suitable.length)];
    return template?.text || "Sample question text...";
  };

  const startSimulation = () => {
    if (simulationData.length === 0) {
      setSimulationData(generateSimulationData());
    }
    setIsSimulating(true);
    setIsPaused(false);
    setCurrentQuestion(0);
    setCurrentAbility(0);
    setCurrentError(1.0);
  };

  const pauseSimulation = () => {
    setIsPaused(!isPaused);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setIsPaused(false);
    setCurrentQuestion(0);
    setSimulationData([]);
    setCurrentAbility(0);
    setCurrentError(1.0);
  };

  // Auto-advance simulation
  useEffect(() => {
    if (isSimulating && !isPaused && currentQuestion < simulationData.length) {
      const timer = setTimeout(() => {
        const question = simulationData[currentQuestion];
        
        // Simulate student ability vs question difficulty
        const studentAbility = 5 + Math.random() * 2 - 1; // Variable performance
        const probability = 1 / (1 + Math.exp(-(studentAbility - question.difficulty)));
        const isCorrect = Math.random() < probability;
        
        // Update the question with result
        const updatedData = [...simulationData];
        updatedData[currentQuestion] = { ...question, isCorrect };
        setSimulationData(updatedData);
        
        // Update current estimates
        setCurrentAbility(question.abilityEstimate);
        setCurrentError(question.standardError);
        
        // Move to next question
        if (currentQuestion < simulationData.length - 1) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          setIsSimulating(false);
        }
      }, 2000); // 2 second per question
      
      return () => clearTimeout(timer);
    }
  }, [isSimulating, isPaused, currentQuestion, simulationData]);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'text-green-600 bg-green-50';
    if (difficulty <= 6) return 'text-yellow-600 bg-yellow-50';
    if (difficulty <= 8) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    if (difficulty <= 8) return 'Hard';
    return 'Expert';
  };

  const correctAnswers = simulationData.filter(q => q.isCorrect === true).length;
  const answeredQuestions = simulationData.filter(q => q.isCorrect !== null).length;
  const currentAccuracy = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Adaptive Exam Preview
              </CardTitle>
              <CardDescription>
                See how the exam adapts to your performance in real-time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isSimulating ? (
                <Button onClick={startSimulation} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Preview
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={pauseSimulation}
                    className="flex items-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetSimulation}
                  >
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Real-time Statistics */}
      {isSimulating && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Current Ability</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {currentAbility.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Scale: 0-10</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {currentAccuracy.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">
                {correctAnswers}/{answeredQuestions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Questions</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {currentQuestion + 1}/{simulationData.length}
              </div>
              <div className="text-xs text-gray-500">
                Progress: {Math.round(((currentQuestion + 1) / simulationData.length) * 100)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Precision</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {((1 - currentError) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">
                Error: ±{currentError.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Difficulty Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Difficulty Progression
          </CardTitle>
          <CardDescription>
            Watch how question difficulty adapts based on your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {simulationData.length > 0 ? (
            <div className="space-y-4">
              {/* Difficulty Chart */}
              <div className="h-32 border rounded-lg p-4 bg-gray-50">
                <div className="h-full flex items-end justify-between gap-1">
                  {simulationData.slice(0, currentQuestion + 1).map((question, index) => (
                    <div
                      key={question.id}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-500 ${
                          question.isCorrect === true 
                            ? 'bg-green-500' 
                            : question.isCorrect === false
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ 
                          height: `${(question.difficulty / 10) * 100}%`,
                          minHeight: '8px'
                        }}
                      />
                      <span className="text-xs text-gray-500">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Correct Answer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Incorrect Answer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Current Question</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Click "Start Preview" to see the adaptive difficulty visualization
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Timeline */}
      {simulationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Timeline</CardTitle>
            <CardDescription>
              Detailed view of each question and its adaptive impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {simulationData.slice(0, currentQuestion + 1).map((question, index) => (
                <div
                  key={question.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-300 ${
                    index === currentQuestion ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      Q{index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm font-medium truncate max-w-md">
                        {question.questionText}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Ability: {question.abilityEstimate.toFixed(1)} | 
                        Error: ±{question.standardError.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {getDifficultyLabel(question.difficulty)} ({question.difficulty.toFixed(1)})
                    </Badge>
                    
                    {question.isCorrect === true && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {question.isCorrect === false && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {question.isCorrect === null && index === currentQuestion && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Exam Button */}
      {onStartExam && (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Begin?</h3>
            <p className="text-gray-600 mb-4">
              Start your adaptive exam when you're ready. The system will adapt to your performance automatically.
            </p>
            <Button onClick={onStartExam} size="lg" className="px-8">
              Start Actual Exam
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdaptiveExamPreview;