import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  FAB,
  Surface,
  ActivityIndicator 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface ExamProps {
  navigation: any;
}

interface MockExam {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionsCount: number;
  status: 'available' | 'scheduled' | 'completed';
  startTime?: string;
  endTime?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  hasProctoring: boolean;
  allowCalculator: boolean;
}

export default function ExamsScreen({ navigation }: ExamProps) {
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock exam data
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockExams: MockExam[] = [
        {
          id: '1',
          title: 'Mathematics Assessment',
          description: 'Comprehensive math exam covering algebra, geometry, and calculus',
          duration: 90,
          questionsCount: 25,
          status: 'available',
          difficulty: 'medium',
          subject: 'Mathematics',
          hasProctoring: true,
          allowCalculator: true,
        },
        {
          id: '2',
          title: 'Science Quiz',
          description: 'Basic science concepts including physics and chemistry',
          duration: 60,
          questionsCount: 20,
          status: 'available',
          difficulty: 'easy',
          subject: 'Science',
          hasProctoring: false,
          allowCalculator: false,
        },
        {
          id: '3',
          title: 'Advanced Physics',
          description: 'Advanced physics concepts for final assessment',
          duration: 120,
          questionsCount: 30,
          status: 'scheduled',
          startTime: '2025-01-10T10:00:00Z',
          difficulty: 'hard',
          subject: 'Physics',
          hasProctoring: true,
          allowCalculator: true,
        },
        {
          id: '4',
          title: 'History Test',
          description: 'World history from ancient civilizations to modern times',
          duration: 75,
          questionsCount: 15,
          status: 'completed',
          difficulty: 'medium',
          subject: 'History',
          hasProctoring: false,
          allowCalculator: false,
        },
      ];
      setExams(mockExams);
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExams();
    setRefreshing(false);
  };

  const handleStartExam = (exam: MockExam) => {
    if (exam.status === 'available') {
      navigation.navigate('ExamInterface', {
        examId: exam.id,
        quizId: `quiz-${exam.id}`,
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Available Exams
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {exams.filter(e => e.status === 'available').length} exams ready to take
          </Text>
        </Surface>

        {/* Exam Cards */}
        {exams.map((exam) => (
          <Card key={exam.id} style={styles.examCard}>
            <Card.Content>
              <View style={styles.examHeader}>
                <View style={styles.examTitleContainer}>
                  <Text variant="titleLarge" style={styles.examTitle}>
                    {exam.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.examSubject}>
                    {exam.subject}
                  </Text>
                </View>
                <View style={styles.chipContainer}>
                  <Chip 
                    mode="outlined" 
                    style={[styles.statusChip, { borderColor: getStatusColor(exam.status) }]}
                    textStyle={{ color: getStatusColor(exam.status) }}
                  >
                    {exam.status.toUpperCase()}
                  </Chip>
                </View>
              </View>

              <Text variant="bodyMedium" style={styles.examDescription}>
                {exam.description}
              </Text>

              <View style={styles.examDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{exam.duration} minutes</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="quiz" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{exam.questionsCount} questions</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="signal_cellular_alt" size={16} color={getDifficultyColor(exam.difficulty)} />
                  <Text style={[styles.detailText, { color: getDifficultyColor(exam.difficulty) }]}>
                    {exam.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.examFeatures}>
                {exam.hasProctoring && (
                  <Chip mode="outlined" style={styles.featureChip} icon="security">
                    Proctored
                  </Chip>
                )}
                {exam.allowCalculator && (
                  <Chip mode="outlined" style={styles.featureChip} icon="calculate">
                    Calculator
                  </Chip>
                )}
              </View>

              {exam.status === 'scheduled' && exam.startTime && (
                <View style={styles.scheduleInfo}>
                  <MaterialIcons name="event" size={16} color="#3B82F6" />
                  <Text style={styles.scheduleText}>
                    Scheduled: {new Date(exam.startTime).toLocaleDateString()} at{' '}
                    {new Date(exam.startTime).toLocaleTimeString()}
                  </Text>
                </View>
              )}

              <View style={styles.actionContainer}>
                <Button
                  mode={exam.status === 'available' ? 'contained' : 'outlined'}
                  onPress={() => handleStartExam(exam)}
                  disabled={exam.status !== 'available'}
                  style={styles.actionButton}
                >
                  {exam.status === 'available' ? 'Start Exam' : 
                   exam.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                </Button>
                
                {exam.status === 'available' && (
                  <Button
                    mode="text"
                    onPress={() => {/* Show exam details */}}
                    style={styles.detailsButton}
                  >
                    Details
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

        {exams.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="assignment" size={64} color="#D1D5DB" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Exams Available
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Check back later for new assignments
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        label="Refresh"
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  headerTitle: {
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#6B7280',
  },
  examCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  examTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  examSubject: {
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  chipContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    borderWidth: 2,
  },
  examDescription: {
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  examDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  examFeatures: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  featureChip: {
    borderColor: '#D1D5DB',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scheduleText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  detailsButton: {
    marginLeft: 8,
  },
  emptyCard: {
    marginHorizontal: 16,
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});