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
      
      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar />
        
        <main className="flex-1 p-4 pt-10 md:p-6 md:pt-6 space-y-6">
          <QuickStats />
          
          {/* Enhanced Main Dashboard - Mobile Responsive */}
          <div className="mobile-section space-y-8">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <LiveExamMonitoring />
              </div>
              <div className="order-1 lg:order-2">
                <RecentActivity />
              </div>
            </div>

            <AnalyticsOverview />

            {/* Enhanced Quick Actions - Mobile Grid */}
            <div className="space-y-6">
              <h3 className="text-2xl md:text-xl font-bold text-gray-800 dark:text-gray-200">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Button 
                  className="w-full bg-primary text-white p-8 md:p-8 h-auto hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-mobile min-h-[160px] md:min-h-[160px] rounded-xl px-6"
                  onClick={() => setLocation('/item-banks')}
                >
                  <div className="flex flex-col items-center space-y-3 md:space-y-3">
                    <Plus className="h-8 w-8 md:h-8 md:w-8" />
                    <span className="font-semibold text-lg md:text-base text-center">Create Item Bank</span>
                    <span className="text-xs md:text-sm opacity-90 text-center">Build question collections</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-blue-600 text-white p-8 md:p-8 h-auto hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-mobile min-h-[160px] md:min-h-[160px] rounded-xl px-6"
                  onClick={() => setLocation('/quiz-builder')}
                >
                  <div className="flex flex-col items-center space-y-3 md:space-y-3">
                    <Puzzle className="h-8 w-8 md:h-8 md:w-8" />
                    <span className="font-semibold text-lg md:text-base text-center">Build Quiz</span>
                    <span className="text-sm md:text-sm opacity-90 text-center">Create assessments</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-orange-500 text-white p-8 md:p-8 h-auto hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-mobile min-h-[160px] md:min-h-[160px] rounded-xl px-6"
                  onClick={() => setLocation('/ai-resources')}
                >
                  <div className="flex flex-col items-center space-y-3 md:space-y-3">
                    <Bot className="h-8 w-8 md:h-8 md:w-8" />
                    <span className="font-semibold text-lg md:text-base text-center">AI Generate</span>
                    <span className="text-sm md:text-sm opacity-90 text-center">Smart content creation</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-purple-600 text-white p-8 md:p-8 h-auto hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-mobile min-h-[160px] md:min-h-[160px] rounded-xl px-6"
                  onClick={() => setLocation('/live-exams')}
                >
                  <div className="flex flex-col items-center space-y-3 md:space-y-3">
                    <Eye className="h-8 w-8 md:h-8 md:w-8" />
                    <span className="font-semibold text-lg md:text-base text-center">Monitor Exams</span>
                    <span className="text-sm md:text-sm opacity-90 text-center">Live proctoring</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
