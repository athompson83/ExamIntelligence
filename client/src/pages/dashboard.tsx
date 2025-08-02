import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { LiveExamMonitoring } from "@/components/dashboard/live-exam-monitoring";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview";
import { Button } from "@/components/ui/button";
import { Plus, Puzzle, Bot, Eye } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
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
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <TopBar />
        
        <main className="p-4 md:p-6 pt-20 md:pt-6">
          <QuickStats />
          
          {/* Main Dashboard - Mobile Responsive */}
          <div className="space-y-6">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 order-2 xl:order-1">
                <LiveExamMonitoring />
              </div>
              <div className="order-1 xl:order-2">
                <RecentActivity />
              </div>
            </div>

            <AnalyticsOverview />

            {/* Quick Actions - Mobile Carousel, Desktop Grid */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quick Actions</h3>
              <div className="mobile-carousel lg:grid lg:grid-cols-4 lg:gap-4 lg:space-x-0">
                <div className="mobile-carousel-item lg:w-auto">
                  <Button 
                    className="w-full bg-primary text-white p-6 h-auto hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    onClick={() => setLocation('/item-banks')}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Plus className="h-6 w-6" />
                      <span className="font-medium">Create Item Bank</span>
                      <span className="text-xs opacity-90">Build question collections</span>
                    </div>
                  </Button>
                </div>
                
                <div className="mobile-carousel-item lg:w-auto">
                  <Button 
                    className="w-full bg-secondary text-white p-6 h-auto hover:bg-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    onClick={() => setLocation('/quiz-builder')}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Puzzle className="h-6 w-6" />
                      <span className="font-medium">Build Quiz</span>
                      <span className="text-xs opacity-90">Create assessments</span>
                    </div>
                  </Button>
                </div>
                
                <div className="mobile-carousel-item lg:w-auto">
                  <Button 
                    className="w-full bg-orange-500 text-white p-6 h-auto hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    onClick={() => setLocation('/ai-resources')}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Bot className="h-6 w-6" />
                      <span className="font-medium">AI Generate</span>
                      <span className="text-xs opacity-90">Smart content creation</span>
                    </div>
                  </Button>
                </div>
                
                <div className="mobile-carousel-item lg:w-auto">
                  <Button 
                    className="w-full bg-purple-600 text-white p-6 h-auto hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    onClick={() => setLocation('/live-exams')}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Eye className="h-6 w-6" />
                      <span className="font-medium">Monitor Exams</span>
                      <span className="text-xs opacity-90">Live proctoring</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
