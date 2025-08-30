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
    <Layout>
      <div className="space-y-6">
          <QuickStats />
          
          {/* Enhanced Main Dashboard - Mobile Responsive */}
          <div className="space-y-6 md:space-y-8 overflow-hidden">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              <div className="lg:col-span-2 order-2 lg:order-1 min-w-0">
                <LiveExamMonitoring />
              </div>
              <div className="order-1 lg:order-2 min-w-0">
                <RecentActivity />
              </div>
            </div>

            <AnalyticsOverview />

            {/* Enhanced Quick Actions - Apple UI Guidelines */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                <Button 
                  className="w-full bg-primary text-white h-auto hover:bg-primary/90 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8"
                  onClick={() => setLocation('/item-banks')}
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Plus className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">Create Item Bank</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Build question collections</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-blue-600 text-white h-auto hover:bg-blue-700 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8"
                  onClick={() => setLocation('/quiz-builder')}
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Puzzle className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">Build Quiz</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Create assessments</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-orange-500 text-white h-auto hover:bg-orange-600 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8"
                  onClick={() => setLocation('/ai-resources')}
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Bot className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">AI Generate</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Smart content creation</span>
                  </div>
                </Button>
                
                <Button 
                  className="w-full bg-purple-600 text-white h-auto hover:bg-purple-700 btn-modern min-h-[140px] md:min-h-[160px] px-4 py-6 md:px-6 md:py-8"
                  onClick={() => setLocation('/live-exams')}
                >
                  <div className="flex flex-col items-center space-y-2 md:space-y-3 text-center">
                    <Eye className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    <span className="font-medium text-base md:text-lg leading-tight">Monitor Exams</span>
                    <span className="text-xs md:text-sm opacity-90 leading-tight">Live proctoring</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
      </div>
    </Layout>
  );
}
