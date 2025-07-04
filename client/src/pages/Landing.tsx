import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Shield, BarChart3, Users, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: BookOpen,
      title: "Advanced Item Banks",
      description: "Create and manage comprehensive question libraries with Canvas LMS-level functionality and beyond.",
    },
    {
      icon: Brain,
      title: "AI-Powered Validation",
      description: "Automatically validate questions for clarity, difficulty, and educational effectiveness using advanced AI.",
    },
    {
      icon: Shield,
      title: "Live Proctoring",
      description: "Monitor exams in real-time with camera feeds, suspicious activity detection, and automated alerts.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get detailed insights into student performance, question effectiveness, and learning outcomes.",
    },
    {
      icon: Users,
      title: "Multi-Platform Support",
      description: "Web interface for administrators and native mobile apps for students and teachers.",
    },
    {
      icon: Zap,
      title: "Adaptive Testing",
      description: "Dynamic difficulty adjustment based on student performance for personalized assessment experiences.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="bg-primary rounded-lg p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ExamGen Pro</span>
          </div>
          <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
            Advanced Exam Generator Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and monitor educational assessments with AI-powered validation, 
            live proctoring, and comprehensive analytics. Canvas LMS-level features and beyond.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comprehensive Assessment Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, deliver, and analyze educational assessments
              with enterprise-grade security and AI-powered insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Assessments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of educators who trust ExamGen Pro for their assessment needs.
            Sign in to get started with your comprehensive exam management platform.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90">
            Sign In to Continue
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 ExamGen Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
