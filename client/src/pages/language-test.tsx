import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowRight
} from "lucide-react";

export default function LanguageTest() {
  const { t, i18n } = useTranslation();
  
  const features = [
    {
      icon: BookOpen,
      title: t('landing.features.questionBank.title'),
      description: t('landing.features.questionBank.description')
    },
    {
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description')
    },
    {
      icon: Shield,
      title: t('landing.features.security.title'),
      description: t('landing.features.security.description')
    },
    {
      icon: Users,
      title: t('landing.features.collaboration.title'),
      description: t('landing.features.collaboration.description')
    },
    {
      icon: Zap,
      title: t('landing.features.aiPowered.title'),
      description: t('landing.features.aiPowered.description')
    },
    {
      icon: CheckCircle,
      title: t('landing.features.compliance.title'),
      description: t('landing.features.compliance.description')
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary rounded-lg p-3 mr-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">ProficiencyAI</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            {t('auth.login')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Language Information */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              {t('landing.languageSupport.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                {t('landing.languageSupport.description')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.keys(i18n.store.data).map(lang => (
                  <Button
                    key={lang}
                    variant={i18n.language === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => i18n.changeLanguage(lang)}
                    className="text-xs"
                  >
                    {lang.toUpperCase()}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {t('landing.languageSupport.currentLanguage')}: {i18n.language.toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}