import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";
import { 
  GraduationCap, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Users, 
  Zap,
  CheckCircle,
  ArrowRight,
  Brain,
  Target,
  Monitor,
  Settings,
  Globe,
  Camera,
  Clock,
  Lock,
  FileText,
  Smartphone,
  Award,
  MessageSquare,
  Download,
  Upload,
  Search,
  RefreshCw,
  HelpCircle,
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const { t } = useTranslation();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const features = [
    {
      icon: BookOpen,
      title: "Advanced Item Banks",
      description: "Centralized question storage with intelligent organization",
      features: [
        "Bloom's taxonomy integration",
        "Collaborative sharing across teams",
        "Random question selection algorithms",
        "Version control and question history",
        "Advanced tagging and categorization",
        "Bulk import/export capabilities"
      ]
    },
    {
      icon: Brain,
      title: "Computer Adaptive Testing (CAT)",
      description: "Dynamic testing that adapts to student performance",
      features: [
        "Real-time difficulty adjustment",
        "Personalized question selection",
        "IRT-based scoring algorithms",
        "Confidence interval calculations",
        "Adaptive termination criteria",
        "Performance prediction models"
      ]
    },
    {
      icon: Zap,
      title: "Multi-Provider AI System",
      description: "7 LLM providers for redundancy and optimization",
      features: [
        "OpenAI, Anthropic, Google Gemini integration",
        "XAI Grok, Deepseek, Groq, Meta Llama",
        "Automatic failover and load balancing",
        "Cost optimization algorithms",
        "Custom prompt management",
        "Real-time provider monitoring"
      ]
    },
    {
      icon: Shield,
      title: "Live Proctoring & Security",
      description: "Comprehensive exam security and monitoring",
      features: [
        "Real-time camera monitoring",
        "Activity and behavior detection",
        "Tab switching prevention",
        "Lockdown browser capabilities",
        "Automated alert systems",
        "Comprehensive audit trails"
      ]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "AI-powered insights and performance tracking",
      features: [
        "ML-based performance predictions",
        "Anomaly detection algorithms",
        "Question difficulty clustering",
        "Personalized learning paths",
        "Concept mastery analysis",
        "Interactive dashboard visualization"
      ]
    },
    {
      icon: Globe,
      title: "LTI Integration",
      description: "Seamless LMS connectivity",
      features: [
        "Canvas, Moodle, Blackboard support",
        "Automatic grade passback",
        "Content selection and deep linking",
        "Single sign-on (SSO) integration",
        "Real-time synchronization",
        "Complete setup documentation"
      ]
    },
    {
      icon: Users,
      title: "Multi-Role Management",
      description: "Comprehensive user and account management",
      features: [
        "Four-tier role system (Super Admin, Admin, Teacher, Student)",
        "Account-based multi-tenancy",
        "Granular permission controls",
        "User activity tracking",
        "Bulk user management",
        "Custom role configurations"
      ]
    },
    {
      icon: Smartphone,
      title: "Mobile-Responsive Design",
      description: "Optimized for all devices",
      features: [
        "Mobile-first UI optimization",
        "Touch-friendly interfaces",
        "Responsive scaling and layouts",
        "Progressive Web App (PWA) support",
        "Offline sync capabilities",
        "Cross-platform compatibility"
      ]
    },
    {
      icon: Settings,
      title: "Question Builder & Management",
      description: "Comprehensive question creation tools",
      features: [
        "Multiple question types support",
        "Rich media integration (images, audio, video)",
        "Drag-and-drop question builders",
        "AI-powered question validation",
        "Difficulty calibration tools",
        "Question performance analytics"
      ]
    },
    {
      icon: Award,
      title: "Assessment Features",
      description: "Complete assessment lifecycle management",
      features: [
        "Quiz and exam creation",
        "Assignment scheduling and management",
        "Automated grading systems",
        "Speed grader interface",
        "Rubric-based assessment",
        "Peer review capabilities"
      ]
    },
    {
      icon: Target,
      title: "Learning Analytics",
      description: "Data-driven educational insights",
      features: [
        "Student progress tracking",
        "Learning outcome analysis",
        "Performance trend identification",
        "Intervention recommendations",
        "Competency mapping",
        "Achievement gap analysis"
      ]
    },
    {
      icon: Lock,
      title: "Data Safety & Security",
      description: "Enterprise-grade data protection",
      features: [
        "Archiving instead of deletion",
        "Complete audit trails",
        "FERPA compliance",
        "Data encryption at rest and in transit",
        "Regular security audits",
        "Backup and recovery systems"
      ]
    }
  ];

  const faqItems = [
    {
      question: "What is ProficiencyAI and how does it work?",
      answer: "ProficiencyAI is a comprehensive educational assessment platform that uses artificial intelligence to create, validate, and deliver personalized tests and quizzes. It features Computer Adaptive Testing (CAT) that adjusts question difficulty in real-time based on student performance, ensuring accurate ability measurement while minimizing test fatigue."
    },
    {
      question: "What is Computer Adaptive Testing (CAT) and why is it better?",
      answer: "Computer Adaptive Testing dynamically selects questions based on a student's ability level. If a student answers correctly, the system presents a more challenging question; if incorrect, an easier question follows. This approach provides more accurate assessments in less time, reduces test anxiety, and prevents cheating since each student receives a unique set of questions."
    },
    {
      question: "Which Learning Management Systems (LMS) are supported?",
      answer: "ProficiencyAI supports comprehensive LTI (Learning Tools Interoperability) 1.3 integration with major LMS platforms including Canvas, Moodle, Blackboard, and other LTI-compliant systems. Features include automatic grade passback, content selection, deep linking, and single sign-on capabilities."
    },
    {
      question: "How does the AI question validation work?",
      answer: "Our multi-provider AI system uses 7 different LLM providers (OpenAI, Anthropic, Google Gemini, XAI Grok, Deepseek, Groq, Meta Llama) to validate questions for grammar, clarity, difficulty calibration, and educational standards compliance. The system provides automatic failover, cost optimization, and real-time quality assurance."
    },
    {
      question: "What proctoring and security features are available?",
      answer: "ProficiencyAI includes comprehensive live proctoring with real-time camera monitoring, behavior detection, tab switching prevention, lockdown browser capabilities, and automated alert systems. All activities are logged with complete audit trails for academic integrity enforcement."
    },
    {
      question: "Can I import existing questions and tests?",
      answer: "Yes, the platform supports bulk import/export capabilities for questions and assessments. You can import from various formats and our AI system will help validate and categorize imported content according to educational standards and Bloom's taxonomy."
    },
    {
      question: "What analytics and reporting features are provided?",
      answer: "The platform offers advanced analytics including ML-based performance predictions, anomaly detection, question difficulty analysis, personalized learning paths, concept mastery tracking, and comprehensive dashboard visualizations. Reports can be customized for different stakeholder needs."
    },
    {
      question: "Is the platform mobile-friendly?",
      answer: "Absolutely! ProficiencyAI features a mobile-first design with responsive layouts, touch-friendly interfaces, Progressive Web App (PWA) support, and offline sync capabilities. Students can take assessments on any device with optimal user experience."
    },
    {
      question: "What user roles and permissions are available?",
      answer: "The platform supports a four-tier role system: Super Admin (platform management), Admin (institution management), Teacher (course and assessment management), and Student (assessment taking). Each role has granular permissions with account-based multi-tenancy support."
    },
    {
      question: "How is data security and privacy handled?",
      answer: "Data security is paramount with enterprise-grade protection including FERPA compliance, data encryption at rest and in transit, archiving instead of permanent deletion, complete audit trails, regular security audits, and robust backup and recovery systems."
    },
    {
      question: "What question types are supported?",
      answer: "The platform supports multiple question types including multiple choice, multiple response, true/false, essay, constructed response, fill-in-the-blank, drag-and-drop, and rich media questions with images, audio, and video integration."
    },
    {
      question: "How does pricing work?",
      answer: "ProficiencyAI offers flexible pricing tiers based on institutional needs. Contact our sales team for custom pricing that includes features like unlimited assessments, advanced analytics, LTI integration, and priority support. We offer free trials for evaluation."
    },
    {
      question: "What support and training is available?",
      answer: "We provide comprehensive support including detailed documentation, video tutorials, live training sessions, dedicated customer success managers, 24/7 technical support, and a community forum for best practice sharing."
    },
    {
      question: "Can the platform scale for large institutions?",
      answer: "Yes, ProficiencyAI is built on scalable cloud infrastructure that can handle thousands of concurrent users. The platform includes load balancing, auto-scaling capabilities, and enterprise-grade performance monitoring to ensure reliable service."
    },
    {
      question: "What languages are supported?",
      answer: "The platform supports full internationalization (i18n) with 8 languages and dynamic language switching. Content can be created and delivered in multiple languages with proper localization support."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 mr-4 shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ProficiencyAI
            </h1>
          </div>
          <p className="text-2xl text-gray-700 mb-4 max-w-3xl mx-auto">
            The Future of Educational Assessment
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-4xl mx-auto">
            Comprehensive educational assessment platform with AI-powered question validation, Computer Adaptive Testing, 
            live proctoring, advanced analytics, and seamless LMS integration. Built for educational institutions 
            requiring robust, scalable assessment solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg shadow-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-2"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Intelligence</h3>
            <p className="text-gray-600">Advanced machine learning algorithms for personalized assessment and intelligent question generation</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
            <p className="text-gray-600">Comprehensive proctoring, data protection, and academic integrity enforcement</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Seamless Integration</h3>
            <p className="text-gray-600">Complete LTI integration with Canvas, Moodle, Blackboard, and other major LMS platforms</p>
          </div>
        </div>
      </section>

      {/* Comprehensive Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Feature Set</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for comprehensive educational assessment, from question creation to advanced analytics
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
                <CardHeader>
                  <div className="flex items-center mb-3">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-3 mr-3">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((feat, featIndex) => (
                      <li key={featIndex} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technical Specifications</h2>
            <p className="text-xl text-gray-600">Built with modern technologies for scalability and performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3 text-blue-600">Frontend</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• React 18 with TypeScript</li>
                <li>• Tailwind CSS & Shadcn/ui</li>
                <li>• Vite build system</li>
                <li>• Progressive Web App</li>
                <li>• Mobile-first responsive design</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3 text-green-600">Backend</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Node.js with Express</li>
                <li>• PostgreSQL with Drizzle ORM</li>
                <li>• WebSocket real-time features</li>
                <li>• RESTful API architecture</li>
                <li>• Serverless deployment ready</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3 text-purple-600">AI & Analytics</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 7 LLM provider integration</li>
                <li>• Machine learning algorithms</li>
                <li>• Real-time analytics</li>
                <li>• Predictive modeling</li>
                <li>• Custom prompt management</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3 text-red-600">Security & Compliance</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• FERPA compliant</li>
                <li>• End-to-end encryption</li>
                <li>• Role-based access control</li>
                <li>• Comprehensive audit logs</li>
                <li>• SOC 2 Type II ready</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Get answers to common questions about ProficiencyAI</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {faqItems.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                <button
                  className="w-full p-6 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  {expandedFAQ === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="p-6 bg-white border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">7</div>
              <div className="text-blue-100">AI Provider Integration</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50M+</div>
              <div className="text-blue-100">Assessments Delivered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto shadow-xl border-2">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl mb-4">Ready to Transform Your Educational Assessments?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of educators and institutions using ProficiencyAI to create more effective, 
                secure, and personalized assessments. Start your free trial today and experience the future of educational assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg shadow-lg"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-4 text-lg border-2"
                  onClick={() => window.location.href = '/pricing'}
                >
                  View Pricing
                </Button>
              </div>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  30-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Setup in minutes
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2 mr-3">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">ProficiencyAI</span>
          </div>
          <p className="text-gray-400 mb-4">
            Empowering education through intelligent assessment technology
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 ProficiencyAI. All rights reserved. | Built with advanced AI and modern web technologies.
          </p>
        </div>
      </footer>
    </div>
  );
}