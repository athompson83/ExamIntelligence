import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ItemBanks from "@/pages/item-banks";
import QuestionManager from "@/pages/question-manager";

import LiveExams from "@/pages/live-exams";
import Analytics from "@/pages/Analytics";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import SpeedGrader from "@/pages/speed-grader";
import UserManagement from "@/pages/user-management";
import ExamInterface from "@/pages/exam-interface";
import AdminSettings from "@/pages/admin-settings";
import ReferenceBanks from "@/pages/reference-banks";
import EnhancedQuizBuilder from "@/pages/enhanced-quiz-builder";
import StudyAids from "@/pages/study-aids";
import MLAnalytics from "@/pages/MLAnalytics";
import ComprehensiveAnalytics from "@/pages/ComprehensiveAnalytics";
import EnhancedDifficultyTracking from "@/pages/enhanced-difficulty-tracking";
import NotFound from "@/pages/not-found";
import ProjectStatus from "@/pages/project-status";
import LanguageTest from "@/pages/language-test";
import Settings from "@/pages/Settings";
import SuperAdminSettings from "@/pages/super-admin-settings";
import BadgesCertificates from "@/pages/badges-certificates";
import BadgeSystem from "@/pages/badge-system";
import AccessibilitySettings from "@/pages/accessibility-settings";
import LearningFeedback from "@/pages/learning-feedback";
import AIResources from "@/pages/AIResources";
import StudentLogin from "@/pages/student-login";
import StudentDashboard from "@/pages/student-dashboard";
import StudentQuiz from "@/pages/student-quiz";
import CATExamBuilder from "@/pages/CATExamBuilder";
import ProctoringSecurity from "@/pages/proctoring-security";
import QuestionFeedbackPage from "@/pages/question-feedback";
import AnonymousQuizAccessPage from "@/pages/anonymous-quiz-access";
import NotificationSettings from "@/pages/notification-settings";
import BugReporting from "@/pages/bug-reporting";
import Announcements from "@/pages/announcements";
import QuestionFlagging from "@/pages/question-flagging";
import AIChatbot from "@/pages/ai-chatbot";
import BackendPromptManagement from "@/pages/backend-prompt-management";
import QuizTakerDemo from "@/pages/quiz-taker-demo";
import QuizBuilderDemo from "@/pages/QuizBuilderDemo";
import PublishedQuizzes from "@/pages/published-quizzes";
import QuizPreview from "@/pages/quiz-preview";
import EnhancedQuizPreview from "@/pages/enhanced-quiz-preview";
import QuizManager from "@/pages/quiz-manager";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/language-test" component={LanguageTest} />
          <Route path="/student-login" component={StudentLogin} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/item-banks" component={ItemBanks} />
          <Route path="/question-manager">
            {() => <QuestionManager />}
          </Route>
          <Route path="/testbanks/:id/questions">
            {(params) => <QuestionManager testbankId={params.id} />}
          </Route>
          <Route path="/quiz-manager" component={QuizManager} />
          <Route path="/quiz-builder" component={EnhancedQuizBuilder} />
          <Route path="/enhanced-quiz-builder" component={EnhancedQuizBuilder} />
          <Route path="/cat-exam-builder" component={CATExamBuilder} />
          <Route path="/live-exams" component={LiveExams} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/analytics-dashboard" component={AnalyticsDashboard} />
          <Route path="/ml-analytics" component={MLAnalytics} />
          <Route path="/comprehensive-analytics" component={ComprehensiveAnalytics} />
          <Route path="/speed-grader">
            {() => <SpeedGrader />}
          </Route>
          <Route path="/speed-grader/:quizId">
            {(params) => <SpeedGrader quizId={params.quizId} />}
          </Route>
          <Route path="/user-management" component={UserManagement} />
          <Route path="/admin-settings" component={AdminSettings} />
          <Route path="/settings" component={Settings} />
          <Route path="/super-admin-settings" component={SuperAdminSettings} />
          <Route path="/reference-banks" component={ReferenceBanks} />
          <Route path="/study-aids" component={StudyAids} />
          <Route path="/ai-resources" component={AIResources} />
          <Route path="/badges-certificates" component={BadgesCertificates} />
          <Route path="/badge-system" component={BadgeSystem} />
          <Route path="/learning-feedback" component={LearningFeedback} />
          <Route path="/difficulty-tracking" component={EnhancedDifficultyTracking} />
          <Route path="/enhanced-difficulty-tracking" component={EnhancedDifficultyTracking} />
          <Route path="/accessibility-settings" component={AccessibilitySettings} />
          <Route path="/proctoring-security" component={ProctoringSecurity} />
          <Route path="/project-status" component={ProjectStatus} />
          <Route path="/question-feedback" component={QuestionFeedbackPage} />
          <Route path="/anonymous-quiz-access" component={AnonymousQuizAccessPage} />
          <Route path="/notification-settings" component={NotificationSettings} />
          <Route path="/bug-reporting" component={BugReporting} />
          <Route path="/announcements" component={Announcements} />
          <Route path="/question-flagging" component={QuestionFlagging} />
          <Route path="/ai-chatbot" component={AIChatbot} />
          <Route path="/backend-prompt-management" component={BackendPromptManagement} />
          <Route path="/exam/:id">
            {(params) => <ExamInterface examId={params.id} />}
          </Route>
          <Route path="/student" component={StudentDashboard} />
          <Route path="/student-dashboard" component={StudentDashboard} />
          <Route path="/student-quiz" component={StudentQuiz} />
          <Route path="/student/quiz/:quizId" component={StudentQuiz} />
          <Route path="/quiz/:id" component={EnhancedQuizPreview} />
          <Route path="/quiz-preview/:id" component={EnhancedQuizPreview} />
          <Route path="/enhanced-quiz-preview/:id" component={EnhancedQuizPreview} />
          <Route path="/published-quizzes" component={PublishedQuizzes} />
          <Route path="/quiz-taker-demo" component={QuizTakerDemo} />
          <Route path="/quiz-builder-demo" component={QuizBuilderDemo} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
