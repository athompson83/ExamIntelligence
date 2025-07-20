import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipProvider as CustomTooltipProvider } from "@/components/TooltipProvider";
import { OnboardingTourProvider } from "@/contexts/OnboardingTourContext";
import { AITooltipProvider } from "@/contexts/AITooltipContext";
import OnboardingTour from "@/components/OnboardingTour";
import AITooltipMascot from "@/components/AITooltipMascot";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";

import { useAuth } from "@/hooks/useAuth";
import { usePageTracking } from "@/hooks/usePageTracking";
import LoadingSpinner from "@/components/ui/loading-spinner";
import SmoothLoadingFallback from "@/components/SmoothLoadingFallback";
import { useEffect } from "react";

// Core pages that are always needed
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

// Lazy load pages to reduce initial bundle size
const ItemBanks = lazy(() => import("@/pages/item-banks"));
const QuestionManager = lazy(() => import("@/pages/question-manager"));
const LiveExams = lazy(() => import("@/pages/live-exams"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const SpeedGrader = lazy(() => import("@/pages/speed-grader"));
const UserManagement = lazy(() => import("@/pages/user-management"));
const ExamInterface = lazy(() => import("@/pages/exam-interface"));
const AdminSettings = lazy(() => import("@/pages/admin-settings"));
const ReferenceBanks = lazy(() => import("@/pages/reference-banks"));
const EnhancedQuizBuilder = lazy(() => import("@/pages/enhanced-quiz-builder"));
const StudyResources = lazy(() => import("@/pages/study-resources"));
const MLAnalytics = lazy(() => import("@/pages/MLAnalytics"));
const ComprehensiveAnalytics = lazy(() => import("@/pages/ComprehensiveAnalytics"));
const EnhancedDifficultyTracking = lazy(() => import("@/pages/enhanced-difficulty-tracking"));
const ProjectStatus = lazy(() => import("@/pages/project-status"));
const LanguageTest = lazy(() => import("@/pages/language-test"));
const Settings = lazy(() => import("@/pages/Settings"));
const SuperAdminSettings = lazy(() => import("@/pages/super-admin-settings"));
const BadgesCertificates = lazy(() => import("@/pages/badges-certificates"));
const BadgeSystem = lazy(() => import("@/pages/badge-system"));
const AccessibilitySettings = lazy(() => import("@/pages/accessibility-settings"));
const LearningFeedback = lazy(() => import("@/pages/learning-feedback"));

const StudentLogin = lazy(() => import("@/pages/student-login"));
const StudentDashboard = lazy(() => import("@/pages/student-dashboard"));
const StudentQuiz = lazy(() => import("@/pages/student-quiz"));
const CATExamBuilder = lazy(() => import("@/pages/CATExamBuilder"));
const CATExamTest = lazy(() => import("@/pages/CATExamTest"));
const CoreFunctionalityTest = lazy(() => import("@/pages/CoreFunctionalityTest"));
const ProctoringSecurity = lazy(() => import("@/pages/proctoring-security"));
const ProctoringDashboardWindow = lazy(() => import("@/pages/proctoring-dashboard-window"));
const QuestionFeedbackPage = lazy(() => import("@/pages/question-feedback"));
const AnonymousQuizAccessPage = lazy(() => import("@/pages/anonymous-quiz-access"));
const NotificationSettings = lazy(() => import("@/pages/notification-settings"));
const BugReporting = lazy(() => import("@/pages/bug-reporting"));
const Announcements = lazy(() => import("@/pages/announcements"));
const QuestionFlagging = lazy(() => import("@/pages/question-flagging"));
const AIChatbot = lazy(() => import("@/pages/ai-chatbot"));
const BackendPromptManagement = lazy(() => import("@/pages/backend-prompt-management"));
const BackendPromptTestPage = lazy(() => import("@/pages/backend-prompt-test"));
const QuizTakerDemo = lazy(() => import("@/pages/quiz-taker-demo"));
const QuizBuilderDemo = lazy(() => import("@/pages/QuizBuilderDemo"));
const PublishedQuizzes = lazy(() => import("@/pages/published-quizzes"));
const QuizPreview = lazy(() => import("@/pages/quiz-preview"));
const EnhancedQuizPreview = lazy(() => import("@/pages/enhanced-quiz-preview"));
const QuizManager = lazy(() => import("@/pages/quiz-manager"));
const SectionManagement = lazy(() => import("@/pages/SectionManagementFixed"));
const Assignments = lazy(() => import("@/pages/Assignments"));
const MobileApp = lazy(() => import("@/pages/MobileApp"));
const ProctoringLobby = lazy(() => import("@/pages/ProctoringLobby"));
const SystemTest = lazy(() => import("@/pages/SystemTest"));
const ComprehensiveTest = lazy(() => import("@/pages/ComprehensiveTest"));
const SectionManagementTest = lazy(() => import("@/pages/SectionManagementTest"));
const Test = lazy(() => import("@/pages/Test"));
const AccountRegistration = lazy(() => import("@/pages/account-registration"));
const ProctoringTest = lazy(() => import("@/pages/proctoring-test"));
const Gradebook = lazy(() => import("@/pages/gradebook"));
const Prerequisites = lazy(() => import("@/pages/prerequisites"));
const ProgressTracking = lazy(() => import("@/pages/progress-tracking"));
const CustomerSupport = lazy(() => import("@/pages/customer-support"));
const ProfileEnhancement = lazy(() => import("@/pages/profile-enhancement"));
const OfflineSyncPage = lazy(() => import("@/pages/OfflineSyncPage"));
const ArchiveManagement = lazy(() => import("@/pages/archive-management"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const Billing = lazy(() => import("@/pages/billing"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentPage } = usePageTracking();

  // Preload common data for better performance
  useEffect(() => {
    if (isAuthenticated) {
      // Preload dashboard data
      fetch('/api/dashboard/stats').catch(() => {});
      fetch('/api/notifications').catch(() => {});
      fetch('/api/study-aids').catch(() => {});
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-all duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading ProficiencyAI...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Mobile app route - accessible without authentication */}
      <Route path="/mobile">
        {() => <Suspense fallback={<LoadingSpinner />}><MobileApp /></Suspense>}
      </Route>
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/language-test">
            {() => <Suspense fallback={<SmoothLoadingFallback type="content" />}><LanguageTest /></Suspense>}
          </Route>
          <Route path="/student-login">
            {() => <Suspense fallback={<SmoothLoadingFallback type="content" />}><StudentLogin /></Suspense>}
          </Route>
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/item-banks">
            {() => <Suspense fallback={<SmoothLoadingFallback />}><ItemBanks /></Suspense>}
          </Route>
          <Route path="/question-manager">
            {() => <Suspense fallback={<SmoothLoadingFallback />}><QuestionManager /></Suspense>}
          </Route>
          <Route path="/testbanks/:id/questions">
            {(params) => <Suspense fallback={<LoadingSpinner />}><QuestionManager testbankId={params.id} /></Suspense>}
          </Route>
          <Route path="/quiz-manager">
            {() => <Suspense fallback={<LoadingSpinner />}><QuizManager /></Suspense>}
          </Route>
          <Route path="/assignments">
            {() => <Suspense fallback={<LoadingSpinner />}><Assignments /></Suspense>}
          </Route>
          <Route path="/quiz-builder">
            {() => <Suspense fallback={<LoadingSpinner />}><EnhancedQuizBuilder /></Suspense>}
          </Route>
          <Route path="/enhanced-quiz-builder">
            {() => <Suspense fallback={<LoadingSpinner />}><EnhancedQuizBuilder /></Suspense>}
          </Route>
          <Route path="/cat-exam-builder">
            {() => <Suspense fallback={<LoadingSpinner />}><CATExamBuilder /></Suspense>}
          </Route>
          <Route path="/cat-exam-test">
            {() => <Suspense fallback={<LoadingSpinner />}><CATExamTest /></Suspense>}
          </Route>
          <Route path="/core-functionality-test">
            {() => <Suspense fallback={<LoadingSpinner />}><CoreFunctionalityTest /></Suspense>}
          </Route>
          <Route path="/live-exams">
            {() => <Suspense fallback={<SmoothLoadingFallback />}><LiveExams /></Suspense>}
          </Route>
          <Route path="/analytics">
            {() => <Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense>}
          </Route>
          <Route path="/analytics-dashboard">
            {() => <Suspense fallback={<LoadingSpinner />}><AnalyticsDashboard /></Suspense>}
          </Route>
          <Route path="/ml-analytics">
            {() => <Suspense fallback={<LoadingSpinner />}><MLAnalytics /></Suspense>}
          </Route>
          <Route path="/comprehensive-analytics">
            {() => <Suspense fallback={<LoadingSpinner />}><ComprehensiveAnalytics /></Suspense>}
          </Route>
          <Route path="/speed-grader">
            {() => <Suspense fallback={<LoadingSpinner />}><SpeedGrader /></Suspense>}
          </Route>
          <Route path="/speed-grader/:quizId">
            {(params) => <Suspense fallback={<LoadingSpinner />}><SpeedGrader quizId={params.quizId} /></Suspense>}
          </Route>
          <Route path="/user-management">
            {() => <Suspense fallback={<SmoothLoadingFallback />}><UserManagement /></Suspense>}
          </Route>
          <Route path="/admin-settings">
            {() => <Suspense fallback={<LoadingSpinner />}><AdminSettings /></Suspense>}
          </Route>
          <Route path="/settings">
            {() => <Suspense fallback={<SmoothLoadingFallback />}><Settings /></Suspense>}
          </Route>
          <Route path="/super-admin-settings">
            {() => <Suspense fallback={<LoadingSpinner />}><SuperAdminSettings /></Suspense>}
          </Route>
          <Route path="/archive-management">
            {() => <Suspense fallback={<LoadingSpinner />}><ArchiveManagement /></Suspense>}
          </Route>
          <Route path="/reference-banks">
            {() => <Suspense fallback={<LoadingSpinner />}><ReferenceBanks /></Suspense>}
          </Route>
          <Route path="/study-aids">
            {() => <Suspense fallback={<LoadingSpinner />}><StudyResources /></Suspense>}
          </Route>
          <Route path="/ai-resources">
            {() => <Suspense fallback={<LoadingSpinner />}><StudyResources /></Suspense>}
          </Route>
          <Route path="/study-resources">
            {() => <Suspense fallback={<LoadingSpinner />}><StudyResources /></Suspense>}
          </Route>
          <Route path="/badges-certificates">
            {() => <Suspense fallback={<LoadingSpinner />}><BadgesCertificates /></Suspense>}
          </Route>
          <Route path="/badge-system">
            {() => <Suspense fallback={<LoadingSpinner />}><BadgeSystem /></Suspense>}
          </Route>
          <Route path="/learning-feedback">
            {() => <Suspense fallback={<LoadingSpinner />}><LearningFeedback /></Suspense>}
          </Route>
          <Route path="/difficulty-tracking">
            {() => <Suspense fallback={<LoadingSpinner />}><EnhancedDifficultyTracking /></Suspense>}
          </Route>
          <Route path="/enhanced-difficulty-tracking">
            {() => <Suspense fallback={<LoadingSpinner />}><EnhancedDifficultyTracking /></Suspense>}
          </Route>
          <Route path="/accessibility-settings">
            {() => <Suspense fallback={<LoadingSpinner />}><AccessibilitySettings /></Suspense>}
          </Route>
          <Route path="/proctoring-security">
            {() => <Suspense fallback={<LoadingSpinner />}><ProctoringSecurity /></Suspense>}
          </Route>
          <Route path="/proctoring-dashboard-window">
            {() => <Suspense fallback={<LoadingSpinner />}><ProctoringDashboardWindow /></Suspense>}
          </Route>
          <Route path="/proctoring-lobby">
            {() => <Suspense fallback={<LoadingSpinner />}><ProctoringLobby /></Suspense>}
          </Route>
          <Route path="/project-status">
            {() => <Suspense fallback={<LoadingSpinner />}><ProjectStatus /></Suspense>}
          </Route>
          <Route path="/question-feedback">
            {() => <Suspense fallback={<LoadingSpinner />}><QuestionFeedbackPage /></Suspense>}
          </Route>
          <Route path="/anonymous-quiz-access">
            {() => <Suspense fallback={<LoadingSpinner />}><AnonymousQuizAccessPage /></Suspense>}
          </Route>
          <Route path="/notification-settings">
            {() => <Suspense fallback={<LoadingSpinner />}><NotificationSettings /></Suspense>}
          </Route>
          <Route path="/bug-reporting">
            {() => <Suspense fallback={<LoadingSpinner />}><BugReporting /></Suspense>}
          </Route>
          <Route path="/announcements">
            {() => <Suspense fallback={<LoadingSpinner />}><Announcements /></Suspense>}
          </Route>
          <Route path="/question-flagging">
            {() => <Suspense fallback={<LoadingSpinner />}><QuestionFlagging /></Suspense>}
          </Route>
          <Route path="/ai-chatbot">
            {() => <Suspense fallback={<LoadingSpinner />}><AIChatbot /></Suspense>}
          </Route>
          <Route path="/backend-prompt-management">
            {() => <Suspense fallback={<LoadingSpinner />}><BackendPromptManagement /></Suspense>}
          </Route>
          <Route path="/backend-prompt-test">
            {() => <Suspense fallback={<LoadingSpinner />}><BackendPromptTestPage /></Suspense>}
          </Route>
          <Route path="/exam/:id">
            {(params) => <Suspense fallback={<LoadingSpinner />}><ExamInterface examId={params.id} /></Suspense>}
          </Route>
          <Route path="/student">
            {() => <Suspense fallback={<LoadingSpinner />}><StudentDashboard /></Suspense>}
          </Route>
          <Route path="/student-dashboard">
            {() => <Suspense fallback={<LoadingSpinner />}><StudentDashboard /></Suspense>}
          </Route>
          <Route path="/student-quiz">
            {() => <Suspense fallback={<LoadingSpinner />}><StudentQuiz /></Suspense>}
          </Route>
          <Route path="/student/quiz/:quizId">
            {(params) => <Suspense fallback={<LoadingSpinner />}><StudentQuiz quizId={params.quizId} /></Suspense>}
          </Route>
          <Route path="/quiz/:id">
            {(params) => <Suspense fallback={<LoadingSpinner />}><EnhancedQuizPreview id={params.id} /></Suspense>}
          </Route>
          <Route path="/quiz-preview/:id">
            {(params) => <Suspense fallback={<LoadingSpinner />}><EnhancedQuizPreview id={params.id} /></Suspense>}
          </Route>
          <Route path="/enhanced-quiz-preview/:id">
            {(params) => <Suspense fallback={<LoadingSpinner />}><EnhancedQuizPreview id={params.id} /></Suspense>}
          </Route>
          <Route path="/published-quizzes">
            {() => <Suspense fallback={<LoadingSpinner />}><PublishedQuizzes /></Suspense>}
          </Route>
          <Route path="/quiz-taker-demo">
            {() => <Suspense fallback={<LoadingSpinner />}><QuizTakerDemo /></Suspense>}
          </Route>
          <Route path="/quiz-builder-demo">
            {() => <Suspense fallback={<LoadingSpinner />}><QuizBuilderDemo /></Suspense>}
          </Route>
          <Route path="/section-management">
            {() => <Suspense fallback={<LoadingSpinner />}><SectionManagement /></Suspense>}
          </Route>
          <Route path="/test">
            {() => <Suspense fallback={<LoadingSpinner />}><Test /></Suspense>}
          </Route>
          <Route path="/proctoring-test">
            {() => <Suspense fallback={<LoadingSpinner />}><ProctoringTest /></Suspense>}
          </Route>
          <Route path="/system-test">
            {() => <Suspense fallback={<LoadingSpinner />}><SystemTest /></Suspense>}
          </Route>
          <Route path="/comprehensive-test">
            {() => <Suspense fallback={<LoadingSpinner />}><ComprehensiveTest /></Suspense>}
          </Route>
          <Route path="/section-management-test">
            {() => <Suspense fallback={<LoadingSpinner />}><SectionManagementTest /></Suspense>}
          </Route>
          <Route path="/gradebook">
            {() => <Suspense fallback={<LoadingSpinner />}><Gradebook /></Suspense>}
          </Route>
          <Route path="/prerequisites">
            {() => <Suspense fallback={<LoadingSpinner />}><Prerequisites /></Suspense>}
          </Route>
          <Route path="/progress-tracking">
            {() => <Suspense fallback={<LoadingSpinner />}><ProgressTracking /></Suspense>}
          </Route>
          <Route path="/customer-support">
            {() => <Suspense fallback={<LoadingSpinner />}><CustomerSupport /></Suspense>}
          </Route>
          <Route path="/profile-enhancement">
            {() => <Suspense fallback={<LoadingSpinner />}><ProfileEnhancement /></Suspense>}
          </Route>
          <Route path="/offline-sync">
            {() => <Suspense fallback={<LoadingSpinner />}><OfflineSyncPage /></Suspense>}
          </Route>
          <Route path="/pricing">
            {() => <Suspense fallback={<LoadingSpinner />}><Pricing /></Suspense>}
          </Route>
          <Route path="/subscribe">
            {() => <Suspense fallback={<LoadingSpinner />}><Subscribe /></Suspense>}
          </Route>
          <Route path="/billing">
            {() => <Suspense fallback={<LoadingSpinner />}><Billing /></Suspense>}
          </Route>
        </>
      )}
      <Route path="/join/:token">
        {(params) => <Suspense fallback={<LoadingSpinner />}><AccountRegistration token={params.token} /></Suspense>}
      </Route>
      <Route component={NotFound} />
      
      {/* AI Tooltip Mascot - only show for authenticated users */}
      {isAuthenticated && <AITooltipMascot currentPage={currentPage} />}
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CustomTooltipProvider>
            <AITooltipProvider>
              <OnboardingTourProvider>
                <Toaster />
                <Router />
                <OnboardingTour />
              </OnboardingTourProvider>
            </AITooltipProvider>
          </CustomTooltipProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
