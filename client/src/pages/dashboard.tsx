import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { LiveExamMonitoring } from "@/components/dashboard/LiveExamMonitoring";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsOverview";
import { Button } from "@/components/ui/button";
import { Plus, Puzzle, Bot, Eye } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Hero Section with Gradient Background */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-32 md:mb-40">
        <div className="h-80 md:h-96 bg-gradient-to-r from-blue-600 to-blue-500 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
          
          {/* Hero Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col justify-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Welcome back, {user?.firstName || "User"}! 👋
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                Here's what's happening with your courses and assessments today.
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards - Overlapping Hero Bottom */}
        <div className="absolute -bottom-24 md:-bottom-32 left-0 right-0 px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto animate-slide-up">
            <QuickStats />
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="space-y-6 animate-fade-in">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2" data-testid="section-live-exam-monitoring">
              <LiveExamMonitoring />
            </div>
            <div data-testid="section-recent-activity">
              <RecentActivity />
            </div>
          </div>

          <div data-testid="section-analytics-overview">
            <AnalyticsOverview />
          </div>

          {/* Quick Actions */}
          <section className="space-y-4" aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-200">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  className="w-full bg-primary text-white h-auto hover:bg-primary/90 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => setLocation('/item-banks')}
                  data-testid="button-create-item-bank"
                  aria-label="Create new item bank"
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Plus className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">Create Item Bank</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Build question collections</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-blue-600 text-white h-auto hover:bg-blue-700 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => setLocation('/quiz-builder')}
                  data-testid="button-build-quiz"
                  aria-label="Build new quiz"
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Puzzle className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">Build Quiz</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Create assessments</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-orange-500 text-white h-auto hover:bg-orange-600 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => setLocation('/ai-resources')}
                  data-testid="button-ai-generate"
                  aria-label="Generate content with AI"
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Bot className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">AI Generate</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Smart content creation</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-purple-600 text-white h-auto hover:bg-purple-700 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => setLocation('/live-exams')}
                  data-testid="button-monitor-exams"
                  aria-label="Monitor live exams"
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Eye className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">Monitor Exams</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Live proctoring</span>
                  </div>
                </Button>
              </div>
            </section>
          </div>
        </div>
    </Layout>
  );
}
