import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { LiveExamMonitoring } from "@/components/dashboard/LiveExamMonitoring";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Quick Stats */}
        <QuickStats />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Exam Monitoring */}
          <LiveExamMonitoring />

          {/* Recent Activity */}
          <RecentActivity />
        </div>

        {/* Analytics Overview */}
        <AnalyticsOverview />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}
