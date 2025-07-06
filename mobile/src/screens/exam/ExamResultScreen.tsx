import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Surface,
  ProgressBar,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface ExamResultScreenProps {
  route: {
    params: {
      examId: string;
      score?: number;
      totalQuestions?: number;
      timeSpent?: number;
    };
  };
  navigation: any;
}

export default function ExamResultScreen({ route, navigation }: ExamResultScreenProps) {
  const { examId, score = 85, totalQuestions = 25, timeSpent = 45 } = route.params;

  // Mock exam result data
  const examResult = {
    examTitle: 'Mathematics Assessment',
    score: score,
    percentage: Math.round((score / 100) * 100),
    totalQuestions: totalQuestions,
    correctAnswers: Math.round((score / 100) * totalQuestions),
    timeSpent: timeSpent,
    timeLimit: 90,
    status: score >= 70 ? 'passed' : 'failed',
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    submittedAt: new Date().toISOString(),
    subject: 'Mathematics',
    difficulty: 'Medium',
    violations: 0,
    proctored: true,
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return '#10B981';
    if (percentage >= 80) return '#3B82F6';
    if (percentage >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#3B82F6';
      case 'C': return '#F59E0B';
      case 'D': return '#F97316';
      case 'F': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleReturnToDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleViewDetails = () => {
    // Navigate to detailed exam review
    console.log('Navigate to exam review');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.statusIconContainer}>
            <MaterialIcons 
              name={examResult.status === 'passed' ? 'check-circle' : 'cancel'} 
              size={64} 
              color={examResult.status === 'passed' ? '#10B981' : '#EF4444'} 
            />
          </View>
          <Text variant="headlineMedium" style={styles.statusTitle}>
            {examResult.status === 'passed' ? 'Congratulations!' : 'Better Luck Next Time'}
          </Text>
          <Text variant="bodyLarge" style={styles.statusSubtitle}>
            {examResult.status === 'passed' 
              ? 'You have successfully completed the exam'
              : 'You can retake this exam to improve your score'
            }
          </Text>
        </Surface>

        {/* Score Overview */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreHeader}>
              <Text variant="titleLarge" style={styles.examTitle}>
                {examResult.examTitle}
              </Text>
              <Chip 
                mode="flat" 
                style={[styles.gradeChip, { backgroundColor: getGradeColor(examResult.grade) }]}
                textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
              >
                Grade {examResult.grade}
              </Chip>
            </View>

            <View style={styles.scoreDisplay}>
              <Text variant="displayMedium" style={[styles.scoreText, { color: getScoreColor(examResult.percentage) }]}>
                {examResult.percentage}%
              </Text>
              <Text variant="bodyLarge" style={styles.scoreSubtext}>
                {examResult.correctAnswers} out of {examResult.totalQuestions} correct
              </Text>
            </View>

            <ProgressBar 
              progress={examResult.percentage / 100} 
              style={[styles.progressBar, { color: getScoreColor(examResult.percentage) }]}
            />
          </Card.Content>
        </Card>

        {/* Exam Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.detailsTitle}>
              Exam Details
            </Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <MaterialIcons name="schedule" size={20} color="#6B7280" />
                <View style={styles.detailText}>
                  <Text variant="bodySmall" style={styles.detailLabel}>Time Spent</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {examResult.timeSpent} of {examResult.timeLimit} minutes
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MaterialIcons name="quiz" size={20} color="#6B7280" />
                <View style={styles.detailText}>
                  <Text variant="bodySmall" style={styles.detailLabel}>Subject</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {examResult.subject}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MaterialIcons name="signal_cellular_alt" size={20} color="#6B7280" />
                <View style={styles.detailText}>
                  <Text variant="bodySmall" style={styles.detailLabel}>Difficulty</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {examResult.difficulty}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MaterialIcons name="event" size={20} color="#6B7280" />
                <View style={styles.detailText}>
                  <Text variant="bodySmall" style={styles.detailLabel}>Submitted</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {new Date(examResult.submittedAt).toLocaleDateString()} at{' '}
                    {new Date(examResult.submittedAt).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              {examResult.proctored && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="security" size={20} color="#6B7280" />
                  <View style={styles.detailText}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Proctoring</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>
                      {examResult.violations} violations detected
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Performance Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.insightsTitle}>
              Performance Insights
            </Text>

            <View style={styles.insight}>
              <MaterialIcons name="trending-up" size={24} color="#10B981" />
              <View style={styles.insightText}>
                <Text variant="bodyMedium" style={styles.insightTitle}>
                  Strong Performance
                </Text>
                <Text variant="bodySmall" style={styles.insightDescription}>
                  You completed the exam efficiently using {Math.round((examResult.timeSpent / examResult.timeLimit) * 100)}% of the allotted time.
                </Text>
              </View>
            </View>

            {examResult.percentage < 100 && (
              <View style={styles.insight}>
                <MaterialIcons name="school" size={24} color="#3B82F6" />
                <View style={styles.insightText}>
                  <Text variant="bodyMedium" style={styles.insightTitle}>
                    Room for Improvement
                  </Text>
                  <Text variant="bodySmall" style={styles.insightDescription}>
                    Review the topics you missed to strengthen your understanding for future assessments.
                  </Text>
                </View>
              </View>
            )}

            {examResult.violations === 0 && examResult.proctored && (
              <View style={styles.insight}>
                <MaterialIcons name="verified" size={24} color="#10B981" />
                <View style={styles.insightText}>
                  <Text variant="bodyMedium" style={styles.insightTitle}>
                    Clean Exam Session
                  </Text>
                  <Text variant="bodySmall" style={styles.insightDescription}>
                    No proctoring violations were detected during your exam session.
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            mode="outlined"
            onPress={handleViewDetails}
            style={styles.actionButton}
            icon="description"
          >
            View Details
          </Button>
          <Button
            mode="contained"
            onPress={handleReturnToDashboard}
            style={styles.actionButton}
            icon="home"
          >
            Return to Dashboard
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  scoreCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  examTitle: {
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  gradeChip: {
    marginLeft: 12,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreSubtext: {
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  detailsTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    color: '#1F2937',
    fontWeight: '500',
  },
  insightsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  insightsTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 16,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    color: '#6B7280',
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});