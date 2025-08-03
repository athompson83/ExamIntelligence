import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { 
  Edit, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  ExternalLink, 
  Eye,
  Type,
  Image as ImageIcon,
  List,
  Link,
  Mail,
  Phone,
  Globe,
  Settings,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";

interface LandingPageContent {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    primaryButtonText: string;
    secondaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonLink: string;
  };
  features: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
    features: string[];
  }>;
  faq: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  stats: Array<{
    id: string;
    value: string;
    label: string;
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  footer: {
    companyName: string;
    description: string;
    copyright: string;
  };
}

export default function LandingPageEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hero");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: landingContent, isLoading } = useQuery({
    queryKey: ['/api/landing-content'],
    queryFn: () => apiRequest('/api/landing-content')
  });

  const updateContentMutation = useMutation({
    mutationFn: (data: Partial<LandingPageContent>) => 
      apiRequest('/api/landing-content', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Content updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/landing-content'] });
    }
  });

  const [content, setContent] = useState<LandingPageContent>({
    hero: {
      title: "ProficiencyAI",
      subtitle: "The Future of Educational Assessment",
      description: "Comprehensive educational assessment platform with AI-powered question validation, Computer Adaptive Testing, live proctoring, advanced analytics, and seamless LMS integration.",
      primaryButtonText: "Start Free Trial",
      secondaryButtonText: "Explore Features",
      primaryButtonLink: "/api/login",
      secondaryButtonLink: "#features"
    },
    features: [],
    faq: [],
    stats: [
      { id: "1", value: "99.9%", label: "Uptime Guarantee" },
      { id: "2", value: "7", label: "AI Provider Integration" },
      { id: "3", value: "50M+", label: "Assessments Delivered" },
      { id: "4", value: "24/7", label: "Expert Support" }
    ],
    contact: {
      email: "contact@proficiencyai.com",
      phone: "+1 (555) 123-4567",
      address: "123 Education Blvd, Learning City, LC 12345"
    },
    footer: {
      companyName: "ProficiencyAI",
      description: "Empowering education through intelligent assessment technology",
      copyright: "© 2025 ProficiencyAI. All rights reserved."
    }
  });

  useEffect(() => {
    if (landingContent) {
      setContent(landingContent);
    }
  }, [landingContent]);

  const handleSave = () => {
    updateContentMutation.mutate(content);
  };

  const addFeature = () => {
    const newFeature = {
      id: Date.now().toString(),
      icon: "BookOpen",
      title: "New Feature",
      description: "Feature description",
      features: ["Feature item 1", "Feature item 2"]
    };
    setContent(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
  };

  const addFAQ = () => {
    const newFAQ = {
      id: Date.now().toString(),
      question: "New question?",
      answer: "Answer to the question."
    };
    setContent(prev => ({
      ...prev,
      faq: [...prev.faq, newFAQ]
    }));
  };

  const addStat = () => {
    const newStat = {
      id: Date.now().toString(),
      value: "100%",
      label: "New Statistic"
    };
    setContent(prev => ({
      ...prev,
      stats: [...prev.stats, newStat]
    }));
  };

  const removeItem = (type: string, id: string) => {
    setContent(prev => ({
      ...prev,
      [type]: prev[type as keyof LandingPageContent].filter((item: any) => item.id !== id)
    }));
  };

  const updateItem = (type: string, id: string, updates: any) => {
    setContent(prev => ({
      ...prev,
      [type]: prev[type as keyof LandingPageContent].map((item: any) => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const moveItem = (type: string, index: number, direction: 'up' | 'down') => {
    const items = [...(content[type as keyof LandingPageContent] as any[])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < items.length) {
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      setContent(prev => ({ ...prev, [type]: items }));
    }
  };

  const RichTextEditor = ({ value, onChange, placeholder }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder?: string;
  }) => {
    const [formatting, setFormatting] = useState({
      bold: false,
      italic: false,
      underline: false,
      align: 'left'
    });

    const applyFormatting = (format: string) => {
      document.execCommand(format, false);
      setFormatting(prev => ({
        ...prev,
        [format]: !prev[format as keyof typeof formatting]
      }));
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
          <Button
            variant={formatting.bold ? "default" : "outline"}
            size="sm"
            onClick={() => applyFormatting('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={formatting.italic ? "default" : "outline"}
            size="sm"
            onClick={() => applyFormatting('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={formatting.underline ? "default" : "outline"}
            size="sm"
            onClick={() => applyFormatting('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={() => applyFormatting('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyFormatting('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyFormatting('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        <div
          contentEditable
          className="p-4 min-h-[100px] focus:outline-none"
          dangerouslySetInnerHTML={{ __html: value }}
          onBlur={(e) => onChange(e.target.innerHTML)}
          data-placeholder={placeholder}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Landing Page Editor</h2>
          <p className="text-gray-600">Customize your landing page content and appearance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Live
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateContentMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Type className="mr-2 h-5 w-5" />
                Hero Section Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero-title">Main Title</Label>
                <Input
                  id="hero-title"
                  value={content.hero.title}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    hero: { ...prev.hero, title: e.target.value }
                  }))}
                  className="text-lg font-semibold"
                />
              </div>
              
              <div>
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Input
                  id="hero-subtitle"
                  value={content.hero.subtitle}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    hero: { ...prev.hero, subtitle: e.target.value }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="hero-description">Description</Label>
                <RichTextEditor
                  value={content.hero.description}
                  onChange={(value) => setContent(prev => ({
                    ...prev,
                    hero: { ...prev.hero, description: value }
                  }))}
                  placeholder="Enter hero description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary-button">Primary Button Text</Label>
                  <Input
                    id="primary-button"
                    value={content.hero.primaryButtonText}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      hero: { ...prev.hero, primaryButtonText: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="primary-link">Primary Button Link</Label>
                  <Input
                    id="primary-link"
                    value={content.hero.primaryButtonLink}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      hero: { ...prev.hero, primaryButtonLink: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secondary-button">Secondary Button Text</Label>
                  <Input
                    id="secondary-button"
                    value={content.hero.secondaryButtonText}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      hero: { ...prev.hero, secondaryButtonText: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary-link">Secondary Button Link</Label>
                  <Input
                    id="secondary-link"
                    value={content.hero.secondaryButtonLink}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      hero: { ...prev.hero, secondaryButtonLink: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Feature Cards</h3>
            <Button onClick={addFeature}>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </div>

          {content.features.map((feature, index) => (
            <Card key={feature.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveItem('features', index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveItem('features', index, 'down')}
                      disabled={index === content.features.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem('features', feature.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={feature.title}
                      onChange={(e) => updateItem('features', feature.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Icon (Lucide icon name)</Label>
                    <Input
                      value={feature.icon}
                      onChange={(e) => updateItem('features', feature.id, { icon: e.target.value })}
                      placeholder="e.g. BookOpen, Shield, Zap"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <RichTextEditor
                    value={feature.description}
                    onChange={(value) => updateItem('features', feature.id, { description: value })}
                  />
                </div>

                <div>
                  <Label>Feature List</Label>
                  <div className="space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newFeatures = [...feature.features];
                            newFeatures[itemIndex] = e.target.value;
                            updateItem('features', feature.id, { features: newFeatures });
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newFeatures = feature.features.filter((_, i) => i !== itemIndex);
                            updateItem('features', feature.id, { features: newFeatures });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateItem('features', feature.id, { 
                          features: [...feature.features, 'New feature item'] 
                        });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">FAQ Items</h3>
            <Button onClick={addFAQ}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>

          {content.faq.map((faq, index) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{faq.question}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveItem('faq', index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveItem('faq', index, 'down')}
                      disabled={index === content.faq.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem('faq', faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Question</Label>
                  <Input
                    value={faq.question}
                    onChange={(e) => updateItem('faq', faq.id, { question: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Answer</Label>
                  <RichTextEditor
                    value={faq.answer}
                    onChange={(value) => updateItem('faq', faq.id, { answer: value })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Statistics</h3>
            <Button onClick={addStat}>
              <Plus className="mr-2 h-4 w-4" />
              Add Statistic
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.stats.map((stat, index) => (
              <Card key={stat.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">Stat {index + 1}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem('stats', stat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Value</Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => updateItem('stats', stat.id, { value: e.target.value })}
                        placeholder="e.g. 99.9%, 7, 50M+"
                      />
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => updateItem('stats', stat.id, { label: e.target.value })}
                        placeholder="e.g. Uptime Guarantee"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact-email">
                  <Mail className="inline mr-2 h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="contact-email"
                  value={content.contact.email}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">
                  <Phone className="inline mr-2 h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="contact-phone"
                  value={content.contact.phone}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="contact-address">Address</Label>
                <Textarea
                  id="contact-address"
                  value={content.contact.address}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value }
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={content.footer.companyName}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    footer: { ...prev.footer, companyName: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="footer-description">Description</Label>
                <Textarea
                  id="footer-description"
                  value={content.footer.description}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    footer: { ...prev.footer, description: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="copyright">Copyright Text</Label>
                <Input
                  id="copyright"
                  value={content.footer.copyright}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    footer: { ...prev.footer, copyright: e.target.value }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Landing Page Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 p-4">
            {/* Hero Preview */}
            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg">
              <h1 className="text-4xl font-bold mb-4" dangerouslySetInnerHTML={{ __html: content.hero.title }} />
              <h2 className="text-2xl mb-4" dangerouslySetInnerHTML={{ __html: content.hero.subtitle }} />
              <p className="text-lg mb-6" dangerouslySetInnerHTML={{ __html: content.hero.description }} />
              <div className="flex gap-4 justify-center">
                <Button>{content.hero.primaryButtonText}</Button>
                <Button variant="outline">{content.hero.secondaryButtonText}</Button>
              </div>
            </div>

            {/* Features Preview */}
            {content.features.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.features.slice(0, 4).map(feature => (
                    <Card key={feature.id} className="p-4">
                      <h4 className="font-semibold mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: feature.description }} />
                      <ul className="text-sm space-y-1">
                        {feature.features.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Preview */}
            {content.stats.length > 0 && (
              <div className="bg-blue-600 text-white p-8 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {content.stats.map(stat => (
                    <div key={stat.id}>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-blue-100">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}