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
import { useUserSwitching } from "@/hooks/useUserSwitching";
import UserRoleSwitcher from "@/components/UserRoleSwitcher";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { switchedUser, switchUser, clearUserSwitch, isSwitched } = useUserSwitching();
  
  // Get effective user (switched user or original user)
  const effectiveUser = switchedUser || user;
  
  // Check if user is admin or super admin
  const isAdminOrSuperAdmin = effectiveUser?.role === 'admin' || effectiveUser?.role === 'super_admin';

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
        {/* Student View Button - Only visible for admin/super admin */}
        {isAdminOrSuperAdmin && (
          <div className="block sm:hidden mb-4">
            <div className="flex justify-end">
              <UserRoleSwitcher
                currentUser={effectiveUser}
                onUserSwitch={switchUser}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Student View
                  </Button>
                }
              />
            </div>
          </div>
        )}

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
