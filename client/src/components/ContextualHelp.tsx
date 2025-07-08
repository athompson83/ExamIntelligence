import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronRight, Book, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HelpContent {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'article' | 'tip';
  content: string;
  url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

interface ContextualHelpProps {
  context: string;
  isVisible: boolean;
  onClose: () => void;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ context, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('guides');
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);

  // Context-specific help content
  const helpContent: Record<string, HelpContent[]> = {
    dashboard: [
      {
        id: 'dashboard_overview',
        title: 'Dashboard Overview',
        description: 'Learn how to navigate and use your dashboard effectively',
        type: 'guide',
        content: `Your dashboard is your mission control center. Here's what each section does:

**📊 Statistics Cards**
- Quick overview of your key metrics
- Click any card for detailed views
- Real-time updates every 30 seconds

**🎯 Active Exams**
- Shows currently running exams
- Monitor student progress live
- Quick access to proctoring tools

**📈 Recent Activity**
- Track latest student submissions
- View grading queue
- Monitor system alerts

**🚀 Quick Actions**
- Create new quizzes instantly
- Import questions from banks
- Generate reports quickly`,
        difficulty: 'beginner',
        estimatedTime: '3 min read'
      },
      {
        id: 'dashboard_tips',
        title: 'Pro Tips for Dashboard',
        description: 'Advanced tips to maximize your dashboard efficiency',
        type: 'tip',
        content: `**Keyboard Shortcuts:**
- Ctrl+N: Create new quiz
- Ctrl+K: Open command palette
- Ctrl+/: View all shortcuts

**Customization:**
- Drag and drop widgets to reorder
- Hide/show sections based on your needs
- Set notification preferences

**Performance:**
- Use filters to focus on specific data
- Bookmark frequently used reports
- Set up automated alerts for important metrics`,
        difficulty: 'intermediate',
        estimatedTime: '5 min read'
      }
    ],
    testbanks: [
      {
        id: 'creating_testbanks',
        title: 'Creating Effective Test Banks',
        description: 'Best practices for organizing and managing question banks',
        type: 'guide',
        content: `**Organization Strategy:**
1. **Subject-Based Banks**: Create separate banks for each subject
2. **Difficulty Levels**: Organize by cognitive complexity
3. **Question Types**: Group similar question formats together
4. **Tagging System**: Use consistent tags for easy filtering

**Quality Standards:**
- Review all AI-generated questions before use
- Maintain consistent difficulty calibration
- Regular content updates and reviews
- Include clear explanations for answers

**Collaboration:**
- Share banks with team members
- Set appropriate permissions
- Track usage analytics
- Get feedback from other educators`,
        difficulty: 'intermediate',
        estimatedTime: '7 min read'
      },
      {
        id: 'ai_question_generation',
        title: 'AI Question Generation Guide',
        description: 'How to effectively use AI to create high-quality questions',
        type: 'guide',
        content: `**Getting Started:**
1. Define your learning objectives clearly
2. Choose appropriate Bloom's taxonomy levels
3. Specify target difficulty range
4. Provide context and reference materials

**Best Practices:**
- Use specific, detailed prompts
- Include example questions for style
- Set appropriate parameters for your needs
- Review and edit AI-generated content

**Quality Assurance:**
- Always review AI suggestions
- Test questions with sample audiences
- Validate against learning objectives
- Maintain consistency with existing content`,
        difficulty: 'beginner',
        estimatedTime: '10 min read'
      }
    ],
    'quiz-builder': [
      {
        id: 'quiz_builder_basics',
        title: 'Quiz Builder Fundamentals',
        description: 'Master the basics of creating professional quizzes',
        type: 'guide',
        content: `**Planning Your Quiz:**
1. **Define Objectives**: What should students learn?
2. **Choose Question Types**: Multiple choice, short answer, etc.
3. **Set Difficulty Progression**: Easy to hard flow
4. **Time Management**: Realistic time limits

**Question Selection:**
- Use a mix of question types
- Balance difficulty levels
- Include formative and summative questions
- Consider cognitive load

**Settings Configuration:**
- Attempt limits and timing
- Randomization options
- Feedback and explanations
- Security settings`,
        difficulty: 'beginner',
        estimatedTime: '8 min read'
      },
      {
        id: 'advanced_quiz_features',
        title: 'Advanced Quiz Features',
        description: 'Explore powerful features for sophisticated assessments',
        type: 'guide',
        content: `**Question Groups:**
- Create thematic question clusters
- Random selection from pools
- Weighted scoring systems
- Conditional logic

**Adaptive Testing:**
- Dynamic difficulty adjustment
- Personalized question paths
- Performance-based branching
- Minimum competency thresholds

**Integration Features:**
- LMS compatibility
- Grade passback
- External tool integration
- API connections`,
        difficulty: 'advanced',
        estimatedTime: '12 min read'
      }
    ],
    analytics: [
      {
        id: 'analytics_basics',
        title: 'Understanding Analytics',
        description: 'Get insights from your student performance data',
        type: 'guide',
        content: `**Key Metrics Explained:**
- **Completion Rate**: Percentage of students who finish
- **Average Score**: Mean performance across all attempts
- **Time Spent**: How long students take on average
- **Difficulty Index**: Which questions are most challenging

**Performance Trends:**
- Track improvement over time
- Identify learning gaps
- Monitor engagement patterns
- Compare cohort performance

**Actionable Insights:**
- Identify struggling students early
- Optimize question difficulty
- Improve content based on data
- Adjust teaching strategies`,
        difficulty: 'beginner',
        estimatedTime: '6 min read'
      },
      {
        id: 'ml_insights',
        title: 'Machine Learning Insights',
        description: 'Leverage AI-powered analytics for deeper understanding',
        type: 'guide',
        content: `**Predictive Analytics:**
- Student success probability
- At-risk student identification
- Performance forecasting
- Intervention recommendations

**Pattern Recognition:**
- Learning behavior analysis
- Engagement correlation
- Question difficulty clustering
- Time management patterns

**Personalization:**
- Individual learning paths
- Adaptive content recommendations
- Customized study plans
- Targeted interventions`,
        difficulty: 'advanced',
        estimatedTime: '10 min read'
      }
    ]
  };

  const currentContent = helpContent[context] || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return <Book className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <ExternalLink className="w-4 h-4" />;
      case 'tip': return <HelpCircle className="w-4 h-4" />;
      default: return <Book className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 right-0 h-full w-96 bg-white border-l shadow-2xl z-50 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Contextual Help</h2>
                  <p className="text-sm text-blue-100 capitalize">{context.replace('-', ' ')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedContent ? (
                <div className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedContent(null)}
                    className="mb-4 text-blue-600"
                  >
                    ← Back to help topics
                  </Button>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{selectedContent.title}</h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge variant="outline" className={getDifficultyColor(selectedContent.difficulty)}>
                          {selectedContent.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {selectedContent.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700">
                        {selectedContent.content}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="guides">Guides</TabsTrigger>
                      <TabsTrigger value="tips">Tips</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="guides" className="space-y-4">
                      {currentContent.filter(item => item.type === 'guide').map((item) => (
                        <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div 
                              className="flex items-start justify-between"
                              onClick={() => setSelectedContent(item)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {getTypeIcon(item.type)}
                                  <h4 className="font-semibold">{item.title}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                                    {item.difficulty}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{item.estimatedTime}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="tips" className="space-y-4">
                      {currentContent.filter(item => item.type === 'tip').map((item) => (
                        <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div 
                              className="flex items-start justify-between"
                              onClick={() => setSelectedContent(item)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {getTypeIcon(item.type)}
                                  <h4 className="font-semibold">{item.title}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                                    {item.difficulty}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{item.estimatedTime}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextualHelp;