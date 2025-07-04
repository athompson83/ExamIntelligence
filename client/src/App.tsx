import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ItemBanks from "@/pages/item-banks";
import QuestionManager from "@/pages/question-manager";
import QuizBuilder from "@/pages/quiz-builder";
import LiveExams from "@/pages/live-exams";
import Analytics from "@/pages/analytics";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import SpeedGrader from "@/pages/speed-grader";
import UserManagement from "@/pages/user-management";
import ExamInterface from "@/pages/exam-interface";
import AdminSettings from "@/pages/admin-settings";
import NotFound from "@/pages/not-found";

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
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/item-banks" component={ItemBanks} />
          <Route path="/testbanks/:id/questions">
            {(params) => <QuestionManager testbankId={params.id} />}
          </Route>
          <Route path="/quiz-builder" component={QuizBuilder} />
          <Route path="/live-exams" component={LiveExams} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/analytics-dashboard" component={AnalyticsDashboard} />
          <Route path="/speed-grader">
            {() => <SpeedGrader />}
          </Route>
          <Route path="/speed-grader/:quizId">
            {(params) => <SpeedGrader quizId={params.quizId} />}
          </Route>
          <Route path="/user-management" component={UserManagement} />
          <Route path="/admin-settings" component={AdminSettings} />
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
