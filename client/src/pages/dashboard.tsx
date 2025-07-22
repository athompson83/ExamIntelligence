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
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <QuickStats />
          
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <LiveExamMonitoring />
            </div>
            <div>
              <RecentActivity />
            </div>
          </div>

          <AnalyticsOverview />

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="bg-primary text-white p-4 h-auto hover:bg-primary/90 transition-colors duration-200"
              onClick={() => setLocation('/item-banks')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Item Bank
            </Button>
            
            <Button 
              className="bg-secondary text-white p-4 h-auto hover:bg-secondary/90 transition-colors duration-200"
              onClick={() => setLocation('/quiz-builder')}
            >
              <Puzzle className="mr-2 h-4 w-4" />
              Build Quiz
            </Button>
            
            <Button 
              className="bg-orange-500 text-white p-4 h-auto hover:bg-orange-600 transition-colors duration-200"
              onClick={() => setLocation('/ai-resources')}
            >
              <Bot className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
            
            <Button 
              className="bg-purple-600 text-white p-4 h-auto hover:bg-purple-700 transition-colors duration-200"
              onClick={() => setLocation('/live-exams')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Monitor Exams
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
