import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useToast } from "@/hooks/use-toast";
import { Bell, LogOut, User, GraduationCap, BookOpen, Shield } from "lucide-react";

export function TopBar() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const isStudentView = location.startsWith('/student');
  
  const handleViewToggle = () => {
    console.log('View toggle clicked, current location:', location, 'isStudentView:', isStudentView);
    if (isStudentView) {
      navigate('/'); // Go to teacher dashboard
    } else {
      navigate('/student-dashboard'); // Go to student dashboard
    }
  };

  const openProctoringDashboard = () => {
    const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
    const windowUrl = window.location.origin + '/proctoring-dashboard-window';
    const windowName = 'ProctoringDashboard';
    
    // Check if window is already open
    const existingWindow = window.open('', windowName);
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      return;
    }
    
    const newWindow = window.open(windowUrl, windowName, windowFeatures);
    if (newWindow) {
      newWindow.focus();
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to open the proctoring dashboard window",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">ProficiencyAI</h1>
      </div>
      
      <div className="flex items-center space-x-4">

        
        {/* Language Switcher */}
        <LanguageSwitcher variant="compact" />
        
        {/* Proctoring Dashboard */}
        {['admin', 'teacher', 'super_admin'].includes(user?.role || '') && (
          <Button variant="ghost" size="sm" onClick={openProctoringDashboard} title="Open Proctoring Dashboard">
            <Shield className="h-4 w-4" />
          </Button>
        )}
        
        {/* Notifications */}
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem onClick={handleViewToggle}>
              {isStudentView ? (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Switch to Teacher View</span>
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>Switch to Student View</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}