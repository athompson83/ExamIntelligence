import { useQuery } from "@tanstack/react-query";
import { Play, Users, FolderOpen, Brain, TrendingUp } from "lucide-react";
import { SystemAnalytics } from "@/types";

export function QuickStats() {
  const { data: analytics, isLoading } = useQuery<SystemAnalytics>({
    queryKey: ["/api/analytics/system"],
  });

  const { data: activeQuizzes, isLoading: activeQuizzesLoading } = useQuery({
    queryKey: ["/api/quizzes/active"],
  });

  const { data: proctoringAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/proctoring/alerts"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg h-40 animate-pulse" style={{ background: '#e5e7eb' }} />
        ))}
      </div>
    );
  }

  const activeExamsCount = activeQuizzesLoading ? "..." : ((activeQuizzes as any[])?.length || 0);
  const totalStudents = analytics?.users?.totalStudents || 0;
  const totalTestbanks = analytics?.testbanks?.totalTestbanks || 0;
  const validationsCount = alertsLoading ? "..." : ((proctoringAlerts as any[])?.length || 0);

  const cardStyle = {
    borderRadius: '1rem',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    color: 'white',
    position: 'relative' as const,
    overflow: 'hidden',
    padding: '1rem',
    minHeight: '140px',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Exams - Blue Gradient */}
      <div 
        data-testid="stat-card-active-exams"
        style={{ 
          ...cardStyle,
          backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 25px 50px -12px rgb(0 0 0 / 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
        }}
      >
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.2 }}>
          <Play style={{ width: '4rem', height: '4rem', color: 'white' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Active Exams
          </p>
          <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            {activeExamsCount}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '9999px', padding: '0.25rem 0.75rem', width: 'fit-content' }}>
            <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'white' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
              +2 from yesterday
            </span>
          </div>
        </div>
      </div>

      {/* Total Students - Green Gradient */}
      <div 
        data-testid="stat-card-total-students"
        style={{ 
          ...cardStyle,
          backgroundImage: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 25px 50px -12px rgb(0 0 0 / 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
        }}
      >
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.2 }}>
          <Users style={{ width: '4rem', height: '4rem', color: 'white' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Total Students
          </p>
          <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            {totalStudents}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '9999px', padding: '0.25rem 0.75rem', width: 'fit-content' }}>
            <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'white' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
              +15 new this week
            </span>
          </div>
        </div>
      </div>

      {/* Item Banks - Orange/Amber Gradient */}
      <div 
        data-testid="stat-card-item-banks"
        style={{ 
          ...cardStyle,
          backgroundImage: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 25px 50px -12px rgb(0 0 0 / 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
        }}
      >
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.2 }}>
          <FolderOpen style={{ width: '4rem', height: '4rem', color: 'white' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Item Banks
          </p>
          <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            {totalTestbanks}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '9999px', padding: '0.25rem 0.75rem', width: 'fit-content' }}>
            <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'white' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
              +3 updated today
            </span>
          </div>
        </div>
      </div>

      {/* AI Validations - Purple Gradient */}
      <div 
        data-testid="stat-card-ai-validations"
        style={{ 
          ...cardStyle,
          backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 25px 50px -12px rgb(0 0 0 / 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
        }}
      >
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.2 }}>
          <Brain style={{ width: '4rem', height: '4rem', color: 'white' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            AI Validations
          </p>
          <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            {validationsCount}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '9999px', padding: '0.25rem 0.75rem', width: 'fit-content' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
              24 pending review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
