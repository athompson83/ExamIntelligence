import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card,
  FAB,
  Chip,
  Avatar,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchUpcomingExams } from '@/store/slices/examSlice';
import { MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { upcomingExams, isLoading } = useSelector((state: RootState) => state.exam);
  
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchUpcomingExams());
  }, [dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchUpcomingExams());
    setRefreshing(false);
  }, [dispatch]);

  const isStudent = user?.role === 'student';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <Surface style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <View style={styles.userInfo}>
              <Avatar.Text 
                size={60} 
                label={user?.firstName?.charAt(0) || 'U'} 
                style={styles.avatar}
              />
              <View style={styles.userText}>
                <Text variant="headlineSmall" style={styles.welcomeText}>
                  Welcome back,
                </Text>
                <Text variant="titleLarge" style={styles.userName}>
                  {user?.firstName || 'User'}
                </Text>
                <Chip mode="outlined" style={styles.roleChip}>
                  {user?.role?.replace('_', ' ').toUpperCase() || 'STUDENT'}
                </Chip>
              </View>
            </View>
          </View>
        </Surface>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Overview
          </Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialIcons name="assignment" size={24} color="#3B82F6" />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {upcomingExams?.length || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {isStudent ? 'Upcoming Exams' : 'Active Exams'}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialIcons name="grade" size={24} color="#10B981" />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  85%
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {isStudent ? 'Avg. Score' : 'Class Avg.'}
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Upcoming Exams */}
        <View style={styles.examSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {isStudent ? 'Upcoming Exams' : 'Recent Activity'}
          </Text>
          
          {upcomingExams && upcomingExams.length > 0 ? (
            upcomingExams.map((exam, index) => (
              <Card key={index} style={styles.examCard}>
                <Card.Content>
                  <View style={styles.examHeader}>
                    <Text variant="titleMedium" style={styles.examTitle}>
                      {exam.title}
                    </Text>
                    <Chip 
                      mode="outlined" 
                      style={[styles.statusChip, { 
                        backgroundColor: exam.status === 'scheduled' ? '#FEF3C7' : '#DBEAFE' 
                      }]}
                    >
                      {exam.status?.toUpperCase()}
                    </Chip>
                  </View>
                  <Text variant="bodyMedium" style={styles.examDescription}>
                    {exam.description}
                  </Text>
                  <View style={styles.examDetails}>
                    <View style={styles.examDetail}>
                      <MaterialIcons name="schedule" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.examDetailText}>
                        {exam.duration} minutes
                      </Text>
                    </View>
                    <View style={styles.examDetail}>
                      <MaterialIcons name="quiz" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.examDetailText}>
                        {exam.questionsCount} questions
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="assignment" size={48} color="#D1D5DB" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {isStudent ? 'No upcoming exams' : 'No recent activity'}
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {!isStudent && (
        <FAB
          icon="add"
          style={styles.fab}
          onPress={() => {
            // Navigate to create exam
          }}
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
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#3B82F6',
    marginRight: 16,
  },
  userText: {
    flex: 1,
  },
  welcomeText: {
    color: '#6B7280',
  },
  userName: {
    color: '#1F2937',
    fontWeight: '600',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    color: '#1F2937',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    color: '#6B7280',
    textAlign: 'center',
  },
  examSection: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for FAB
  },
  examCard: {
    marginBottom: 12,
    elevation: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  examTitle: {
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  examDescription: {
    color: '#6B7280',
    marginBottom: 12,
  },
  examDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  examDetailText: {
    color: '#6B7280',
  },
  emptyCard: {
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});