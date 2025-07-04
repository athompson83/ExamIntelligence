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
import NotFound from "@/pages/not-found";
import ProjectStatus from "@/pages/project-status";
import LanguageTest from "@/pages/language-test";

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
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/item-banks" component={ItemBanks} />
          <Route path="/question-manager">
            {() => <QuestionManager />}
          </Route>
          <Route path="/testbanks/:id/questions">
            {(params) => <QuestionManager testbankId={params.id} />}
          </Route>
          <Route path="/quiz-builder" component={EnhancedQuizBuilder} />
          <Route path="/enhanced-quiz-builder" component={EnhancedQuizBuilder} />
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
          <Route path="/reference-banks" component={ReferenceBanks} />
          <Route path="/study-aids" component={StudyAids} />
          <Route path="/project-status" component={ProjectStatus} />
          <Route path="/exam/:id">
            {(params) => <ExamInterface examId={params.id} />}
          </Route>
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
