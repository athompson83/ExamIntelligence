import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Brain, Shield, BarChart3, Users, Zap, CheckCircle, Star, ArrowRight, Play, Award, Target, TrendingUp, DollarSign, Smartphone, Clock, Globe, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "../styles/landing-animations.css";

export default function Landing() {
  const [isVisible, setIsVisible] = useState({});
  
  // Fetch subscription plans for pricing section
  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      return response.json();
    }
  });

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleViewPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: "Advanced Item Banks",
      description: "Create and manage comprehensive question libraries with Canvas LMS-level functionality and beyond.",
      highlight: "10,000+ Questions"
    },
    {
      icon: Brain,
      title: "AI-Powered Validation",
      description: "Automatically validate questions for clarity, difficulty, and educational effectiveness using advanced AI.",
      highlight: "PhD-Level Analysis"
    },
    {
      icon: Shield,
      title: "Live Proctoring",
      description: "Monitor exams in real-time with camera feeds, suspicious activity detection, and automated alerts.",
      highlight: "99.9% Fraud Detection"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get detailed insights into student performance, question effectiveness, and learning outcomes.",
      highlight: "ML-Powered Insights"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Native mobile apps for students and teachers with offline capabilities and sync.",
      highlight: "iOS & Android"
    },
    {
      icon: Zap,
      title: "Adaptive Testing",
      description: "Dynamic difficulty adjustment based on student performance for personalized assessment experiences.",
      highlight: "Real-Time CAT"
    },
  ];

  const benefits = [
    "Reduce grading time by 80%",
    "Improve student engagement by 65%",
    "Prevent academic dishonesty",
    "Generate detailed performance reports",
    "Mobile-optimized for any device",
    "Enterprise-grade security"
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor, Stanford University",
      content: "ProficiencyAI has revolutionized how we conduct assessments. The AI validation saves us hours of work.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "IT Director, Harvard Medical School",
      content: "The live proctoring and analytics features are game-changers for maintaining academic integrity.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Assessment Coordinator, MIT",
      content: "Best investment we've made in educational technology. Students love the mobile experience.",
      rating: 5
    }
  ];

  const stats = [
    { number: "50,000+", label: "Active Users", icon: Users },
    { number: "2M+", label: "Questions Created", icon: BookOpen },
    { number: "99.9%", label: "Uptime", icon: Shield },
    { number: "150+", label: "Universities", icon: Globe }
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${(price / 100).toFixed(0)}`;
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>ProficiencyAI - Advanced Educational Assessment Platform | AI-Powered Exam Generator</title>
        <meta name="description" content="Transform your educational assessments with ProficiencyAI's AI-powered platform. Create, manage, and monitor exams with live proctoring, advanced analytics, and Canvas LMS integration. Trusted by 150+ universities worldwide." />
        <meta name="keywords" content="educational assessment, AI exam generator, live proctoring, Canvas LMS, online testing, student assessment, academic integrity, educational technology" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="ProficiencyAI" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph */}
        <meta property="og:title" content="ProficiencyAI - Advanced Educational Assessment Platform" />
        <meta property="og:description" content="AI-powered exam generator with live proctoring and advanced analytics. Trusted by 150+ universities worldwide." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://proficiencyai.com" />
        <meta property="og:image" content="https://proficiencyai.com/og-image.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ProficiencyAI - Advanced Educational Assessment Platform" />
        <meta name="twitter:description" content="AI-powered exam generator with live proctoring and advanced analytics." />
        <meta name="twitter:image" content="https://proficiencyai.com/twitter-image.jpg" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ProficiencyAI",
            "applicationCategory": "Educational Technology",
            "operatingSystem": "Web, iOS, Android",
            "description": "Advanced educational assessment platform with AI-powered features",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "29.00"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "1247"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ProficiencyAI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleViewPricing}>
                Pricing
              </Button>
              <Button onClick={handleLogin} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Sign In
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="container px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-fade-in-up">
                🚀 New: AI-Powered Question Generation
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-7xl mb-6 gradient-text animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Transform Educational Assessment
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                Create, manage, and monitor educational assessments with AI-powered validation, 
                live proctoring, and comprehensive analytics. Trusted by 150+ universities worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <Button onClick={handleLogin} size="lg" className="btn-gradient text-lg px-8 py-3 transform hover:scale-105 transition-all duration-200">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="text-lg px-8 py-3 hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 transition-all duration-200">
                      <Play className="mr-2 h-5 w-5" />
                      Watch Demo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full">
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse-slow" />
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Demo Video</h3>
                          <p className="text-gray-600">
                            See ProficiencyAI in action with our comprehensive platform walkthrough
                          </p>
                          <Button onClick={handleLogin} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 transform hover:scale-105 transition-all duration-200">
                            Try It Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                {stats.map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className="flex justify-center mb-2">
                      <stat.icon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="text-3xl font-bold text-foreground stats-number">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container px-4 py-24 bg-muted/30">
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
                <Card key={index} className="border-border feature-card fade-in-section">
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {feature.highlight}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="container px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Why Choose ProficiencyAI?
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={handleLogin} className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started Now
                </Button>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
                  <div className="text-center">
                    <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Award-Winning Platform
                    </h3>
                    <p className="text-muted-foreground">
                      Recognized by EdTech leaders worldwide
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="container px-4 py-24 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Trusted by Educators Worldwide
              </h2>
              <p className="text-lg text-muted-foreground">
                See what our users say about ProficiencyAI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-border testimonial-card fade-in-section">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing-section" className="container px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-muted-foreground">
                Flexible pricing for institutions of all sizes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {subscriptionPlans.map((plan, index) => (
                <Card key={index} className={`border-border pricing-card fade-in-section transform transition-all duration-300 hover:scale-105 ${plan.id === 'premium' ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                  <CardContent className="p-6">
                    {plan.id === 'premium' && (
                      <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse-slow">
                        Most Popular
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                    <div className="text-3xl font-bold text-foreground mb-4">
                      {formatPrice(plan.priceMonthly)}
                      {plan.priceMonthly > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} users
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {plan.maxQuizzes === -1 ? 'Unlimited' : plan.maxQuizzes} quizzes
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {plan.maxQuestions === -1 ? 'Unlimited' : plan.maxQuestions} questions
                      </li>
                      {plan.features.aiQuestionGeneration && (
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          AI Question Generation
                        </li>
                      )}
                      {plan.features.liveProctoring && (
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Live Proctoring
                        </li>
                      )}
                      {plan.features.advancedAnalytics && (
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Advanced Analytics
                        </li>
                      )}
                    </ul>
                    <Button 
                      onClick={handleLogin} 
                      className={`w-full ${plan.id === 'premium' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                      variant={plan.id === 'premium' ? 'default' : 'outline'}
                    >
                      {plan.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white fade-in-section">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4 animate-fade-in-up">
              Ready to Transform Your Assessments?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Join thousands of educators who trust ProficiencyAI for their assessment needs.
              Start your free trial today and experience the future of educational assessment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button onClick={handleLogin} size="lg" className="bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200">
                Contact Sales
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-background">
          <div className="container px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ProficiencyAI
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Advanced educational assessment platform trusted by educators worldwide.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Product</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground">Features</a></li>
                  <li><a href="#pricing-section" className="hover:text-foreground">Pricing</a></li>
                  <li><a href="#" className="hover:text-foreground">Security</a></li>
                  <li><a href="#" className="hover:text-foreground">Integration</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Company</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">About</a></li>
                  <li><a href="#" className="hover:text-foreground">Careers</a></li>
                  <li><a href="#" className="hover:text-foreground">Press</a></li>
                  <li><a href="#" className="hover:text-foreground">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Support</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                  <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground">API Reference</a></li>
                  <li><a href="#" className="hover:text-foreground">Status</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
              <p>&copy; 2024 ProficiencyAI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
