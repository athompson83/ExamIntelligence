import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  RadioButton, 
  Checkbox,
  Surface,
  ProgressBar,
  FAB,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '@/store';
import Calculator from '@/components/Calculator';
import ExamProctoring from '@/components/ExamProctoring';

interface ExamInterfaceScreenProps {
  route: {
    params: {
      examId: string;
      quizId: string;
    };
  };
  navigation: any;
}

export default function ExamInterfaceScreen({ route, navigation }: ExamInterfaceScreenProps) {
  const { examId, quizId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentQuestion, currentQuestionIndex, questions, timeRemaining, responses } = useSelector(
    (state: RootState) => state.exam
  );

  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorType, setCalculatorType] = useState<'basic' | 'scientific' | 'graphing'>('basic');
  const [showProctoring, setShowProctoring] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [securityEvents, setSecurityEvents] = useState<string[]>([]);

  // Mock quiz data with calculator settings
  const [quizSettings] = useState({
    allowCalculator: true,
    calculatorType: 'scientific' as 'basic' | 'scientific' | 'graphing',
    timeLimit: 60,
    totalQuestions: 10,
  });

  // Mock current question
  const [mockQuestion] = useState({
    id: '1',
    questionText: 'What is the area of a circle with radius 5 units? (Use π = 3.14159)',
    questionType: 'multiple_choice',
    points: 5,
    options: [
      { id: 'a', text: '78.54 square units', isCorrect: true },
      { id: 'b', text: '31.42 square units', isCorrect: false },
      { id: 'c', text: '15.71 square units', isCorrect: false },
      { id: 'd', text: '157.08 square units', isCorrect: false },
    ],
  });

  useEffect(() => {
    if (quizSettings.allowCalculator) {
      setCalculatorType(quizSettings.calculatorType);
    }
    // Start proctoring when exam begins
    setShowProctoring(true);
  }, [quizSettings]);

  const handleViolation = (violation: string) => {
    setViolations(prev => [...prev, violation]);
    console.log('Exam violation detected:', violation);
    // Could send to backend for tracking
  };

  const handleSecurityEvent = (event: string) => {
    setSecurityEvents(prev => [...prev, event]);
    console.log('Security event:', event);
    // Could send to backend for logging
  };

  const handleAnswerSelect = (answerId: string) => {
    if (mockQuestion.questionType === 'multiple_choice') {
      setSelectedAnswers([answerId]);
    } else if (mockQuestion.questionType === 'multiple_response') {
      setSelectedAnswers(prev => 
        prev.includes(answerId) 
          ? prev.filter(id => id !== answerId)
          : [...prev, answerId]
      );
    }
  };

  const handleNextQuestion = () => {
    // Save answer and move to next question
    // dispatch(saveResponse({ questionId: mockQuestion.id, answers: selectedAnswers }));
    setSelectedAnswers([]);
    // Navigate to next question or finish exam
  };

  const handlePreviousQuestion = () => {
    // Navigate to previous question
    setSelectedAnswers([]);
  };

  const handleFinishExam = () => {
    Alert.alert(
      'Finish Exam',
      'Are you sure you want to submit your exam? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          style: 'destructive',
          onPress: () => {
            // Submit exam logic
            navigation.navigate('ExamResult', { examId });
          }
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with timer and progress */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.progressSection}>
            <Text variant="bodySmall" style={styles.progressText}>
              Question {1} of {quizSettings.totalQuestions}
            </Text>
            <ProgressBar 
              progress={1 / quizSettings.totalQuestions} 
              style={styles.progressBar}
            />
          </View>
          
          <View style={styles.timerSection}>
            <MaterialIcons name="timer" size={20} color="#EF4444" />
            <Text variant="titleMedium" style={styles.timerText}>
              {formatTime(45 * 60)} {/* 45 minutes remaining */}
            </Text>
          </View>
        </View>
      </Surface>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <Card style={styles.questionCard}>
          <Card.Content>
            <View style={styles.questionHeader}>
              <Text variant="bodySmall" style={styles.questionType}>
                Multiple Choice • {mockQuestion.points} points
              </Text>
            </View>
            
            <Text variant="headlineSmall" style={styles.questionText}>
              {mockQuestion.questionText}
            </Text>

            {/* Answer Options */}
            <View style={styles.optionsContainer}>
              {mockQuestion.options.map((option) => (
                <Surface key={option.id} style={styles.optionCard}>
                  <View style={styles.optionContent}>
                    {mockQuestion.questionType === 'multiple_choice' ? (
                      <RadioButton
                        value={option.id}
                        status={selectedAnswers.includes(option.id) ? 'checked' : 'unchecked'}
                        onPress={() => handleAnswerSelect(option.id)}
                      />
                    ) : (
                      <Checkbox
                        status={selectedAnswers.includes(option.id) ? 'checked' : 'unchecked'}
                        onPress={() => handleAnswerSelect(option.id)}
                      />
                    )}
                    <Text 
                      variant="bodyLarge" 
                      style={styles.optionText}
                      onPress={() => handleAnswerSelect(option.id)}
                    >
                      {option.text}
                    </Text>
                  </View>
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <Button 
            mode="outlined" 
            onPress={handlePreviousQuestion}
            disabled={true} // First question
            style={styles.navButton}
          >
            Previous
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleNextQuestion}
            disabled={selectedAnswers.length === 0}
            style={styles.navButton}
          >
            Next Question
          </Button>
        </View>

        {/* Finish Exam Button */}
        <Button 
          mode="contained" 
          onPress={handleFinishExam}
          style={[styles.finishButton, { backgroundColor: '#EF4444' }]}
        >
          Finish Exam
        </Button>
      </ScrollView>

      {/* Calculator FAB */}
      {quizSettings.allowCalculator && (
        <Portal>
          <FAB
            icon={() => <MaterialIcons name="calculate" size={24} color="#FFFFFF" />}
            style={styles.calculatorFab}
            onPress={() => setShowCalculator(true)}
            label="Calculator"
          />
        </Portal>
      )}

      {/* Calculator Modal */}
      <Calculator
        visible={showCalculator}
        onDismiss={() => setShowCalculator(false)}
        type={calculatorType}
      />

      {/* Proctoring Component */}
      {showProctoring && (
        <ExamProctoring
          examId={examId}
          isActive={showProctoring}
          onViolation={handleViolation}
          onSecurityEvent={handleSecurityEvent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
    marginRight: 16,
  },
  progressText: {
    color: '#6B7280',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    color: '#EF4444',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    marginBottom: 24,
    elevation: 2,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionType: {
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  questionText: {
    color: '#1F2937',
    marginBottom: 24,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 8,
    elevation: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
    color: '#1F2937',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
  },
  finishButton: {
    marginBottom: 100, // Space for FAB
  },
  calculatorFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});